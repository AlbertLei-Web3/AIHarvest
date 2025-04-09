// deploy-simple-farm.js
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("开始部署简化版Farm合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  
  // 配置信息
  const configPath = path.join(__dirname, '../deployments/contracts-config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  
  const aihTokenAddress = config.networks[networkName].tokens.AIH.address;
  console.log(`使用AIH代币: ${aihTokenAddress}`);
  
  // 连接到AIH代币
  const aihToken = await ethers.getContractAt("TestTokenUpgradeableV2", aihTokenAddress);
  
  // 部署SimpleFarm合约
  console.log("\n部署SimpleFarm合约...");
  const SimpleFarm = await ethers.getContractFactory("SimpleFarm");
  
  const startTime = Math.floor(Date.now() / 1000);
  const lockDuration = 86400; // 1天
  
  const simpleFarm = await SimpleFarm.deploy(
    aihTokenAddress,           // 奖励代币
    aihTokenAddress,           // 质押代币
    ethers.parseEther("0.01"), // 每秒奖励
    startTime,                 // 开始时间
    lockDuration,              // 锁定期
    deployer.address           // 国库地址
  );
  
  await simpleFarm.waitForDeployment();
  const farmAddress = await simpleFarm.getAddress();
  
  console.log(`SimpleFarm合约已部署至: ${farmAddress}`);
  
  // 验证合约是否正确部署
  console.log("\n验证合约状态:");
  
  const owner = await simpleFarm.owner();
  console.log(`合约所有者: ${owner}`);
  
  const rewardToken = await simpleFarm.rewardToken();
  console.log(`奖励代币: ${rewardToken}`);
  
  const treasury = await simpleFarm.treasury();
  console.log(`国库地址: ${treasury}`);
  
  // 向Farm合约添加奖励代币
  console.log("\n向Farm合约添加奖励代币...");
  const rewardAmount = ethers.parseEther("1000");
  
  // 检查AIH余额
  const balance = await aihToken.balanceOf(deployer.address);
console.log(`当前AIH余额: ${ethers.formatEther(balance)} AIH`);

// 使用gt()而不是gte，或者使用比较运算符
if (balance >= rewardAmount) {  // 对于ethers v6
  // 或者 if (BigInt(balance) >= BigInt(rewardAmount)) 
  // 转移代币
  const transferTx = await aihToken.transfer(farmAddress, rewardAmount);
  await transferTx.wait();
  console.log(`已向Farm合约添加 ${ethers.formatEther(rewardAmount)} AIH作为奖励`);
  
  // 验证Farm合约余额
  const farmBalance = await aihToken.balanceOf(farmAddress);
  console.log(`Farm合约AIH余额: ${ethers.formatEther(farmBalance)} AIH`);
} else {
  console.log("AIH余额不足，无法添加足够的奖励");
}
  
  // 更新配置
  console.log("\n更新配置文件...");
  
  if (!config.networks[networkName].contracts) {
    config.networks[networkName].contracts = {};
  }
  
  config.networks[networkName].contracts.SimpleFarm = {
    address: farmAddress,
    abiFile: "SimpleFarm.json",
    deployed: true
  };
  
  config.lastUpdate = new Date().toISOString();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log(`配置文件已更新: ${configPath}`);
  
  // 测试质押功能
  // 测试质押功能
console.log("\n测试质押功能:");
const stakeAmount = ethers.parseEther("10");

if (balance > rewardAmount + stakeAmount) {  // 使用 > 而不是 gt
  // 批准SimpleFarm合约使用代币
  const approveTx = await aihToken.approve(farmAddress, stakeAmount);
  await approveTx.wait();
  console.log(`已批准SimpleFarm合约使用 ${ethers.formatEther(stakeAmount)} AIH`);
  
  // 质押代币
  const depositTx = await simpleFarm.deposit(stakeAmount);
  await depositTx.wait();
  console.log(`已成功质押 ${ethers.formatEther(stakeAmount)} AIH`);
  
  // 获取用户质押信息
  const userInfo = await simpleFarm.userInfo(deployer.address);
// 如果userInfo返回的是数组而不是对象
console.log(`用户质押数量: ${ethers.formatEther(userInfo[0])} AIH`);
console.log(`解锁时间: ${new Date(Number(userInfo[2]) * 1000).toLocaleString()}`);
} else {
  console.log("AIH余额不足，无法进行质押测试");
}
  
  // 提取前端ABI
  console.log("\n提取ABI供前端使用...");
  
  // 创建前端ABI目录
  const frontendAbiDir = path.join(__dirname, '../../frontend-react/src/abis');
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }
  
  // 复制SimpleFarm ABI
  const simpleFarmAbiPath = path.join(__dirname, '../artifacts/contracts/SimpleFarm.sol/SimpleFarm.json');
  const simpleFarmAbi = JSON.parse(fs.readFileSync(simpleFarmAbiPath, 'utf8')).abi;
  
  fs.writeFileSync(
    path.join(frontendAbiDir, 'SimpleFarm.json'),
    JSON.stringify(simpleFarmAbi, null, 2)
  );
  
  console.log(`SimpleFarm ABI已复制到前端目录: ${path.join(frontendAbiDir, 'SimpleFarm.json')}`);
  console.log("\n✅ 部署成功!");
  console.log(`SimpleFarm合约地址: ${farmAddress}`);
  console.log("请在前端使用此合约地址");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });