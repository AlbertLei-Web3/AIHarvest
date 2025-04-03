const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("获取Sepolia网络部署摘要...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // 已部署合约地址
  const contracts = {
    AIHToken: "0xFcB512f45172aa1e331D926321eaA1C52D7dce8E",
    USDCToken: "0xB35B48631b69478f28E4365CC1794E378Ad0FA02",
    Factory: "0xbE2565c7Ba75138a7E2Ab46a3573883cbc9DA4e5",
    AIHFarm: "0x646A4B2b5e2F4096702170Ac795689D3265640f9",
    USDCFarm: "0x455fA35550d3Ed280f4658Ae04f52ec6a494Cd2a",
    SwapRouter: "0x505c363bC6A51c955DAdA4cC8b751273a20A2918"
  };
  
  console.log("\n=== 部署合约地址 ===");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  // 连接到合约
  const aihToken = await ethers.getContractAt("TestTokenUpgradeable", contracts.AIHToken);
  const usdcToken = await ethers.getContractAt("TestTokenUpgradeable", contracts.USDCToken);
  const factory = await ethers.getContractAt("FactoryUpgradeable", contracts.Factory);
  const aihFarm = await ethers.getContractAt("FarmUpgradeableV2", contracts.AIHFarm);
  const usdcFarm = await ethers.getContractAt("FarmUpgradeableV2", contracts.USDCFarm);
  const swapRouter = await ethers.getContractAt("SwapRouterUpgradeableV2", contracts.SwapRouter);
  
  // 检查代币信息
  console.log("\n=== 代币信息 ===");
  try {
    const aihName = await aihToken.name();
    const aihSymbol = await aihToken.symbol();
    const aihDecimals = await aihToken.decimals();
    const aihTotalSupply = await aihToken.totalSupply();
    
    console.log(`AIH代币名称: ${aihName}`);
    console.log(`AIH代币符号: ${aihSymbol}`);
    console.log(`AIH代币精度: ${aihDecimals}`);
    console.log(`AIH代币总供应量: ${ethers.utils.formatEther(aihTotalSupply)}`);
    
    const usdcName = await usdcToken.name();
    const usdcSymbol = await usdcToken.symbol();
    const usdcDecimals = await usdcToken.decimals();
    const usdcTotalSupply = await usdcToken.totalSupply();
    
    console.log(`\nUSDC代币名称: ${usdcName}`);
    console.log(`USDC代币符号: ${usdcSymbol}`);
    console.log(`USDC代币精度: ${usdcDecimals}`);
    console.log(`USDC代币总供应量: ${ethers.utils.formatEther(usdcTotalSupply)}`);
  } catch (error) {
    console.error("检查代币信息失败:", error.message);
  }
  
  // 检查Farm信息
  console.log("\n=== Farm信息 ===");
  try {
    // 检查AIH Farm
    try {
      const aihFarmRewardToken = await aihFarm.rewardToken();
      const aihPoolInfo = await aihFarm.poolInfo(0);
      
      console.log("AIH Farm信息:");
      console.log(`- 奖励代币: ${aihFarmRewardToken}`);
      console.log(`- 质押代币: ${aihPoolInfo.lpToken}`);
      console.log(`- 分配权重: ${aihPoolInfo.allocPoint}`);
      console.log(`- 锁定期: ${aihPoolInfo.lockDuration} 秒`);
    } catch (error) {
      console.log("获取AIH Farm信息失败:", error.message);
    }
    
    // 检查USDC Farm
    try {
      const usdcFarmRewardToken = await usdcFarm.rewardToken();
      const usdcPoolInfo = await usdcFarm.poolInfo(0);
      
      console.log("\nUSDC Farm信息:");
      console.log(`- 奖励代币: ${usdcFarmRewardToken}`);
      console.log(`- 质押代币: ${usdcPoolInfo.lpToken}`);
      console.log(`- 分配权重: ${usdcPoolInfo.allocPoint}`);
      console.log(`- 锁定期: ${usdcPoolInfo.lockDuration} 秒`);
    } catch (error) {
      console.log("获取USDC Farm信息失败:", error.message);
    }
  } catch (error) {
    console.error("检查Farm信息失败:", error.message);
  }
  
  // 检查SwapRouter信息
  console.log("\n=== SwapRouter信息 ===");
  try {
    const fee = await swapRouter.fee();
    const treasury = await swapRouter.treasury();
    
    console.log(`交换费率: ${fee} 基点`);
    console.log(`国库地址: ${treasury}`);
    
    try {
      const exchangeRate = await swapRouter.getExchangeRate(contracts.AIHToken, contracts.USDCToken);
      console.log(`AIH -> USDC交换率: ${ethers.utils.formatEther(exchangeRate)}`);
    } catch (error) {
      console.log("获取AIH->USDC交换率失败:", error.message);
    }
    
    try {
      const exchangeRate = await swapRouter.getExchangeRate(contracts.USDCToken, contracts.AIHToken);
      console.log(`USDC -> AIH交换率: ${ethers.utils.formatEther(exchangeRate)}`);
    } catch (error) {
      console.log("获取USDC->AIH交换率失败:", error.message);
    }
  } catch (error) {
    console.error("检查SwapRouter信息失败:", error.message);
  }
  
  // 保存部署信息到文件
  const deploymentInfo = {
    network: {
      name: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId
    },
    deployer: deployer.address,
    contracts: {
      AIHToken: {
        address: contracts.AIHToken,
        name: "AI Harvest Token",
        symbol: "AIH"
      },
      USDCToken: {
        address: contracts.USDCToken,
        name: "USD Coin",
        symbol: "USDC"
      },
      Factory: {
        address: contracts.Factory
      },
      AIHFarm: {
        address: contracts.AIHFarm,
        stakingToken: contracts.AIHToken,
        rewardToken: contracts.AIHToken
      },
      USDCFarm: {
        address: contracts.USDCFarm,
        stakingToken: contracts.USDCToken,
        rewardToken: contracts.AIHToken
      },
      SwapRouter: {
        address: contracts.SwapRouter
      }
    },
    timestamp: new Date().toISOString()
  };
  
  // 创建deployments目录如果不存在
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // 保存部署信息到文件
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}-deployment-final.json`);
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n部署信息已保存至: ${deploymentFile}`);
  
  // 生成contracts.json文件供前端使用
  const contractsJson = {
    networkName: networkName,
    chainId: (await ethers.provider.getNetwork()).chainId,
    contracts: {
      AIHToken: {
        address: contracts.AIHToken,
        abi: "TestTokenUpgradeable.json"
      },
      USDCToken: {
        address: contracts.USDCToken,
        abi: "TestTokenUpgradeable.json"
      },
      Factory: {
        address: contracts.Factory,
        abi: "FactoryUpgradeable.json"
      },
      AIHFarm: {
        address: contracts.AIHFarm,
        abi: "FarmUpgradeableV2.json"
      },
      USDCFarm: {
        address: contracts.USDCFarm,
        abi: "FarmUpgradeableV2.json"
      },
      SwapRouter: {
        address: contracts.SwapRouter,
        abi: "SwapRouterUpgradeableV2.json"
      }
    },
    deploymentTimestamp: new Date().toISOString()
  };
  
  const contractsJsonFile = path.join(deploymentsDir, `contracts-final.json`);
  fs.writeFileSync(
    contractsJsonFile,
    JSON.stringify(contractsJson, null, 2)
  );
  console.log(`Contracts信息已保存至: ${contractsJsonFile}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 