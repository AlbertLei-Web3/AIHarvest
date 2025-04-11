//2025-04-10 测试SimpleFarm合约
const { ethers } = require("hardhat");
const fs = require("fs");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Load configuration from contracts-config.json
function loadConfig() {
  try {
    const configPath = "./contracts-config.json";
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return config;
  } catch (error) {
    console.error("Error loading configuration:", error);
    process.exit(1);
  }
}

// Helper function to format ether
function formatEther(amount) {
  return ethers.utils.formatEther(amount);
}

// Helper function to parse units
function parseUnits(amount, decimals = 18) {
  return ethers.utils.parseUnits(amount.toString(), decimals);
}

// Helper function to get token balance
async function getTokenBalance(tokenContract, address) {
  try {
    const balance = await tokenContract.balanceOf(address);
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();
    return {
      balance,
      formattedBalance: formatEther(balance),
      symbol,
      decimals
    };
  } catch (error) {
    console.error("Error getting token balance:", error);
    return { balance: 0, formattedBalance: "0", symbol: "Unknown", decimals: 18 };
  }
}

// Function to display farm information
async function showFarmInfo(farmContract, stakingTokenContract, rewardTokenContract, userAddress) {
  try {
    console.log("\n=== Farm Information ===");
    
    // Get farm owner
    const owner = await farmContract.owner();
    console.log(`Farm owner: ${owner}`);
    console.log(`Current user: ${userAddress}`);
    
    // Get staking token and reward token
    const stakingToken = await farmContract.stakingToken();
    const rewardToken = await farmContract.rewardToken();
    console.log(`Staking token: ${stakingToken}`);
    console.log(`Reward token: ${rewardToken}`);
    
    // Get reward rate
    const rewardRate = await farmContract.rewardRate();
    console.log(`Reward rate: ${formatEther(rewardRate)} tokens per second`);
    
    // Get total staked
    const totalStaked = await farmContract.totalStaked();
    console.log(`Total staked: ${formatEther(totalStaked)} tokens`);
    
    // Get lock duration
    const lockDuration = await farmContract.lockDuration();
    console.log(`Lock duration: ${lockDuration.toString()} seconds (${lockDuration / 86400} days)`);
    
    // Get user info
    const userInfo = await farmContract.userInfo(userAddress);
    console.log("\n=== User Information ===");
    console.log(`Amount staked: ${formatEther(userInfo.amount)} tokens`);
    console.log(`Reward debt: ${formatEther(userInfo.rewardDebt)}`);
    
    // Calculate unlock time if user has staked
    if (userInfo.amount.gt(0)) {
      const unlockTime = userInfo.unlockTime;
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const isUnlocked = unlockTime.lte(currentTimestamp);
      
      console.log(`Unlock time: ${new Date(unlockTime * 1000).toLocaleString()}`);
      console.log(`Status: ${isUnlocked ? "Unlocked" : "Locked"}`);
      
      if (!isUnlocked) {
        const remainingTime = unlockTime - currentTimestamp;
        const days = Math.floor(remainingTime / 86400);
        const hours = Math.floor((remainingTime % 86400) / 3600);
        const minutes = Math.floor((remainingTime % 3600) / 60);
        console.log(`Time remaining: ${days} days, ${hours} hours, ${minutes} minutes`);
      }
    }
    
    // Get pending rewards
    const pendingReward = await farmContract.pendingReward(userAddress);
    console.log(`Pending rewards: ${formatEther(pendingReward)} tokens`);
    
    // Get token balances
    const stakingTokenBalance = await getTokenBalance(stakingTokenContract, userAddress);
    const rewardTokenBalance = await getTokenBalance(rewardTokenContract, userAddress);
    
    console.log("\n=== Token Balances ===");
    console.log(`Staking token balance: ${stakingTokenBalance.formattedBalance} ${stakingTokenBalance.symbol}`);
    console.log(`Reward token balance: ${rewardTokenBalance.formattedBalance} ${rewardTokenBalance.symbol}`);
    
    // Calculate APR if there are staked tokens
    if (totalStaked.gt(0)) {
      // Annual rewards = rewardRate * seconds in a year
      const annualRewards = rewardRate.mul(31536000); 
      // APR = (annual rewards / total staked) * 100
      const apr = annualRewards.mul(100).div(totalStaked);
      console.log(`\nEstimated APR: ${apr.toString()}%`);
    }
    
  } catch (error) {
    console.error("Error displaying farm info:", error);
  }
}

