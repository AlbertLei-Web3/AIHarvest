const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("开始部署SimpleSwapRouter合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  
  // 现有代币合约地址
  const aihTokenAddress = "0xFcB512f45172aa1e331D926321eaA1C52D7dce8E";
  const usdcTokenAddress = "0xB35B48631b69478f28E4365CC1794E378Ad0FA02";
  
  console.log(`AIH代币地址: ${aihTokenAddress}`);
  console.log(`USDC代币地址: ${usdcTokenAddress}`);
  
  try {
    // 部署SimpleSwapRouter - 使用非upgradeable合约，避免初始化问题
    console.log("\n部署SimpleSwapRouter合约...");
    
    // 设置构造函数参数
    const treasuryAddress = deployer.address;
    const fee = 300; // 3% 
    
    // 部署合约
    const SimpleSwapRouter = await ethers.getContractFactory("SimpleSwapRouter");
    const swapRouter = await SimpleSwapRouter.deploy(treasuryAddress, fee);
    await swapRouter.waitForDeployment();
    
    const swapRouterAddress = await swapRouter.getAddress();
    console.log(`SimpleSwapRouter合约已部署至: ${swapRouterAddress}`);
    
    // 验证部署状态
    console.log("\n验证部署状态...");
    const actualTreasury = await swapRouter.treasury();
    const actualFee = await swapRouter.fee();
    const maxSwapAmount = await swapRouter.maxSwapAmount();
    const whitelistEnabled = await swapRouter.whitelistEnabled();
    const lpFee = await swapRouter.lpFee();
    const protocolFee = await swapRouter.protocolFee();
    
    console.log(`国库地址: ${actualTreasury}`);
    console.log(`总费率: ${actualFee.toString()} 基点`);
    console.log(`LP费率: ${lpFee} 基点`);
    console.log(`协议费率: ${protocolFee} 基点`);
    console.log(`最大交换数量: ${ethers.formatEther(maxSwapAmount)}`);
    console.log(`白名单是否启用: ${whitelistEnabled}`);
    
    // 连接到代币合约
    console.log("\n连接代币合约...");
    const aihToken = await ethers.getContractAt("TestTokenUpgradeable", aihTokenAddress);
    const usdcToken = await ethers.getContractAt("TestTokenUpgradeable", usdcTokenAddress);
    
    // 将两个代币添加到白名单
    console.log("\n将AIH和USDC添加到白名单...");
    try {
      const addAihToWhitelistTx = await swapRouter.addTokenToWhitelist(aihTokenAddress);
      await addAihToWhitelistTx.wait();
      console.log("AIH已添加到白名单");
      
      const addUsdcToWhitelistTx = await swapRouter.addTokenToWhitelist(usdcTokenAddress);
      await addUsdcToWhitelistTx.wait();
      console.log("USDC已添加到白名单");
      
      // 启用白名单
      const enableWhitelistTx = await swapRouter.setWhitelistStatus(true);
      await enableWhitelistTx.wait();
      console.log("白名单已启用");
    } catch (whitelistError) {
      console.error("设置白名单失败:", whitelistError.message);
    }
    
    // 添加流动性
    console.log("\n添加流动性...");
    
    // 批准代币
    console.log("批准AIH代币转账...");
    const approveAIHTx = await aihToken.approve(swapRouterAddress, ethers.parseEther("100000"));
    await approveAIHTx.wait();
    
    console.log("批准USDC代币转账...");
    const approveUSDCTx = await usdcToken.approve(swapRouterAddress, ethers.parseEther("100000"));
    await approveUSDCTx.wait();
    
    // 添加流动性
    console.log("添加AIH-USDC流动性...");
    const addLiquidityTx = await swapRouter.addLiquidity(
      aihTokenAddress,
      usdcTokenAddress,
      ethers.parseEther("100000"),
      ethers.parseEther("100000")
    );
    await addLiquidityTx.wait();
    console.log("流动性添加成功");
    
    // 检查流动性和汇率
    const rateAtoU = await swapRouter.exchangeRates(aihTokenAddress, usdcTokenAddress);
    console.log(`AIH -> USDC汇率: ${ethers.formatEther(rateAtoU)}`);
    
    const rateUtoA = await swapRouter.exchangeRates(usdcTokenAddress, aihTokenAddress);
    console.log(`USDC -> AIH汇率: ${ethers.formatEther(rateUtoA)}`);
    
    // 手动设置汇率（可选）
    console.log("\n手动设置汇率...");
    try {
      const setRateTx = await swapRouter.setExchangeRate(
        aihTokenAddress,
        usdcTokenAddress,
        ethers.parseEther("1") // 1 AIH = 1 USDC
      );
      await setRateTx.wait();
      console.log("汇率设置成功");
      
      // 验证汇率
      const newRateAtoU = await swapRouter.exchangeRates(aihTokenAddress, usdcTokenAddress);
      console.log(`更新后AIH -> USDC汇率: ${ethers.formatEther(newRateAtoU)}`);
      
      const newRateUtoA = await swapRouter.exchangeRates(usdcTokenAddress, aihTokenAddress);
      console.log(`更新后USDC -> AIH汇率: ${ethers.formatEther(newRateUtoA)}`);
    } catch (rateError) {
      console.error("设置汇率失败:", rateError.message);
    }
    
    // 更新费用
    console.log("\n更新费用...");
    try {
      const updateFeesTx = await swapRouter.updateFees(250, 50); // LP: 2.5%, 协议: 0.5%
      await updateFeesTx.wait();
      console.log("费用更新成功");
      console.log(`新LP费率: ${await swapRouter.lpFee()} 基点`);
      console.log(`新协议费率: ${await swapRouter.protocolFee()} 基点`);
      console.log(`新总费率: ${await swapRouter.fee()} 基点`);
    } catch (feeError) {
      console.error("更新费用失败:", feeError.message);
    }
    
    // 设置最大交换金额
    console.log("\n设置最大交换金额...");
    try {
      const setMaxSwapTx = await swapRouter.setMaxSwapAmount(ethers.parseEther("500000"));
      await setMaxSwapTx.wait();
      console.log("最大交换金额已更新");
      console.log(`新最大交换金额: ${ethers.formatEther(await swapRouter.maxSwapAmount())}`);
    } catch (maxSwapError) {
      console.error("设置最大交换金额失败:", maxSwapError.message);
    }
    
    // 保存部署信息
    console.log("\n保存部署信息...");
    
    // 创建deployments目录如果不存在
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }
    
    // 获取网络信息并确保获取的是字符串形式
    const networkInfo = await ethers.provider.getNetwork();
    const networkName = networkInfo.name || "sepolia";
    const deploymentFile = path.join(deploymentsDir, `${networkName}-deployment-simple.json`);
    
    // 读取现有部署信息（如果存在）
    let deploymentInfo = {};
    if (fs.existsSync(deploymentFile)) {
      try {
        deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      } catch (error) {
        console.log("无法读取现有部署信息，创建新文件");
      }
    }
    
    // 更新SwapRouter地址
    if (!deploymentInfo.contracts) {
      deploymentInfo.contracts = {};
    }
    
    deploymentInfo.contracts.SimpleSwapRouter = {
      address: swapRouterAddress
    };
    
    // 添加代币信息
    if (!deploymentInfo.tokens) {
      deploymentInfo.tokens = {};
    }
    deploymentInfo.tokens.AIH = aihTokenAddress;
    deploymentInfo.tokens.USDC = usdcTokenAddress;
    
    // 保存更新后的部署信息
    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`部署信息已保存至: ${deploymentFile}`);
    
    // 生成contracts.json文件供前端使用
    const contractsJsonFile = path.join(deploymentsDir, `contracts-simple.json`);
    
    // 读取现有contracts.json（如果存在）
    let contractsJson = {};
    if (fs.existsSync(contractsJsonFile)) {
      try {
        contractsJson = JSON.parse(fs.readFileSync(contractsJsonFile, 'utf8'));
      } catch (error) {
        console.log("无法读取现有contracts.json，创建新文件");
      }
    }
    
    // 基本信息
    contractsJson.networkName = networkName;
    contractsJson.chainId = networkInfo.chainId.toString(); // 将chainId转换为字符串
    if (!contractsJson.contracts) {
      contractsJson.contracts = {};
    }
    
    // 更新SwapRouter信息
    contractsJson.contracts.SimpleSwapRouter = {
      address: swapRouterAddress,
      abi: "SimpleSwapRouter.json"
    };
    contractsJson.tokens = {
      AIH: aihTokenAddress,
      USDC: usdcTokenAddress
    };
    contractsJson.deploymentTimestamp = new Date().toISOString();
    
    // 保存更新后的contracts.json
    fs.writeFileSync(
      contractsJsonFile,
      JSON.stringify(contractsJson, null, 2)
    );
    console.log(`Contracts信息已保存至: ${contractsJsonFile}`);
    
    // 输出部署摘要
    console.log("\n=== 部署摘要 ===");
    console.log(`SimpleSwapRouter: ${swapRouterAddress}`);
    console.log(`AIH代币: ${aihTokenAddress}`);
    console.log(`USDC代币: ${usdcTokenAddress}`);
    console.log("===============");
    console.log("✅ 部署完成!");
  } catch (error) {
    console.error("部署SimpleSwapRouter合约失败:", error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 