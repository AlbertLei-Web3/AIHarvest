// 部署可升级合约的脚本
const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("开始部署可升级合约...");

  // 部署可升级版本的TestToken
  const TestTokenUpgradeable = await ethers.getContractFactory("TestTokenUpgradeable");
  console.log("部署 TestTokenUpgradeable...");
  const testToken = await upgrades.deployProxy(TestTokenUpgradeable, 
    ["AI Harvest Token", "AIH", 18, ethers.utils.parseEther("1000000")], 
    { kind: 'uups' }
  );
  await testToken.deployed();
  console.log("TestTokenUpgradeable 已部署到:", testToken.address);

  // 部署FarmUpgradeable实现合约作为基础实现
  const FarmUpgradeable = await ethers.getContractFactory("FarmUpgradeable");
  console.log("部署 FarmUpgradeable 实现合约...");
  const farmImplementation = await FarmUpgradeable.deploy();
  await farmImplementation.deployed();
  console.log("FarmUpgradeable 实现合约已部署到:", farmImplementation.address);

  // 部署SwapRouterUpgradeable实现合约作为基础实现
  const SwapRouterUpgradeable = await ethers.getContractFactory("SwapRouterUpgradeable");
  console.log("部署 SwapRouterUpgradeable 实现合约...");
  const swapRouterImplementation = await SwapRouterUpgradeable.deploy();
  await swapRouterImplementation.deployed();
  console.log("SwapRouterUpgradeable 实现合约已部署到:", swapRouterImplementation.address);

  // 部署FactoryUpgradeable合约
  const FactoryUpgradeable = await ethers.getContractFactory("FactoryUpgradeable");
  console.log("部署 FactoryUpgradeable...");
  const factory = await upgrades.deployProxy(FactoryUpgradeable, 
    [farmImplementation.address, swapRouterImplementation.address], 
    { kind: 'uups' }
  );
  await factory.deployed();
  console.log("FactoryUpgradeable 已部署到:", factory.address);

  // 通过工厂创建SwapRouter
  console.log("通过工厂创建 SwapRouter...");
  const createSwapRouterTx = await factory.createSwapRouter();
  const receipt = await createSwapRouterTx.wait();
  
  // 从事件中获取SwapRouter地址
  const swapRouterCreatedEvent = receipt.events.find(event => event.event === 'SwapRouterCreated');
  const swapRouterAddress = swapRouterCreatedEvent.args.swapRouter;
  console.log("SwapRouter 已创建在地址:", swapRouterAddress);

  // 创建一个Farm示例
  console.log("创建示例Farm...");
  const currentBlockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;
  const startTime = currentBlockTimestamp + 3600; // 1小时后开始
  const rewardPerSecond = ethers.utils.parseEther("0.1"); // 每秒0.1个代币作为奖励

  const createFarmTx = await factory.createFarm(
    testToken.address,
    rewardPerSecond,
    startTime
  );
  const farmReceipt = await createFarmTx.wait();
  
  // 从事件中获取Farm地址
  const farmCreatedEvent = farmReceipt.events.find(event => event.event === 'FarmCreated');
  const farmAddress = farmCreatedEvent.args.farm;
  console.log("Farm 已创建在地址:", farmAddress);

  // 将一些测试代币转移到Farm合约
  console.log("向Farm合约转移测试代币...");
  const transferAmount = ethers.utils.parseEther("10000"); // 10,000个代币
  await testToken.transfer(farmAddress, transferAmount);
  console.log(`已转移 ${ethers.utils.formatEther(transferAmount)} 个测试代币到Farm合约`);

  // 输出所有部署的合约地址摘要
  console.log("\n部署摘要:");
  console.log("===========================================");
  console.log("TestTokenUpgradeable:", testToken.address);
  console.log("FarmUpgradeable实现:", farmImplementation.address);
  console.log("SwapRouterUpgradeable实现:", swapRouterImplementation.address);
  console.log("FactoryUpgradeable:", factory.address);
  console.log("SwapRouter:", swapRouterAddress);
  console.log("示例Farm:", farmAddress);
  console.log("===========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 