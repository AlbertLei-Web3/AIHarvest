const fs = require('fs');
const path = require('path');

// This script generates a contracts.json file with deployment addresses
// It should be run after deploying contracts, or manually updated
// with the correct addresses from your deployment

// Default values for local development (these will be overridden in CI/CD)
const localAddresses = {
  AIHToken: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  StableCoin: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  Factory: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  SwapRouter: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  Farm: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  Treasury: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
};

// Update these with the correct addresses for your deployed contracts
// You can get these values after running deploy-and-setup.js
const deploymentAddresses = {
  // Mainnet addresses
  mainnet: {
    AIHToken: "",
    StableCoin: "",
    Factory: "",
    SwapRouter: "",
    Farm: "",
    Treasury: "",
  },
  // Testnet addresses (sepolia)
  sepolia: {
    AIHToken: "",
    StableCoin: "",
    Factory: "",
    SwapRouter: "",
    Farm: "",
    Treasury: "",
  },
  // Local development addresses (if using hardhat node)
  localhost: localAddresses,
  // Hardhat network
  hardhat: localAddresses,
};

// Generate ABIs directory if it doesn't exist
const abisDir = path.join(__dirname, '..', 'abis');
if (!fs.existsSync(abisDir)) {
  fs.mkdirSync(abisDir);
}

// Get network from command line argument, default to localhost
const args = process.argv.slice(2);
const network = args[0] || 'localhost';

if (!deploymentAddresses[network]) {
  console.error(`Network ${network} not supported. Available networks: ${Object.keys(deploymentAddresses).join(', ')}`);
  process.exit(1);
}

const addresses = deploymentAddresses[network];

// Generate addresses file
const addressesOutput = {
  network,
  addresses,
  contracts: {
    AIHToken: {
      address: addresses.AIHToken,
      abi: "TestTokenUpgradeable.json",
    },
    StableCoin: {
      address: addresses.StableCoin,
      abi: "TestTokenUpgradeable.json",
    },
    Factory: {
      address: addresses.Factory,
      abi: "FactoryUpgradeable.json",
    },
    SwapRouter: {
      address: addresses.SwapRouter,
      abi: "SwapRouterUpgradeable.json",
    },
    Farm: {
      address: addresses.Farm,
      abi: "FarmUpgradeable.json",
    },
  },
  deploymentTimestamp: new Date().toISOString(),
};

// Write the addresses to a file
fs.writeFileSync(
  path.join(__dirname, '..', 'contracts.json'),
  JSON.stringify(addressesOutput, null, 2)
);

console.log(`Generated contracts.json for network: ${network}`);

// Helper for the frontend to know how to connect
console.log(`
===== FRONTEND CONNECTION GUIDE =====

# To connect to the deployed contracts, add the following to your frontend:

import contractsInfo from './contracts.json';
import { ethers } from 'ethers';

// 连接到Web3提供者
async function connectWallet() {
  // 使用MetaMask或其他Web3提供者
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 创建合约实例
      const aihToken = new ethers.Contract(
        contractsInfo.contracts.AIHToken.address,
        require('./abis/' + contractsInfo.contracts.AIHToken.abi),
        signer
      );
      
      const farm = new ethers.Contract(
        contractsInfo.contracts.Farm.address,
        require('./abis/' + contractsInfo.contracts.Farm.abi),
        signer
      );
      
      const swapRouter = new ethers.Contract(
        contractsInfo.contracts.SwapRouter.address,
        require('./abis/' + contractsInfo.contracts.SwapRouter.abi),
        signer
      );
      
      return { provider, signer, contracts: { aihToken, farm, swapRouter } };
    } catch (error) {
      console.error("User rejected connection", error);
    }
  } else {
    console.error("No Ethereum browser extension detected");
  }
}

// 然后你可以这样使用
const { contracts } = await connectWallet();
const balance = await contracts.aihToken.balanceOf(userAddress);
`);

// Copy the ABIs from the artifacts directory to make them available to the frontend
function copyAbis() {
  try {
    const artifactsDir = path.join(__dirname, '..', 'artifacts', 'contracts');
    
    if (!fs.existsSync(artifactsDir)) {
      console.warn("Artifacts directory not found. Run 'npx hardhat compile' first.");
      return;
    }
    
    const contractNames = [
      'TestTokenUpgradeable.sol/TestTokenUpgradeable.json',
      'FactoryUpgradeable.sol/FactoryUpgradeable.json',
      'SwapRouterUpgradeable.sol/SwapRouterUpgradeable.json',
      'FarmUpgradeable.sol/FarmUpgradeable.json'
    ];
    
    for (const contractName of contractNames) {
      const fullPath = path.join(artifactsDir, contractName);
      const destName = contractName.split('/')[1]; // Get just the JSON filename
      
      if (fs.existsSync(fullPath)) {
        const artifact = require(fullPath);
        const abi = artifact.abi;
        
        fs.writeFileSync(
          path.join(abisDir, destName),
          JSON.stringify({ abi }, null, 2)
        );
        
        console.log(`Copied ABI for ${destName}`);
      } else {
        console.warn(`Contract artifact not found: ${fullPath}`);
      }
    }
  } catch (error) {
    console.error('Error copying ABIs:', error);
  }
}

copyAbis(); 