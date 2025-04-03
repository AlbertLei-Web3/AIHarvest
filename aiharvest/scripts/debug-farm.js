const { ethers } = require("hardhat");

async function main() {
  console.log("开始调试Farm创建问题...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  
  // 获取已部署合约的地址
  const factoryAddress = "0xdeAf13D001680D6f18dA6552576A44259553E35c";
  const aihTokenAddress = "0x0d6C900FaEe29D49E9De80b3fadcaFD4d96F4394";
  const farmImplementationAddress = "0x2F46798dc807fF1330280102A824b061285ae345";
  
  // 连接到合约
  const factory = await ethers.getContractAt("FactoryUpgradeable", factoryAddress);
  const aihToken = await ethers.getContractAt("TestTokenUpgradeable", aihTokenAddress);
  const farmImplementation = await ethers.getContractAt("FarmUpgradeableV2", farmImplementationAddress);
  
  // 打印当前状态
  console.log(`Factory地址: ${factoryAddress}`);
  console.log(`AIH代币地址: ${aihTokenAddress}`);
  console.log(`Farm实现地址: ${farmImplementationAddress}`);
  
  try {
    // 检查当前Farm实现
    const currentImpl = await factory.farmImplementation();
    console.log(`当前注册的Farm实现: ${currentImpl}`);
    console.log(`Farm实现是否匹配: ${currentImpl === farmImplementationAddress}`);
    
    // 检查createFarm函数的参数
    console.log("\n尝试调用createFarm函数...");
    
    // 获取当前区块
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log(`当前区块: ${currentBlock}`);
    
    // 设置Farm参数
    const rewardToken = aihTokenAddress;
    const stakingToken = aihTokenAddress;
    const rewardPerBlock = ethers.utils.parseEther("5");
    const startBlock = currentBlock;
    const lockPeriod = 86400; // 1天 
    
    console.log(`奖励代币: ${rewardToken}`);
    console.log(`质押代币: ${stakingToken}`);
    console.log(`每区块奖励: ${ethers.utils.formatEther(rewardPerBlock)}`);
    console.log(`开始区块: ${startBlock}`);
    console.log(`锁定期: ${lockPeriod}秒`);
    
    // 模拟调用createFarm (不实际执行交易)
    console.log("\n模拟调用createFarm...");
    try {
      await factory.callStatic.createFarm(
        rewardToken,
        stakingToken,
        rewardPerBlock,
        startBlock,
        lockPeriod
      );
      console.log("静态调用成功，函数参数正确");
    } catch (error) {
      console.error("静态调用失败:", error.message);
      
      // 检查函数签名是否匹配
      const factoryInterface = factory.interface;
      const functions = factoryInterface.functions;
      console.log("\nFactory合约可用函数:");
      Object.keys(functions).forEach(key => {
        if (key.startsWith("createFarm(")) {
          console.log(`- ${key}`);
        }
      });
    }
    
    // 尝试直接获取函数参数信息
    console.log("\n检查Factory合约的createFarm函数签名...");
    const factoryCode = await ethers.provider.getCode(factoryAddress);
    console.log(`Factory合约代码长度: ${factoryCode.length}`);
    
  } catch (error) {
    console.error("调试过程中发生错误:", error.message);
    throw error;
  }
  
  console.log("\n调试完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 