const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("生成Sepolia网络最终部署摘要...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // 尝试读取部署信息文件
  const deploymentsDir = path.join(__dirname, '../deployments');
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}-deployment-final.json`);
  
  let deploymentInfo = {};
  if (fs.existsSync(deploymentFile)) {
    try {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      console.log(`已读取部署信息文件: ${deploymentFile}`);
    } catch (error) {
      console.error("读取部署信息文件失败:", error.message);
    }
  } else {
    console.log("部署信息文件不存在，将使用硬编码地址");
  }
  
  // 最新已知的部署地址 (如果部署文件不存在，使用这些)
  const contracts = {
    AIHToken: deploymentInfo.contracts?.AIHToken?.address || "0xFcB512f45172aa1e331D926321eaA1C52D7dce8E",
    USDCToken: deploymentInfo.contracts?.USDCToken?.address || "0xB35B48631b69478f28E4365CC1794E378Ad0FA02",
    Factory: deploymentInfo.contracts?.Factory?.address || "0xbE2565c7Ba75138a7E2Ab46a3573883cbc9DA4e5",
    AIHFarm: deploymentInfo.contracts?.AIHFarm?.address || "0x646A4B2b5e2F4096702170Ac795689D3265640f9",
    USDCFarm: deploymentInfo.contracts?.USDCFarm?.address || "0x455fA35550d3Ed280f4658Ae04f52ec6a494Cd2a",
    SwapRouter: deploymentInfo.contracts?.SwapRouter?.address || "0x7DF386a104DD469fB7C51CA583be69a5C4FEa887" // 根据最新部署修改
  };
  
  console.log("\n=== 最终部署地址 ===");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`${name}: ${address}`);
  });
  
  // 连接到合约
  try {
    const aihToken = await ethers.getContractAt("TestTokenUpgradeable", contracts.AIHToken);
    const usdcToken = await ethers.getContractAt("TestTokenUpgradeable", contracts.USDCToken);
    const factory = await ethers.getContractAt("FactoryUpgradeable", contracts.Factory);
    const aihFarm = await ethers.getContractAt("FarmUpgradeableV2", contracts.AIHFarm);
    const usdcFarm = await ethers.getContractAt("FarmUpgradeableV2", contracts.USDCFarm);
    const swapRouter = await ethers.getContractAt("SwapRouterUpgradeable", contracts.SwapRouter);
    
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
      console.error("获取代币信息失败:", error.message);
    }
    
    // 检查SwapRouter信息
    console.log("\n=== SwapRouter信息 ===");
    try {
      const fee = await swapRouter.fee();
      const treasury = await swapRouter.treasury();
      const feeConstant = await swapRouter.FEE_DENOMINATOR();
      
      console.log(`交换费率: ${fee} 基点 (${Number(fee) / Number(feeConstant) * 100}%)`);
      console.log(`国库地址: ${treasury}`);
      
      // 检查汇率
      try {
        const exchangeRate = await swapRouter.exchangeRates(contracts.AIHToken, contracts.USDCToken);
        console.log(`AIH -> USDC交换率: ${ethers.utils.formatEther(exchangeRate)}`);
      } catch (error) {
        console.log("获取AIH->USDC交换率失败:", error.message);
      }
      
      try {
        const exchangeRate = await swapRouter.exchangeRates(contracts.USDCToken, contracts.AIHToken);
        console.log(`USDC -> AIH交换率: ${ethers.utils.formatEther(exchangeRate)}`);
      } catch (error) {
        console.log("获取USDC->AIH交换率失败:", error.message);
      }
    } catch (error) {
      console.error("获取SwapRouter信息失败:", error.message);
    }

    // 检查Farm信息
    console.log("\n=== Farm信息 ===");
    try {
      // AIH Farm
      try {
        const aihFarmRewardToken = await aihFarm.rewardToken();
        console.log("AIH Farm信息:");
        console.log(`- 奖励代币: ${aihFarmRewardToken}`);
        
        try {
          const poolInfo = await aihFarm.poolInfo(0);
          console.log(`- 质押代币: ${poolInfo.lpToken}`);
          console.log(`- 分配权重: ${poolInfo.allocPoint}`);
          console.log(`- 锁定期: ${poolInfo.lockDuration} 秒`);
        } catch (error) {
          console.log("  获取池子信息失败:", error.message);
        }
      } catch (error) {
        console.log("获取AIH Farm信息失败:", error.message);
      }
      
      // USDC Farm
      try {
        const usdcFarmRewardToken = await usdcFarm.rewardToken();
        console.log("\nUSDC Farm信息:");
        console.log(`- 奖励代币: ${usdcFarmRewardToken}`);
        
        try {
          const poolInfo = await usdcFarm.poolInfo(0);
          console.log(`- 质押代币: ${poolInfo.lpToken}`);
          console.log(`- 分配权重: ${poolInfo.allocPoint}`);
          console.log(`- 锁定期: ${poolInfo.lockDuration} 秒`);
        } catch (error) {
          console.log("  获取池子信息失败:", error.message);
        }
      } catch (error) {
        console.log("获取USDC Farm信息失败:", error.message);
      }
    } catch (error) {
      console.error("获取Farm信息失败:", error.message);
    }
    
    // 检查Factory信息
    console.log("\n=== Factory信息 ===");
    try {
      const farmImpl = await factory.farmImplementation();
      const farmCount = await factory.farmCount();
      const allFarms = await factory.getAllFarms();
      
      console.log(`Farm实现地址: ${farmImpl}`);
      console.log(`已创建Farm数量: ${farmCount}`);
      
      console.log("所有Farm地址:");
      allFarms.forEach((farm, index) => {
        console.log(`- Farm ${index}: ${farm}`);
      });
    } catch (error) {
      console.error("获取Factory信息失败:", error.message);
    }
  } catch (error) {
    console.error("连接合约失败:", error.message);
  }
  
  // 更新并保存最终部署信息
  const finalDeploymentInfo = {
    network: {
      name: networkName,
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
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // 保存最终部署信息
  fs.writeFileSync(
    path.join(deploymentsDir, `${networkName}-deployment-final.json`),
    JSON.stringify(finalDeploymentInfo, null, 2)
  );
  console.log(`\n最终部署信息已保存至: ${networkName}-deployment-final.json`);
  
  // 更新contracts.json
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
        abi: "SwapRouterUpgradeable.json"
      }
    },
    deploymentTimestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(deploymentsDir, `contracts-final.json`),
    JSON.stringify(contractsJson, null, 2)
  );
  console.log(`最终合约信息已保存至: contracts-final.json`);
  
  console.log("\n=== 部署完成 ===");
  console.log("所有合约已成功部署到Sepolia测试网");
  console.log("📝 请保存上述合约地址，用于前端开发和测试");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });