// upgrade-contracts.js - Script to upgrade contracts from V1 to V2 versions
require('dotenv').config();
const hre = require("hardhat");
const { ethers, upgrades } = hre;
const fs = require('fs');
const path = require('path');

// Load deployment info from file
function loadDeploymentInfo(networkName) {
  const deploymentFile = path.join(__dirname, `../deployments/${networkName}-deployment.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found for network: ${networkName}`);
  }
  return JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
}

async function main() {
  console.log("Starting AI Harvest platform upgrade process...");
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log(`Upgrading on network: ${network.name} (chainId: ${network.chainId})`);
  
  // Load deployment info
  let deploymentInfo;
  try {
    deploymentInfo = loadDeploymentInfo(network.name);
    console.log("Loaded deployment information");
  } catch (error) {
    console.error(`Error loading deployment info: ${error.message}`);
    console.log("Please make sure you've deployed the contracts first using deploy-and-setup.js");
    process.exit(1);
  }
  
  // Get deployment accounts
  const [deployer] = await ethers.getSigners();
  console.log(`Upgrader address: ${deployer.address}`);
  console.log(`Upgrader balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);
  
  // Confirm upgrade with contract owner
  if (deploymentInfo.deployer !== deployer.address) {
    console.warn(`WARNING: You are upgrading contracts as ${deployer.address}, but they were deployed by ${deploymentInfo.deployer}`);
    console.log("Make sure you have the necessary permissions to upgrade these contracts!");
  }
  
  console.log("\n==== Contracts to be upgraded ====");
  console.log(`AIH Token: ${deploymentInfo.contracts.AIHToken.address}`);
  console.log(`StableCoin: ${deploymentInfo.contracts.StableCoin.address}`);
  console.log(`Factory: ${deploymentInfo.contracts.Factory.address}`);
  console.log(`SwapRouter: ${deploymentInfo.contracts.SwapRouter.address}`);
  console.log("================================\n");
  
  // Upgrade TestToken to V2
  console.log("\n1. Upgrading TestTokenUpgradeable to V2...");
  const TestTokenV2 = await ethers.getContractFactory("TestTokenUpgradeableV2");
  
  // Upgrade AIH Token
  console.log("Upgrading AIH Token...");
  const upgradedAIH = await upgrades.upgradeProxy(
    deploymentInfo.contracts.AIHToken.address,
    TestTokenV2
  );
  await upgradedAIH.deployed();
  console.log(`AIH Token upgraded to V2 at the same address: ${upgradedAIH.address}`);
  
  // Verify the version
  const aihVersion = await upgradedAIH.version();
  console.log(`AIH Token version: ${aihVersion}`);
  
  // Upgrade StableCoin
  console.log("\nUpgrading StableCoin (USDC Mock)...");
  const upgradedStableCoin = await upgrades.upgradeProxy(
    deploymentInfo.contracts.StableCoin.address,
    TestTokenV2
  );
  await upgradedStableCoin.deployed();
  console.log(`StableCoin upgraded to V2 at the same address: ${upgradedStableCoin.address}`);
  
  // Verify the stable coin version
  const stableCoinVersion = await upgradedStableCoin.version();
  console.log(`StableCoin version: ${stableCoinVersion}`);
  
  // Upgrade Factory to V2
  console.log("\n2. Upgrading FactoryUpgradeable to V2...");
  const FactoryV2 = await ethers.getContractFactory("FactoryUpgradeableV2");
  const upgradedFactory = await upgrades.upgradeProxy(
    deploymentInfo.contracts.Factory.address,
    FactoryV2
  );
  await upgradedFactory.deployed();
  console.log(`Factory upgraded to V2 at the same address: ${upgradedFactory.address}`);
  
  // Verify the factory version
  const factoryVersion = await upgradedFactory.version();
  console.log(`Factory version: ${factoryVersion}`);
  
  // Upgrade Farm implementation in Factory
  console.log("\n3. Deploying and registering FarmUpgradeableV2 implementation...");
  const FarmV2 = await ethers.getContractFactory("FarmUpgradeableV2");
  const farmV2Implementation = await FarmV2.deploy();
  await farmV2Implementation.deployed();
  console.log(`Farm V2 implementation deployed to: ${farmV2Implementation.address}`);
  
  // Register the new Farm implementation in the Factory
  const registerFarmTx = await upgradedFactory.setFarmImplementation(farmV2Implementation.address);
  await registerFarmTx.wait();
  console.log("Registered Farm V2 implementation in Factory");
  
  // Upgrade SwapRouter to V2
  console.log("\n4. Upgrading SwapRouterUpgradeable to V2...");
  const SwapRouterV2 = await ethers.getContractFactory("SwapRouterUpgradeableV2");
  const upgradedSwapRouter = await upgrades.upgradeProxy(
    deploymentInfo.contracts.SwapRouter.address,
    SwapRouterV2
  );
  await upgradedSwapRouter.deployed();
  console.log(`SwapRouter upgraded to V2 at the same address: ${upgradedSwapRouter.address}`);
  
  // Verify the swap router version
  const swapRouterVersion = await upgradedSwapRouter.version();
  console.log(`SwapRouter version: ${swapRouterVersion}`);
  
  // Upgrade individual Farms if needed
  // Note: This section is optional as farms could be redeployed with V2 implementations
  // through the factory if needed rather than upgrading existing ones
  console.log("\n5. NOTE: Individual Farm contracts are NOT being upgraded in this script");
  console.log("New farms created after this upgrade will use the V2 implementation");
  console.log("To upgrade existing farms, you would need to implement proxy patterns for them directly");
  
  // Enable new V2 features
  console.log("\n6. Configuring V2 features...");
  
  // Configure AIH Token V2 features
  console.log("Configuring AIH Token V2 features...");
  const setMaxSupplyTx = await upgradedAIH.setMaxSupply(ethers.utils.parseEther("10000000")); // 10 million max
  await setMaxSupplyTx.wait();
  console.log("Set AIH Token max supply to 10,000,000");
  
  // Configure SwapRouter V2 features
  console.log("\nConfiguring SwapRouter V2 features...");
  const setMaxTransferTx = await upgradedSwapRouter.setMaxTransferAmount(
    upgradedAIH.address, 
    ethers.utils.parseEther("100000")
  );
  await setMaxTransferTx.wait();
  console.log("Set AIH Token max transfer amount to 100,000 AIH in SwapRouter");
  
  // Add tokens to whitelist
  const addToWhitelistTx = await upgradedSwapRouter.addToWhitelist(upgradedAIH.address);
  await addToWhitelistTx.wait();
  const addStableToWhitelistTx = await upgradedSwapRouter.addToWhitelist(upgradedStableCoin.address);
  await addStableToWhitelistTx.wait();
  console.log("Added AIH and USDC tokens to the SwapRouter whitelist");
  
  // Configure Factory V2 features
  console.log("\nConfiguring Factory V2 features...");
  // Example: Set system parameters in the factory
  const setMinStakeTx = await upgradedFactory.setMinimumStakeAmount(ethers.utils.parseEther("1"));
  await setMinStakeTx.wait();
  console.log("Set minimum stake amount to 1 token in Factory");
  
  // Update deployment information
  deploymentInfo.contracts.AIHToken.implementation = await upgrades.erc1967.getImplementationAddress(upgradedAIH.address);
  deploymentInfo.contracts.AIHToken.version = aihVersion;
  
  deploymentInfo.contracts.StableCoin.implementation = await upgrades.erc1967.getImplementationAddress(upgradedStableCoin.address);
  deploymentInfo.contracts.StableCoin.version = stableCoinVersion;
  
  deploymentInfo.contracts.Factory.implementation = await upgrades.erc1967.getImplementationAddress(upgradedFactory.address);
  deploymentInfo.contracts.Factory.version = factoryVersion;
  
  deploymentInfo.contracts.SwapRouter.implementation = await upgrades.erc1967.getImplementationAddress(upgradedSwapRouter.address);
  deploymentInfo.contracts.SwapRouter.version = swapRouterVersion;
  
  deploymentInfo.upgradeTimestamp = new Date().toISOString();
  
  // Save updated deployment info
  const deploymentFile = path.join(__dirname, `../deployments/${network.name}-deployment.json`);
  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\nUpdated deployment information saved to: ${deploymentFile}`);
  
  // Also run the generate-contracts-json.js script to update contract info for frontend
  try {
    require('./generate-contracts-json');
    console.log("Updated contracts.json and ABI files for the frontend");
  } catch (error) {
    console.warn("Could not auto-generate contracts.json file. Please run the generate-contracts script manually.");
  }
  
  console.log("\n🚀 AI Harvest platform upgrade completed! 🚀");
  console.log("\nAll contracts have been upgraded to V2");
  console.log("New features are now available in your DeFi platform!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 