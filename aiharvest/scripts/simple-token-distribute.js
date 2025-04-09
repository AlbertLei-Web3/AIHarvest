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
  
  // 在ethers v6中，formatEther 是直接在 ethers 下的，不是在 utils 子对象中
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`账户余额: ${ethers.formatEther(balance)} ETH`);
  
  // 加载配置
  const config = loadConfig();
  const network = await ethers.provider.getNetwork();
  // 在ethers v6中，network.name变成了network.name属性
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  console.log(`当前网络: ${networkName} (chainId: ${network.chainId})`);
  
  const networkConfig = config.networks[networkName] || config.networks["sepolia"];
  
  // 获取Token地址
  const AIH_ADDRESS = networkConfig.tokens.AIH.address;
  const USDC_ADDRESS = networkConfig.tokens.USDC.address;
  
  console.log(`AIH代币地址: ${AIH_ADDRESS}`);
  console.log(`USDC代币地址: ${USDC_ADDRESS}`);
  
  // 输入接收者地址
  // 使用环境变量RECIPIENT_ADDRESS获取接收者地址，不再从命令行参数获取
  const recipient = process.env.RECIPIENT_ADDRESS || deployer.address;
  console.log(`\n接收者地址: ${recipient}`);
  
  if (process.env.RECIPIENT_ADDRESS) {
    console.log(`使用环境变量提供的接收者地址: ${recipient}`);
  } else {
    console.log(`使用部署者地址作为接收者: ${recipient}`);
    console.log(`如需指定其他接收者，请设置环境变量 RECIPIENT_ADDRESS`);
    console.log(`示例: set RECIPIENT_ADDRESS=0x接收者地址 && npx hardhat run scripts/simple-token-distribute.js --network sepolia`);
  }
  
  // 使用 ERC20 ABI 而不是特定合约
  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];
  
  // 检查代币存在性
  if (AIH_ADDRESS && AIH_ADDRESS !== "") {
    try {
      const aihToken = new ethers.Contract(AIH_ADDRESS, erc20Abi, deployer);
      const symbol = await aihToken.symbol();
      const balance = await aihToken.balanceOf(deployer.address);
      
      console.log(`找到 ${symbol} 代币，部署者余额: ${ethers.formatEther(balance)}`);
      
      // 显示接收者余额
      const recipientBalance = await aihToken.balanceOf(recipient);
      console.log(`接收者当前 ${symbol} 余额: ${ethers.formatEther(recipientBalance)}`);
      
      // 如果是部署者的话，跳过转账
      if (recipient !== deployer.address && balance > 0) {
        const transferAmount = ethers.parseEther("1000"); // 转1000个代币
        if (balance >= transferAmount) {
          console.log(`转账 ${ethers.formatEther(transferAmount)} ${symbol} 到 ${recipient}`);
          await aihToken.transfer(recipient, transferAmount);
          
          // 验证转账
          const newRecipientBalance = await aihToken.balanceOf(recipient);
          console.log(`转账后接收者 ${symbol} 余额: ${ethers.formatEther(newRecipientBalance)}`);
        } else {
          console.log(`部署者余额不足，无法转账 ${ethers.formatEther(transferAmount)} ${symbol}`);
        }
      }
    } catch (error) {
      console.error(`无法连接到 AIH 代币: ${error.message}`);
    }
  } else {
    console.log("AIH代币地址未设置");
  }
  
  // 检查USDC代币
  if (USDC_ADDRESS && USDC_ADDRESS !== "") {
    try {
      const usdcToken = new ethers.Contract(USDC_ADDRESS, erc20Abi, deployer);
      const symbol = await usdcToken.symbol();
      const decimals = await usdcToken.decimals();
      const balance = await usdcToken.balanceOf(deployer.address);
      
      console.log(`找到 ${symbol} 代币，部署者余额: ${ethers.formatUnits(balance, decimals)}`);
      
      // 显示接收者余额
      const recipientBalance = await usdcToken.balanceOf(recipient);
      console.log(`接收者当前 ${symbol} 余额: ${ethers.formatUnits(recipientBalance, decimals)}`);
      
      // 如果是部署者的话，跳过转账
      if (recipient !== deployer.address && balance > 0) {
        const transferAmount = ethers.parseUnits("1000", decimals); // 转1000个代币
        if (balance >= transferAmount) {
          console.log(`转账 ${ethers.formatUnits(transferAmount, decimals)} ${symbol} 到 ${recipient}`);
          await usdcToken.transfer(recipient, transferAmount);
          
          // 验证转账
          const newRecipientBalance = await usdcToken.balanceOf(recipient);
          console.log(`转账后接收者 ${symbol} 余额: ${ethers.formatUnits(newRecipientBalance, decimals)}`);
        } else {
          console.log(`部署者余额不足，无法转账 ${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
        }
      }
    } catch (error) {
      console.error(`无法连接到 USDC 代币: ${error.message}`);
    }
  } else {
    console.log("USDC代币地址未设置");
  }
  
  console.log("\nToken查询/分发脚本执行完成!");
}

// 主函数
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 