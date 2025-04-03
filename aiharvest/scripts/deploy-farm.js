const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("开始部署Farm合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // 定义国库地址和Farm锁定期
  const treasury = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const farmLockDuration = 86400; // 1天
  console.log(`国库地址: ${treasury}`);
  console.log(`Farm锁定期: ${farmLockDuration} 秒`);
  
  // 部署AIH代币
  console.log("\n部署 TestTokenUpgradeable (AIH代币)...");
  const TestToken = await ethers.getContractFactory("TestTokenUpgradeable");
  const aihToken = await TestToken.deploy();
  await aihToken.deployed();
  console.log(`AIH代币合约已部署至: ${aihToken.address}`);
  
  // 初始化AIH代币
  const initAIHTx = await aihToken.initialize("AI Harvest Token", "AIH", 18, ethers.utils.parseEther("0"));
  await initAIHTx.wait();
  console.log(`AIH代币已初始化`);
  
  // 铸造代币到部署者账户
  const initialSupply = ethers.utils.parseEther("1000000");
  const mintTx = await aihToken.mint(deployer.address, initialSupply);
  await mintTx.wait();
  console.log(`已铸造 1000000 AIH代币到部署者账户`);
  
  // 部署Farm实现合约
  console.log("\n部署 FarmUpgradeableV2 (实现合约)...");
  const FarmImplementation = await ethers.getContractFactory("FarmUpgradeableV2");
  const farmImplementation = await FarmImplementation.deploy();
  await farmImplementation.deployed();
  console.log(`Farm实现合约已部署至: ${farmImplementation.address}`);
  
  // 直接部署一个Farm实例
  console.log("\n直接部署一个Farm实例...");
  const Farm = await ethers.getContractFactory("FarmUpgradeableV2");
  const farm = await Farm.deploy();
  await farm.deployed();
  console.log(`Farm实例已部署至: ${farm.address}`);
  
  // 初始化Farm
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    const initFarmTx = await farm.initialize(
      aihToken.address,
      aihToken.address,
      ethers.utils.parseEther("10"),
      blockNumber,
      farmLockDuration,
      deployer.address,
      treasury
    );
    await initFarmTx.wait();
    console.log(`Farm实例已初始化`);
  } catch (error) {
    console.error("Farm初始化失败:", error.message);
  }
  
  // 向Farm发送AIH作为奖励
  try {
    const transferTx = await aihToken.transfer(farm.address, ethers.utils.parseEther("100000"));
    await transferTx.wait();
    console.log(`已向Farm发送100,000个AIH代币作为奖励`);
  } catch (error) {
    console.error("向Farm发送奖励失败:", error.message);
  }
  
  // 存入代币测试
  try {
    const approveTx = await aihToken.approve(farm.address, ethers.utils.parseEther("1000"));
    await approveTx.wait();
    
    // 调用存款函数
    const depositTx = await farm.depositV2(0, ethers.utils.parseEther("1000"));
    await depositTx.wait();
    console.log(`已成功存入1,000个AIH代币到Farm`);
    
    // 检查状态
    const userInfo = await farm.userInfo(0, deployer.address);
    console.log(`用户质押信息: 数量=${ethers.utils.formatEther(userInfo.amount)}，解锁时间=${new Date(userInfo.unlockTime * 1000)}`);
  } catch (error) {
    console.error("存款失败:", error.message);
  }
  
  console.log("\n部署完成!");
  console.log(`AIH代币: ${aihToken.address}`);
  console.log(`Farm实现: ${farmImplementation.address}`);
  console.log(`Farm实例: ${farm.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 