// Function to approve tokens
async function approveTokens(tokenContract, spender, amount, userAddress) {
  try {
    const symbol = await tokenContract.symbol();
    const allowance = await tokenContract.allowance(userAddress, spender);
    
    console.log(`Current allowance: ${formatEther(allowance)} ${symbol}`);
    
    if (allowance.gte(amount)) {
      console.log(`Allowance is sufficient. No need to approve.`);
      return true;
    }
    
    console.log(`Approving ${formatEther(amount)} ${symbol} to be spent by ${spender}...`);
    const tx = await tokenContract.approve(spender, amount);
    console.log(`Approval transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Approval confirmed!`);
    
    const newAllowance = await tokenContract.allowance(userAddress, spender);
    console.log(`New allowance: ${formatEther(newAllowance)} ${symbol}`);
    
    return true;
  } catch (error) {
    console.error("Error approving tokens:", error);
    return false;
  }
}

// Function to stake tokens
async function stakeTokens(farmContract, stakingTokenContract, userAddress) {
  try {
    const amount = await prompt("Enter amount to stake: ");
    const amountInWei = parseUnits(amount);
    
    const stakingTokenBalance = await getTokenBalance(stakingTokenContract, userAddress);
    
    if (amountInWei.gt(stakingTokenBalance.balance)) {
      console.error(`Insufficient balance. You have ${stakingTokenBalance.formattedBalance} ${stakingTokenBalance.symbol}`);
      return;
    }
    
    // Approve tokens
    const farmAddress = farmContract.address;
    const approved = await approveTokens(stakingTokenContract, farmAddress, amountInWei, userAddress);
    
    if (!approved) {
      console.error("Failed to approve tokens. Staking aborted.");
      return;
    }
    
    // Stake tokens
    console.log(`Staking ${amount} tokens...`);
    const tx = await farmContract.deposit(amountInWei);
    console.log(`Staking transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Staking confirmed!`);
    
    // Show updated info
    await showFarmInfo(farmContract, stakingTokenContract, await ethers.getContractAt("TestTokenUpgradeableV2", await farmContract.rewardToken()), userAddress);
    
  } catch (error) {
    console.error("Error staking tokens:", error);
  }
}

