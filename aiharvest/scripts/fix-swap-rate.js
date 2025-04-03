const { ethers } = require("hardhat");

async function main() {
  console.log("修复SwapRouter交换率设置...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // 连接到已部署的合约
  const swapRouterAddress = "0x505c363bC6A51c955DAdA4cC8b751273a20A2918";
  const aihTokenAddress = "0xFcB512f45172aa1e331D926321eaA1C52D7dce8E";
  const usdcTokenAddress = "0xB35B48631b69478f28E4365CC1794E378Ad0FA02";
  
  // 直接使用V2接口
  const swapRouter = await ethers.getContractAt("SwapRouterUpgradeableV2", swapRouterAddress);
  const aihToken = await ethers.getContractAt("TestTokenUpgradeable", aihTokenAddress);
  const usdcToken = await ethers.getContractAt("TestTokenUpgradeable", usdcTokenAddress);
  
  console.log(`SwapRouter地址: ${swapRouterAddress}`);
  console.log(`AIH代币地址: ${aihTokenAddress}`);
  console.log(`USDC代币地址: ${usdcTokenAddress}`);
  
  // 获取SwapRouter状态
  try {
    const fee = await swapRouter.fee();
    console.log(`当前交换费率: ${fee} 基点`);
    
    const treasury = await swapRouter.treasury();
    console.log(`国库地址: ${treasury}`);
    
    // 尝试获取交换率
    console.log("\n检查当前交换率...");
    try {
      const rate = await swapRouter.getExchangeRate(aihTokenAddress, usdcTokenAddress);
      console.log(`当前AIH-USDC交换率: ${ethers.utils.formatEther(rate)}`);
    } catch (error) {
      console.log(`获取交换率失败: ${error.message}`);
      console.log("可能尚未设置交换率");
    }
  } catch (error) {
    console.error("获取SwapRouter状态失败:", error.message);
  }
  
  // 尝试设置交换率 - 增加gas限制
  console.log("\n尝试设置交换率...");
  const txOptions = { gasLimit: 5000000 };
  
  try {
    // 添加流动性前先批准代币
    console.log("批准代币转账...");
    const approveAIHTx = await aihToken.approve(swapRouterAddress, ethers.utils.parseEther("100000"), txOptions);
    await approveAIHTx.wait();
    console.log("AIH代币已批准");
    
    const approveUSDCTx = await usdcToken.approve(swapRouterAddress, ethers.utils.parseEther("100000"), txOptions);
    await approveUSDCTx.wait();
    console.log("USDC代币已批准");
    
    // 添加流动性
    console.log("添加流动性...");
    try {
      const addLiquidityTx = await swapRouter.addLiquidity(
        aihTokenAddress,
        usdcTokenAddress,
        ethers.utils.parseEther("100000"),
        ethers.utils.parseEther("100000"),
        txOptions
      );
      await addLiquidityTx.wait();
      console.log("流动性已添加");
    } catch (error) {
      console.log(`添加流动性失败: ${error.message}`);
      console.log("可能已经有足够的流动性");
    }
    
    // 设置交换率
    console.log("\n设置交换率...");
    
    console.log("设置AIH -> USDC的交换率...");
    const setRateTx1 = await swapRouter.setExchangeRate(
      aihTokenAddress,
      usdcTokenAddress,
      ethers.utils.parseEther("1"), // 1 AIH = 1 USDC
      txOptions
    );
    await setRateTx1.wait();
    console.log("AIH -> USDC交换率已设置");
    
    console.log("设置USDC -> AIH的交换率...");
    const setRateTx2 = await swapRouter.setExchangeRate(
      usdcTokenAddress,
      aihTokenAddress,
      ethers.utils.parseEther("1"), // 1 USDC = 1 AIH
      txOptions
    );
    await setRateTx2.wait();
    console.log("USDC -> AIH交换率已设置");
    
    // 验证交换率
    console.log("\n验证交换率...");
    const rateAtoU = await swapRouter.getExchangeRate(aihTokenAddress, usdcTokenAddress);
    console.log(`AIH -> USDC交换率: ${ethers.utils.formatEther(rateAtoU)}`);
    
    const rateUtoA = await swapRouter.getExchangeRate(usdcTokenAddress, aihTokenAddress);
    console.log(`USDC -> AIH交换率: ${ethers.utils.formatEther(rateUtoA)}`);
    
    console.log("\n✅ 修复完成!");
  } catch (error) {
    console.error("设置交换率失败:", error.message);
    console.error("详细错误:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 