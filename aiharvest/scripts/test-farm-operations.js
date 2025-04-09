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

// 交互菜单
async function showMenu() {
  console.log("\n==== 农场操作测试菜单 ====");
  console.log("1. 查看农场和代币信息");
  console.log("2. 质押代币到农场");
  console.log("3. 从农场取消质押");
  console.log("4. 查看待领取奖励");
  console.log("5. 领取奖励");
  console.log("6. 一键复利(收获并重新质押)");
  console.log("0. 退出");
  
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question("请选择操作 (0-6): ", (choice) => {
      readline.close();
      resolve(choice);
    });
  });
}

// 获取用户输入
async function getUserInput(prompt) {
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(prompt, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log("开始农场操作测试...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log(`当前账户: ${deployer.address}`);
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
  
  // 获取Farm地址 - 这里需要根据您的项目修改
  // 如果配置中没有Farm地址，可以提示用户输入
  let FARM_ADDRESS = networkConfig.contracts.FarmUpgradeableV2?.address;
  
  if (!FARM_ADDRESS || FARM_ADDRESS === "") {
    FARM_ADDRESS = await getUserInput("请输入Farm合约地址: ");
    // 将地址保存到配置中
    if (networkConfig.contracts.FarmUpgradeableV2) {
      networkConfig.contracts.FarmUpgradeableV2.address = FARM_ADDRESS;
      networkConfig.contracts.FarmUpgradeableV2.deployed = true;
    } else {
      networkConfig.contracts.FarmUpgradeableV2 = {
        address: FARM_ADDRESS,
        abiFile: "FarmUpgradeableV2.json",
        deployed: true
      };
    }
    
    // 更新配置文件
    fs.writeFileSync(
      path.join(__dirname, "../deployments/contracts-config.json"), 
      JSON.stringify(config, null, 2)
    );
  }
  
  console.log(`AIH代币地址: ${AIH_ADDRESS}`);
  console.log(`USDC代币地址: ${USDC_ADDRESS}`);
  console.log(`Farm合约地址: ${FARM_ADDRESS}`);
  
  // 加载合约
  const aihToken = await ethers.getContractAt("TestTokenUpgradeable", AIH_ADDRESS);
  const usdcToken = await ethers.getContractAt("TestTokenUpgradeable", USDC_ADDRESS);
  const farm = await ethers.getContractAt("FarmUpgradeableV2", FARM_ADDRESS);
  
  // 主循环
  let running = true;
  while (running) {
    try {
      const choice = await showMenu();
      
      switch (choice) {
        case "0":
          running = false;
          console.log("退出测试程序");
          break;
          
        case "1":
          // 查看农场和代币信息
          await showFarmInfo(farm, aihToken, usdcToken, deployer.address);
          break;
          
        case "2":
          // 质押代币到农场
          await stakeTokens(farm, aihToken, deployer.address);
          break;
          
        case "3":
          // 从农场取消质押
          await unstakeTokens(farm, deployer.address);
          break;
          
        case "4":
          // 查看待领取奖励
          await checkPendingRewards(farm, deployer.address);
          break;
          
        case "5":
          // 领取奖励
          await harvestRewards(farm, deployer.address);
          break;
          
        case "6":
          // 一键复利
          await compoundRewards(farm, deployer.address);
          break;
          
        default:
          console.log("无效选择，请重试");
      }
    } catch (error) {
      console.error("操作失败:", error.message);
    }
  }
}

// 查看农场和代币信息
async function showFarmInfo(farm, aihToken, usdcToken, userAddress) {
  console.log("\n==== 农场和代币信息 ====");
  
  // 获取代币余额
  const aihBalance = await aihToken.balanceOf(userAddress);
  const usdcBalance = await usdcToken.balanceOf(userAddress);
  
  console.log(`AIH余额: ${ethers.utils.formatEther(aihBalance)} AIH`);
  console.log(`USDC余额: ${ethers.utils.formatUnits(usdcBalance, 6)} USDC`);
  
  // 获取Farm合约信息
  try {
    const stakingToken = await farm.stakingToken();
    const rewardToken = await farm.rewardToken();
    const rewardRate = await farm.rewardRate();
    const totalStaked = await farm.totalStaked();
    
    console.log("\n农场信息:");
    console.log(`质押代币: ${stakingToken}`);
    console.log(`奖励代币: ${rewardToken}`);
    console.log(`奖励率: ${ethers.utils.formatEther(rewardRate)} 代币/秒`);
    console.log(`总质押量: ${ethers.utils.formatEther(totalStaked)} 代币`);
    
    // 获取用户在农场的信息
    const userInfo = await farm.userInfo(0, userAddress);
    console.log("\n用户农场信息:");
    console.log(`质押数量: ${ethers.utils.formatEther(userInfo.amount)} 代币`);
    if (userInfo.unlockTime) {
      const unlockTime = new Date(userInfo.unlockTime * 1000);
      console.log(`解锁时间: ${unlockTime.toLocaleString()}`);
    }
    
    // 获取待领取奖励
    const pendingReward = await farm.getPendingReward(userAddress);
    console.log(`待领取奖励: ${ethers.utils.formatEther(pendingReward)} 代币`);
    
  } catch (error) {
    console.error("获取农场信息失败:", error.message);
  }
}

// 质押代币到农场
async function stakeTokens(farm, token, userAddress) {
  console.log("\n==== 质押代币到农场 ====");
  
  // 获取代币余额
  const tokenBalance = await token.balanceOf(userAddress);
  console.log(`可用余额: ${ethers.utils.formatEther(tokenBalance)} 代币`);
  
  // 获取用户输入的质押金额
  const amountStr = await getUserInput("请输入质押金额 (输入 'max' 使用最大可用金额): ");
  let amount;
  
  if (amountStr.toLowerCase() === 'max') {
    amount = tokenBalance;
  } else {
    amount = ethers.utils.parseEther(amountStr);
  }
  
  if (amount.gt(tokenBalance)) {
    console.log("错误: 质押金额超过可用余额");
    return;
  }
  
  try {
    // 先授权农场合约使用代币
    console.log("正在授权农场合约使用代币...");
    const approveTx = await token.approve(farm.address, amount);
    await approveTx.wait();
    console.log(`授权成功，交易哈希: ${approveTx.hash}`);
    
    // 执行质押
    console.log("正在质押代币...");
    // 这里根据您的Farm合约调用适当的函数，可能是 deposit 或 depositV2
    const depositTx = await farm.depositV2(0, amount);
    await depositTx.wait();
    console.log(`质押成功，交易哈希: ${depositTx.hash}`);
    console.log(`已质押 ${ethers.utils.formatEther(amount)} 代币到农场`);
    
  } catch (error) {
    console.error("质押失败:", error.message);
  }
}

// 从农场取消质押
async function unstakeTokens(farm, userAddress) {
  console.log("\n==== 从农场取消质押 ====");
  
  try {
    // 获取用户在农场的质押信息
    const userInfo = await farm.userInfo(0, userAddress);
    const stakedAmount = userInfo.amount;
    
    console.log(`当前质押量: ${ethers.utils.formatEther(stakedAmount)} 代币`);
    
    if (stakedAmount.eq(0)) {
      console.log("您没有质押任何代币");
      return;
    }
    
    // 检查解锁时间
    if (userInfo.unlockTime) {
      const now = Math.floor(Date.now() / 1000);
      const unlockTime = userInfo.unlockTime.toNumber();
      
      if (now < unlockTime) {
        const remainingTime = unlockTime - now;
        const days = Math.floor(remainingTime / 86400);
        const hours = Math.floor((remainingTime % 86400) / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        
        console.log(`警告: 还未到解锁时间，提前取消质押可能会有惩罚`);
        console.log(`剩余锁定时间: ${days}天 ${hours}小时 ${minutes}分钟`);
        
        const confirmEarly = await getUserInput("确定要提前取消质押吗? (y/n): ");
        if (confirmEarly.toLowerCase() !== 'y') {
          console.log("已取消操作");
          return;
        }
      } else {
        console.log("已达到解锁时间，可以正常取消质押");
      }
    }
    
    // 获取用户输入的取消质押金额
    const amountStr = await getUserInput("请输入取消质押金额 (输入 'max' 使用最大可用金额): ");
    let amount;
    
    if (amountStr.toLowerCase() === 'max') {
      amount = stakedAmount;
    } else {
      amount = ethers.utils.parseEther(amountStr);
    }
    
    if (amount.gt(stakedAmount)) {
      console.log("错误: 取消质押金额超过已质押金额");
      return;
    }
    
    // 执行取消质押
    console.log("正在取消质押...");
    // 这里根据您的Farm合约调用适当的函数，可能是 withdraw 或 withdrawV2
    const withdrawTx = await farm.withdrawV2(0, amount);
    await withdrawTx.wait();
    console.log(`取消质押成功，交易哈希: ${withdrawTx.hash}`);
    console.log(`已从农场取消质押 ${ethers.utils.formatEther(amount)} 代币`);
    
  } catch (error) {
    console.error("取消质押失败:", error.message);
  }
}

// 查看待领取奖励
async function checkPendingRewards(farm, userAddress) {
  console.log("\n==== 查看待领取奖励 ====");
  
  try {
    // 获取待领取奖励
    const pendingReward = await farm.getPendingReward(userAddress);
    console.log(`待领取奖励: ${ethers.utils.formatEther(pendingReward)} 代币`);
    
    // 如果有待领取奖励，计算预期年化收益率
    if (!pendingReward.eq(0)) {
      const userInfo = await farm.userInfo(0, userAddress);
      const stakedAmount = userInfo.amount;
      
      if (!stakedAmount.eq(0)) {
        // 获取最后更新时间
        const lastRewardTime = await farm.lastRewardTime();
        const now = Math.floor(Date.now() / 1000);
        const timePassed = now - lastRewardTime.toNumber();
        
        if (timePassed > 0) {
          const rewardPerSecond = pendingReward.div(timePassed);
          const rewardPerYear = rewardPerSecond.mul(365 * 24 * 60 * 60);
          const apr = rewardPerYear.mul(100).div(stakedAmount);
          
          console.log(`预估APR: ${apr}%`);
        }
      }
    }
    
  } catch (error) {
    console.error("获取待领取奖励失败:", error.message);
  }
}

// 领取奖励
async function harvestRewards(farm, userAddress) {
  console.log("\n==== 领取奖励 ====");
  
  try {
    // 获取待领取奖励
    const pendingReward = await farm.getPendingReward(userAddress);
    console.log(`待领取奖励: ${ethers.utils.formatEther(pendingReward)} 代币`);
    
    if (pendingReward.eq(0)) {
      console.log("没有待领取的奖励");
      return;
    }
    
    // 执行领取奖励
    console.log("正在领取奖励...");
    // 这里根据您的Farm合约调用适当的函数，可能是 harvest 或 depositV2(0, 0)
    const harvestTx = await farm.depositV2(0, 0);
    await harvestTx.wait();
    console.log(`领取奖励成功，交易哈希: ${harvestTx.hash}`);
    console.log(`已领取 ${ethers.utils.formatEther(pendingReward)} 代币奖励`);
    
  } catch (error) {
    console.error("领取奖励失败:", error.message);
  }
}

// 一键复利(收获并重新质押)
async function compoundRewards(farm, userAddress) {
  console.log("\n==== 一键复利 ====");
  
  try {
    // 获取待领取奖励
    const pendingReward = await farm.getPendingReward(userAddress);
    console.log(`待领取奖励: ${ethers.utils.formatEther(pendingReward)} 代币`);
    
    if (pendingReward.eq(0)) {
      console.log("没有待领取的奖励，无法复利");
      return;
    }
    
    // 执行复利操作
    console.log("正在执行复利操作...");
    // 这里根据您的Farm合约调用适当的函数，可能是 compound 或自定义的复利函数
    // 如果没有专门的复利函数，可以先收获然后再质押
    // 这里假设有compound函数
    try {
      const compoundTx = await farm.compound(0);
      await compoundTx.wait();
      console.log(`复利操作成功，交易哈希: ${compoundTx.hash}`);
      console.log(`已将 ${ethers.utils.formatEther(pendingReward)} 代币奖励复投到农场`);
    } catch (compoundError) {
      console.log("无法直接复利，尝试手动收获并重新质押...");
      
      // 获取奖励代币地址
      const rewardToken = await farm.rewardToken();
      const tokenContract = await ethers.getContractAt("TestTokenUpgradeable", rewardToken);
      
      // 先收获奖励
      const harvestTx = await farm.depositV2(0, 0);
      await harvestTx.wait();
      console.log(`领取奖励成功，交易哈希: ${harvestTx.hash}`);
      
      // 然后重新质押
      const rewardBalance = await tokenContract.balanceOf(userAddress);
      
      if (rewardBalance.gt(0)) {
        // 授权农场合约使用代币
        const approveTx = await tokenContract.approve(farm.address, rewardBalance);
        await approveTx.wait();
        
        // 质押代币
        const stakeTx = await farm.depositV2(0, rewardBalance);
        await stakeTx.wait();
        console.log(`重新质押成功，交易哈希: ${stakeTx.hash}`);
        console.log(`已将 ${ethers.utils.formatEther(rewardBalance)} 代币奖励复投到农场`);
      } else {
        console.log("领取奖励后余额为0，无法复投");
      }
    }
    
  } catch (error) {
    console.error("复利操作失败:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 