// Function to unstake tokens
async function unstakeTokens(farmContract, stakingTokenContract, rewardTokenContract, userAddress) {
  try {
    // Get user info
    const userInfo = await farmContract.userInfo(userAddress);
    
    if (userInfo.amount.eq(0)) {
      console.error("You don't have any tokens staked.");
      return;
    }
    
    // Check if tokens are unlocked
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const isUnlocked = userInfo.unlockTime.lte(currentTimestamp);
    
    if (!isUnlocked) {
      const remainingTime = userInfo.unlockTime - currentTimestamp;
      const days = Math.floor(remainingTime / 86400);
      const hours = Math.floor((remainingTime % 86400) / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      
      console.log(`Your tokens are still locked for ${days} days, ${hours} hours, ${minutes} minutes.`);
      const forceWithdraw = await prompt("Do you want to force withdraw anyway? (y/n): ");
      
      if (forceWithdraw.toLowerCase() !== 'y') {
        console.log("Unstaking cancelled.");
        return;
      }
      
      console.log("Proceeding with force withdraw...");
    }
    
    const totalStaked = formatEther(userInfo.amount);
    console.log(`You have ${totalStaked} tokens staked.`);
    
    const amount = await prompt(`Enter amount to unstake (max ${totalStaked}): `);
    const amountInWei = parseUnits(amount);
    
    if (amountInWei.gt(userInfo.amount)) {
      console.error(`Cannot unstake more than ${totalStaked} tokens.`);
      return;
    }
    
    // Unstake tokens
    console.log(`Unstaking ${amount} tokens...`);
    const tx = await farmContract.withdraw(amountInWei);
    console.log(`Unstaking transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Unstaking confirmed!`);
    
    // Show updated info
    await showFarmInfo(farmContract, stakingTokenContract, rewardTokenContract, userAddress);
    
  } catch (error) {
    console.error("Error unstaking tokens:", error);
  }
}

// Function to harvest rewards
async function harvestRewards(farmContract, rewardTokenContract, userAddress) {
  try {
    const pendingReward = await farmContract.pendingReward(userAddress);
    
    if (pendingReward.eq(0)) {
      console.log("You don't have any pending rewards to harvest.");
      return;
    }
    
    console.log(`You have ${formatEther(pendingReward)} pending rewards.`);
    
    // Harvest rewards
    console.log("Harvesting rewards...");
    const tx = await farmContract.harvest();
    console.log(`Harvest transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Harvest confirmed!`);
    
    // Show updated reward token balance
    const rewardTokenBalance = await getTokenBalance(rewardTokenContract, userAddress);
    console.log(`New reward token balance: ${rewardTokenBalance.formattedBalance} ${rewardTokenBalance.symbol}`);
    
  } catch (error) {
    console.error("Error harvesting rewards:", error);
  }
}

// Function to transfer ownership
async function transferOwnership(farmContract, userAddress) {
  try {
    const owner = await farmContract.owner();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.error("You are not the owner of this farm.");
      return;
    }
    
    const newOwner = await prompt("Enter the address of the new owner: ");
    
    // Transfer ownership
    console.log(`Transferring ownership to ${newOwner}...`);
    const tx = await farmContract.transferOwnership(newOwner);
    console.log(`Transfer ownership transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Ownership transferred to ${newOwner}!`);
    
    // Confirm new owner
    const confirmedNewOwner = await farmContract.owner();
    console.log(`Confirmed new owner: ${confirmedNewOwner}`);
    
  } catch (error) {
    console.error("Error transferring ownership:", error);
  }
}

// Function to update reward rate
async function updateRewardRate(farmContract, userAddress) {
  try {
    const owner = await farmContract.owner();
    
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      console.error("You are not the owner of this farm.");
      return;
    }
    
    const currentRewardRate = await farmContract.rewardRate();
    console.log(`Current reward rate: ${formatEther(currentRewardRate)} tokens per second`);
    
    const newRewardRate = await prompt("Enter the new reward rate (tokens per second): ");
    const newRewardRateInWei = parseUnits(newRewardRate);
    
    // Update reward rate
    console.log(`Updating reward rate to ${newRewardRate} tokens per second...`);
    const tx = await farmContract.setRewardRate(newRewardRateInWei);
    console.log(`Update reward rate transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Reward rate updated!`);
    
    // Confirm new reward rate
    const confirmedNewRewardRate = await farmContract.rewardRate();
    console.log(`Confirmed new reward rate: ${formatEther(confirmedNewRewardRate)} tokens per second`);
    
  } catch (error) {
    console.error("Error updating reward rate:", error);
  }
}

// Function to fund the farm with reward tokens
async function fundFarm(farmContract, rewardTokenContract, userAddress) {
  try {
    const amount = await prompt("Enter amount of reward tokens to fund the farm with: ");
    const amountInWei = parseUnits(amount);
    
    const rewardTokenBalance = await getTokenBalance(rewardTokenContract, userAddress);
    
    if (amountInWei.gt(rewardTokenBalance.balance)) {
      console.error(`Insufficient balance. You have ${rewardTokenBalance.formattedBalance} ${rewardTokenBalance.symbol}`);
      return;
    }
    
    // Approve tokens
    const farmAddress = farmContract.address;
    const approved = await approveTokens(rewardTokenContract, farmAddress, amountInWei, userAddress);
    
    if (!approved) {
      console.error("Failed to approve tokens. Funding aborted.");
      return;
    }
    
    // Fund farm
    console.log(`Funding farm with ${amount} ${rewardTokenBalance.symbol}...`);
    const tx = await farmContract.fund(amountInWei);
    console.log(`Funding transaction sent: ${tx.hash}`);
    
    await tx.wait();
    console.log(`Farm funded successfully!`);
    
    // Show updated farm info
    await showFarmInfo(farmContract, await ethers.getContractAt("TestTokenUpgradeableV2", await farmContract.stakingToken()), rewardTokenContract, userAddress);
    
  } catch (error) {
    console.error("Error funding farm:", error);
  }
}

