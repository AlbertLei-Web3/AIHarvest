const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// 加载配置
function loadConfig() {
  try {
    const configPath = path.join(__dirname, "../deployments/contracts-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config;
  } catch (error) {
    console.error("Error loading config:", error);
    throw error;
  }
}

async function main() {
  console.log("开始检查农场状态...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  
  // 获取账户余额
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`账户余额: ${ethers.formatEther(balance)} ETH`);
  
  // 加载配置
  const config = loadConfig();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  console.log(`当前网络: ${networkName} (chainId: ${network.chainId})`);
  
  const networkConfig = config.networks[networkName] || config.networks["sepolia"];
  
  // 获取农场地址
  let farmAddress = networkConfig.contracts.FarmUpgradeableV2.address;
  
  // 如果配置中没有农场地址，从环境变量获取
  if (!farmAddress || farmAddress === "") {
    farmAddress = process.env.FARM_ADDRESS;
    
    if (farmAddress) {
      console.log(`使用环境变量提供的农场地址: ${farmAddress}`);
    } else {
      console.log(`配置中没有找到农场地址，请设置环境变量 FARM_ADDRESS`);
      console.log(`示例: set FARM_ADDRESS=0x农场地址 && npx hardhat run scripts/check-farm.js --network sepolia`);
      return;
    }
  }
  
  console.log(`农场地址: ${farmAddress}`);
  
  // 基础的农场ABI，仅包含我们需要的查询函数
  const farmAbi = [
    "function rewardToken() view returns (address)",
    "function stakingToken() view returns (address)",
    "function poolInfo() view returns (uint256 totalStaked, uint256 accRewardPerShare, uint256 lastRewardBlock, uint256 startBlock, uint256 rewardPerBlock)",
    "function pendingReward(address user) view returns (uint256)",
    "function userInfo(address user) view returns (uint256 amount, uint256 rewardDebt, uint256 lastDepositTime)",
    "function treasury() view returns (address)",
    "function owner() view returns (address)",
    "function getMultiplier(uint256 from, uint256 to) view returns (uint256)"
  ];
  
  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function balanceOf(address) view returns (uint256)"
  ];
  
  try {
    // 连接到农场合约
    const farm = new ethers.Contract(farmAddress, farmAbi, deployer);
    
    // 获取农场基本信息
    const rewardTokenAddress = await farm.rewardToken();
    const stakingTokenAddress = await farm.stakingToken();
    const treasuryAddress = await farm.treasury();
    const ownerAddress = await farm.owner();
    
    console.log("\n农场基本信息:");
    console.log(`奖励代币地址: ${rewardTokenAddress}`);
    console.log(`质押代币地址: ${stakingTokenAddress}`);
    console.log(`国库地址: ${treasuryAddress}`);
    console.log(`所有者地址: ${ownerAddress}`);
    
    // 连接到代币合约
    const rewardToken = new ethers.Contract(rewardTokenAddress, erc20Abi, deployer);
    const stakingToken = new ethers.Contract(stakingTokenAddress, erc20Abi, deployer);
    
    // 获取代币信息
    const rewardSymbol = await rewardToken.symbol();
    const stakingSymbol = await stakingToken.symbol();
    const rewardDecimals = await rewardToken.decimals();
    const stakingDecimals = await stakingToken.decimals();
    
    console.log(`\n代币信息:`);
    console.log(`奖励代币: ${rewardSymbol}`);
    console.log(`质押代币: ${stakingSymbol}`);
    
    // 获取池子信息
    const poolInfo = await farm.poolInfo();
    console.log(`\n池子信息:`);
    console.log(`总质押量: ${ethers.formatUnits(poolInfo[0], stakingDecimals)} ${stakingSymbol}`);
    console.log(`每份累积奖励: ${ethers.formatUnits(poolInfo[1], 12)}`);
    console.log(`上次奖励区块: ${poolInfo[2]}`);
    console.log(`开始区块: ${poolInfo[3]}`);
    console.log(`每区块奖励: ${ethers.formatUnits(poolInfo[4], rewardDecimals)} ${rewardSymbol}`);
    
    // 检查用户信息
    const userInfo = await farm.userInfo(deployer.address);
    console.log(`\n用户信息 (${deployer.address}):`);
    console.log(`质押数量: ${ethers.formatUnits(userInfo[0], stakingDecimals)} ${stakingSymbol}`);
    console.log(`奖励债务: ${ethers.formatUnits(userInfo[1], rewardDecimals)}`);
    console.log(`上次质押时间: ${new Date(userInfo[2] * 1000).toLocaleString()}`);
    
    // 计算待领取奖励
    const pendingReward = await farm.pendingReward(deployer.address);
    console.log(`\n待领取奖励: ${ethers.formatUnits(pendingReward, rewardDecimals)} ${rewardSymbol}`);
    
    // 检查代币余额
    const rewardBalance = await rewardToken.balanceOf(deployer.address);
    const stakingBalance = await stakingToken.balanceOf(deployer.address);
    
    console.log(`\n钱包余额:`);
    console.log(`${rewardSymbol}: ${ethers.formatUnits(rewardBalance, rewardDecimals)}`);
    console.log(`${stakingSymbol}: ${ethers.formatUnits(stakingBalance, stakingDecimals)}`);
    
    // 计算基本的年化收益率(APR)
    try {
      const currentBlock = await ethers.provider.getBlockNumber();
      console.log(`\n当前区块: ${currentBlock}`);
      
      if (poolInfo[0] > 0) { // 如果有质押
        // 估算每年区块数 (按每15秒一个区块计算)
        const blocksPerYear = (365 * 24 * 60 * 60) / 15;
        
        // 每年的奖励代币数量
        const yearlyRewards = poolInfo[4] * blocksPerYear;
        
        // 计算APR
        const apr = (yearlyRewards * 100) / poolInfo[0];
        console.log(`估算的年化收益率(APR): ${apr.toFixed(2)}%`);
      } else {
        console.log(`没有足够的质押数据来计算APR`);
      }
    } catch (error) {
      console.log(`计算APR时出错: ${error.message}`);
    }
  } catch (error) {
    console.error(`检查农场时出错: ${error.message}`);
  }
  
  console.log("\n农场检查完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 