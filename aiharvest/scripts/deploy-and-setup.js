// deploy-and-setup.js - Comprehensive deployment script for AI Harvest platform
// This script handles the deployment of all upgradeable contracts and their initialization
require('dotenv').config();
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Starting AI Harvest platform deployment...");
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to network: ${network.name} (chainId: ${network.chainId})`);
  
  // Get deployment accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // Load configuration from environment
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const farmLockDuration = process.env.FARM_LOCK_DURATION || 86400; // 24 hours in seconds
  const initialSupply = process.env.INITIAL_SUPPLY || "1000000"; // 1 million tokens
  
  console.log(`Treasury address: ${treasuryAddress}`);
  console.log(`Farm lock duration: ${farmLockDuration} seconds`);
  console.log(`Initial token supply: ${initialSupply} tokens`);
  
  // Deploy TestToken (AIH Token)
  console.log("\nDeploying TestTokenUpgradeable (AIH Token)...");
  const TestToken = await ethers.getContractFactory("TestTokenUpgradeable");
  const aihToken = await upgrades.deployProxy(TestToken, ["AI Harvest Token", "AIH"], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await aihToken.deployed();
  console.log(`AIH Token deployed to: ${aihToken.address}`);
  
  // Mint initial supply to deployer
  const mintTx = await aihToken.mint(deployer.address, ethers.utils.parseEther(initialSupply));
  await mintTx.wait();
  console.log(`Minted ${initialSupply} AIH tokens to deployer`);
  
  // Deploy a stable coin for testing (USDC mock)
  console.log("\nDeploying StableCoin (USDC Mock)...");
  const stableCoin = await upgrades.deployProxy(TestToken, ["USD Coin", "USDC"], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await stableCoin.deployed();
  console.log(`StableCoin deployed to: ${stableCoin.address}`);
  
  // Mint some stable coins to deployer for testing
  const stableMintTx = await stableCoin.mint(deployer.address, ethers.utils.parseEther("1000000"));
  await stableMintTx.wait();
  console.log(`Minted 1,000,000 USDC to deployer`);
  
  // Deploy Factory
  console.log("\nDeploying FactoryUpgradeable...");
  const Factory = await ethers.getContractFactory("FactoryUpgradeable");
  const factory = await upgrades.deployProxy(Factory, [treasuryAddress], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await factory.deployed();
  console.log(`Factory deployed to: ${factory.address}`);
  
  // Deploy Farm implementation
  console.log("\nDeploying FarmUpgradeable implementation...");
  const Farm = await ethers.getContractFactory("FarmUpgradeable");
  const farmImplementation = await Farm.deploy();
  await farmImplementation.deployed();
  console.log(`Farm implementation deployed to: ${farmImplementation.address}`);
  
  // Register Farm implementation in Factory
  console.log("\nRegistering Farm implementation in Factory...");
  const registerFarmTx = await factory.setFarmImplementation(farmImplementation.address);
  await registerFarmTx.wait();
  console.log(`Farm implementation registered`);
  
  // Deploy SwapRouter
  console.log("\nDeploying SwapRouterUpgradeable...");
  const SwapRouter = await ethers.getContractFactory("SwapRouterUpgradeable");
  const swapRouter = await upgrades.deployProxy(SwapRouter, [treasuryAddress, 300], { // 0.3% fee
    initializer: 'initialize',
    kind: 'uups'
  });
  await swapRouter.deployed();
  console.log(`SwapRouter deployed to: ${swapRouter.address}`);
  
  // Create first farm through factory
  console.log("\nCreating first farm (AIH Staking)...");
  const createFarmTx = await factory.createFarm(
    aihToken.address,  // reward token
    aihToken.address,  // staking token (self-staking)
    ethers.utils.parseEther("100"),  // rewards per block
    0,  // start block (0 = current block)
    farmLockDuration  // lock duration in seconds
  );
  const receipt = await createFarmTx.wait();
  
  // Get the farm address from events
  let farmAddress;
  for (const event of receipt.events) {
    if (event.event === 'FarmCreated') {
      farmAddress = event.args.farm;
      break;
    }
  }
  console.log(`AIH Staking Farm created at: ${farmAddress}`);
  
  // Create a second farm for staking USDC
  console.log("\nCreating second farm (USDC Staking)...");
  const createSecondFarmTx = await factory.createFarm(
    aihToken.address,  // reward token
    stableCoin.address,  // staking token (USDC)
    ethers.utils.parseEther("200"),  // rewards per block
    0,  // start block (0 = current block)
    farmLockDuration  // lock duration in seconds
  );
  const receipt2 = await createSecondFarmTx.wait();
  
  // Get the second farm address from events
  let secondFarmAddress;
  for (const event of receipt2.events) {
    if (event.event === 'FarmCreated') {
      secondFarmAddress = event.args.farm;
      break;
    }
  }
  console.log(`USDC Staking Farm created at: ${secondFarmAddress}`);
  
  // Add some initial liquidity to SwapRouter for AIH/USDC pair
  console.log("\nSetting up initial liquidity in SwapRouter...");
  
  // Approve tokens for the router
  const approveAihTx = await aihToken.approve(swapRouter.address, ethers.utils.parseEther("100000"));
  await approveAihTx.wait();
  
  const approveUsdcTx = await stableCoin.approve(swapRouter.address, ethers.utils.parseEther("100000"));
  await approveUsdcTx.wait();
  
  // Add liquidity
  const addLiquidityTx = await swapRouter.addLiquidity(
    aihToken.address,
    stableCoin.address,
    ethers.utils.parseEther("100000"),  // 100,000 AIH
    ethers.utils.parseEther("100000"),  // 100,000 USDC (1:1 initial rate)
    0,  // min AIH
    0,  // min USDC
    deployer.address,
    Math.floor(Date.now() / 1000) + 3600  // deadline: 1 hour from now
  );
  await addLiquidityTx.wait();
  console.log(`Liquidity added to AIH/USDC pair`);
  
  // Fund the staking rewards pool
  console.log("\nFunding staking rewards pools...");
  
  // Fund the AIH staking pool
  const farm = await ethers.getContractAt("FarmUpgradeable", farmAddress);
  const fundAihFarmTx = await aihToken.transfer(farm.address, ethers.utils.parseEther("500000"));
  await fundAihFarmTx.wait();
  console.log(`Funded AIH staking pool with 500,000 AIH tokens`);
  
  // Fund the USDC staking pool
  const secondFarm = await ethers.getContractAt("FarmUpgradeable", secondFarmAddress);
  const fundUsdcFarmTx = await aihToken.transfer(secondFarm.address, ethers.utils.parseEther("500000"));
  await fundUsdcFarmTx.wait();
  console.log(`Funded USDC staking pool with 500,000 AIH tokens`);
  
  // Save deployment information
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId
    },
    deployer: deployer.address,
    contracts: {
      AIHToken: {
        address: aihToken.address,
        name: "AI Harvest Token",
        symbol: "AIH",
        implementation: await upgrades.erc1967.getImplementationAddress(aihToken.address)
      },
      StableCoin: {
        address: stableCoin.address,
        name: "USD Coin (Mock)",
        symbol: "USDC",
        implementation: await upgrades.erc1967.getImplementationAddress(stableCoin.address)
      },
      Factory: {
        address: factory.address,
        implementation: await upgrades.erc1967.getImplementationAddress(factory.address)
      },
      AIHFarm: {
        address: farmAddress,
        stakingToken: aihToken.address,
        rewardToken: aihToken.address
      },
      USDCFarm: {
        address: secondFarmAddress,
        stakingToken: stableCoin.address,
        rewardToken: aihToken.address
      },
      SwapRouter: {
        address: swapRouter.address,
        implementation: await upgrades.erc1967.getImplementationAddress(swapRouter.address)
      }
    },
    timestamp: new Date().toISOString()
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network.name}-deployment.json`);
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\nDeployment information saved to: ${deploymentFile}`);
  
  // Also run the generate-contracts-json.js script if it exists
  try {
    require('./generate-contracts-json');
    console.log("Generated contracts.json and ABI files for the frontend");
  } catch (error) {
    console.warn("Could not auto-generate contracts.json file. Please run the generate-contracts script manually.");
  }
  
  console.log("\n🚀 AI Harvest platform deployment completed! 🚀");
  console.log("\nSummary of deployed contracts:");
  console.log(`AIH Token: ${aihToken.address}`);
  console.log(`USDC (Mock): ${stableCoin.address}`);
  console.log(`Factory: ${factory.address}`);
  console.log(`SwapRouter: ${swapRouter.address}`);
  console.log(`AIH Staking Farm: ${farmAddress}`);
  console.log(`USDC Staking Farm: ${secondFarmAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 