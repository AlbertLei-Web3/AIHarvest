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
  console.log("开始测试代币分发...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`部署账户: ${deployer.address}`);
  console.log(`账户余额: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // 加载配置
  const config = loadConfig();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  console.log(`当前网络: ${networkName} (chainId: ${network.chainId})`);
  
  const networkConfig = config.networks[networkName] || config.networks["sepolia"];
  
  // 获取Token地址
  const AIH_ADDRESS = networkConfig.tokens.AIH.address;
  const USDC_ADDRESS = networkConfig.tokens.USDC.address;
  
  console.log(`AIH代币地址: ${AIH_ADDRESS}`);
  console.log(`USDC代币地址: ${USDC_ADDRESS}`);
  
  // 检查是否需要部署新的测试代币
  let aihToken, usdcToken;
  
  if (!AIH_ADDRESS || AIH_ADDRESS === "") {
    console.log("\n部署新的AIH测试代币...");
    const TestToken = await ethers.getContractFactory("TestTokenUpgradeable");
    aihToken = await TestToken.deploy();
    await aihToken.deployed();
    console.log(`AIH测试代币已部署至: ${aihToken.address}`);
    
    // 初始化AIH代币
    const initAIHTx = await aihToken.initialize("AI Harvest Token", "AIH", 18, ethers.utils.parseEther("0"));
    await initAIHTx.wait();
    console.log(`AIH代币已初始化`);
    
    // 更新配置
    networkConfig.tokens.AIH.address = aihToken.address;
  } else {
    console.log("\n使用已部署的AIH代币...");
    aihToken = await ethers.getContractAt("TestTokenUpgradeable", AIH_ADDRESS);
  }
  
  if (!USDC_ADDRESS || USDC_ADDRESS === "") {
    console.log("\n部署新的USDC测试代币...");
    const TestToken = await ethers.getContractFactory("TestTokenUpgradeable");
    usdcToken = await TestToken.deploy();
    await usdcToken.deployed();
    console.log(`USDC测试代币已部署至: ${usdcToken.address}`);
    
    // 初始化USDC代币
    const initUSDCTx = await usdcToken.initialize("USD Coin", "USDC", 6, ethers.utils.parseUnits("0", 6));
    await initUSDCTx.wait();
    console.log(`USDC代币已初始化`);
    
    // 更新配置
    networkConfig.tokens.USDC.address = usdcToken.address;
  } else {
    console.log("\n使用已部署的USDC代币...");
    usdcToken = await ethers.getContractAt("TestTokenUpgradeable", USDC_ADDRESS);
  }
  
  // 输入接收者地址
  const recipient = process.env.RECIPIENT_ADDRESS || deployer.address;
  console.log(`\n接收者地址: ${recipient}`);
  
  // 分发代币
  try {
    // 检查是否有铸币权限
    const minter = await aihToken.minter();
    if (minter.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("当前账户不是AIH代币的铸币者，尝试转移已有代币...");
      
      // 获取部署者余额
      const aihBalance = await aihToken.balanceOf(deployer.address);
      if (aihBalance.gt(0)) {
        const aihAmount = ethers.utils.parseEther("10000");
        const transferAihTx = await aihToken.transfer(recipient, aihAmount.gt(aihBalance) ? aihBalance : aihAmount);
        await transferAihTx.wait();
        console.log(`已成功转移 ${ethers.utils.formatEther(aihAmount.gt(aihBalance) ? aihBalance : aihAmount)} AIH代币到 ${recipient}`);
      } else {
        console.log("部署者没有足够的AIH代币余额进行转移");
      }
    } else {
      // 铸造AIH代币
      const aihAmount = ethers.utils.parseEther("10000");
      const mintAihTx = await aihToken.mint(recipient, aihAmount);
      await mintAihTx.wait();
      console.log(`已成功铸造 10,000 AIH代币到 ${recipient}`);
    }
    
    // 对USDC执行相同操作
    const usdcMinter = await usdcToken.minter();
    if (usdcMinter.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("当前账户不是USDC代币的铸币者，尝试转移已有代币...");
      
      // 获取部署者余额
      const usdcBalance = await usdcToken.balanceOf(deployer.address);
      if (usdcBalance.gt(0)) {
        const usdcAmount = ethers.utils.parseUnits("10000", 6);
        const transferUsdcTx = await usdcToken.transfer(recipient, usdcAmount.gt(usdcBalance) ? usdcBalance : usdcAmount);
        await transferUsdcTx.wait();
        console.log(`已成功转移 ${ethers.utils.formatUnits(usdcAmount.gt(usdcBalance) ? usdcBalance : usdcAmount, 6)} USDC代币到 ${recipient}`);
      } else {
        console.log("部署者没有足够的USDC代币余额进行转移");
      }
    } else {
      // 铸造USDC代币
      const usdcAmount = ethers.utils.parseUnits("10000", 6);
      const mintUsdcTx = await usdcToken.mint(recipient, usdcAmount);
      await mintUsdcTx.wait();
      console.log(`已成功铸造 10,000 USDC代币到 ${recipient}`);
    }
    
    // 更新配置文件
    if (networkName !== "hardhat") {
      console.log("\n更新配置文件...");
      fs.writeFileSync(
        path.join(__dirname, "../deployments/contracts-config.json"), 
        JSON.stringify(config, null, 2)
      );
      console.log("配置文件已更新");
    }
    
    // 查询并显示余额
    const aihBalance = await aihToken.balanceOf(recipient);
    const usdcBalance = await usdcToken.balanceOf(recipient);
    
    console.log("\n分发完成!");
    console.log(`${recipient} 的AIH余额: ${ethers.utils.formatEther(aihBalance)} AIH`);
    console.log(`${recipient} 的USDC余额: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`);
    
  } catch (error) {
    console.error("代币分发失败:", error.message);
  }
}

// 处理命令行参数
async function runWithArgs() {
  // 允许通过命令行指定接收者地址，例如: node scripts/distribute-test-tokens.js 0x123...
  const args = process.argv.slice(2);
  if (args.length > 0 && ethers.utils.isAddress(args[0])) {
    process.env.RECIPIENT_ADDRESS = args[0];
  }
  
  await main();
}

runWithArgs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 