// Main function
async function main() {
  try {
    // Load configuration
    const config = loadConfig();
    console.log("Configuration loaded successfully.");
    
    // Get contract addresses
    const farmAddress = config.SimpleFarm;
    if (!farmAddress) {
      console.error("SimpleFarm address not found in configuration!");
      process.exit(1);
    }
    
    console.log(`Using SimpleFarm at address: ${farmAddress}`);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    const userAddress = deployer.address;
    console.log(`Using account: ${userAddress}`);
    
    // Load contracts
    const farmContract = await ethers.getContractAt("SimpleFarm", farmAddress);
    console.log("SimpleFarm contract loaded successfully.");
    
    // Get staking and reward token addresses
    const stakingTokenAddress = await farmContract.stakingToken();
    const rewardTokenAddress = await farmContract.rewardToken();
    
    // Load token contracts
    const stakingTokenContract = await ethers.getContractAt("TestTokenUpgradeableV2", stakingTokenAddress);
    const rewardTokenContract = await ethers.getContractAt("TestTokenUpgradeableV2", rewardTokenAddress);
    
    console.log(`Staking token: ${stakingTokenAddress} (${await stakingTokenContract.symbol()})`);
    console.log(`Reward token: ${rewardTokenAddress} (${await rewardTokenContract.symbol()})`);
    
    // Display farm info
    await showFarmInfo(farmContract, stakingTokenContract, rewardTokenContract, userAddress);
    
    // Menu loop
    let exit = false;
    while (!exit) {
      console.log("\n=== MENU ===");
      console.log("1. Show farm information");
      console.log("2. Approve tokens");
      console.log("3. Stake tokens");
      console.log("4. Unstake tokens");
      console.log("5. Harvest rewards");
      console.log("6. Transfer ownership");
      console.log("7. Update reward rate");
      console.log("8. Fund farm with reward tokens");
      console.log("0. Exit");
      
      const choice = await prompt("\nSelect an option: ");
      
      switch (choice) {
        case "1":
          await showFarmInfo(farmContract, stakingTokenContract, rewardTokenContract, userAddress);
          break;
        case "2":
          const tokenType = await prompt("Approve which token? (1: Staking, 2: Reward): ");
          const tokenContract = tokenType === "1" ? stakingTokenContract : rewardTokenContract;
          const amount = await prompt("Enter amount to approve: ");
          await approveTokens(tokenContract, farmAddress, parseUnits(amount), userAddress);
          break;
        case "3":
          await stakeTokens(farmContract, stakingTokenContract, userAddress);
          break;
        case "4":
          await unstakeTokens(farmContract, stakingTokenContract, rewardTokenContract, userAddress);
          break;
        case "5":
          await harvestRewards(farmContract, rewardTokenContract, userAddress);
          break;
        case "6":
          await transferOwnership(farmContract, userAddress);
          break;
        case "7":
          await updateRewardRate(farmContract, userAddress);
          break;
        case "8":
          await fundFarm(farmContract, rewardTokenContract, userAddress);
          break;
        case "0":
          console.log("Exiting...");
          exit = true;
          break;
        default:
          console.log("Invalid option. Please try again.");
      }
    }
    
    // Close readline interface
    rl.close();
    
  } catch (error) {
    console.error("Error in main function:", error);
    rl.close();
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 