const { ethers } = require("hardhat");

async function main() {
  console.log("获取已部署的Farm地址...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  
  // 连接到Factory合约
  const factoryAddress = "0x390eC54F226ff165D30BF33667178e7094FBb009"; // Sepolia上的Factory地址
  const factory = await ethers.getContractAt("FactoryUpgradeable", factoryAddress);
  console.log(`连接到Factory合约: ${factoryAddress}`);
  
  // 获取Farm信息
  try {
    // 获取所有Farm
    const farmCount = await factory.farmCount();
    console.log(`Farm总数: ${farmCount}`);
    
    const allFarms = await factory.getAllFarms();
    console.log("所有Farm地址:");
    
    if (allFarms.length === 0) {
      console.log("没有找到已部署的Farm");
    } else {
      for (let i = 0; i < allFarms.length; i++) {
        console.log(`Farm #${i}: ${allFarms[i]}`);
        
        // 验证Farm是否可访问
        try {
          const farm = await ethers.getContractAt("FarmUpgradeableV2", allFarms[i]);
          const poolCount = await farm.poolInfo.length;
          console.log(`  - 池子数量: ${poolCount}`);
        } catch (error) {
          console.log(`  - 无法连接到Farm: ${error.message}`);
        }
      }
    }
    
    // 获取创建者的Farm
    const creatorFarms = await factory.getMyFarms();
    console.log("\n当前账户创建的Farm:");
    
    if (creatorFarms.length === 0) {
      console.log("当前账户没有创建Farm");
    } else {
      for (let i = 0; i < creatorFarms.length; i++) {
        console.log(`Farm #${i}: ${creatorFarms[i]}`);
      }
    }
    
    // 获取Farm实现地址
    const farmImpl = await factory.farmImplementation();
    console.log(`\nFarm实现合约地址: ${farmImpl}`);
    
  } catch (error) {
    console.error("获取Farm信息失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 