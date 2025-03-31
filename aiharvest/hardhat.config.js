require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

// Load private key from environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0000000000000000000000000000000000000000000000000000000000000000';

// Load RPC URLs from environment variables
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

// Etherscan API key for verification
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      chainId: 31337,
      forking: process.env.FORK_ENABLED === "true" ? {
        url: MAINNET_RPC_URL,
        blockNumber: process.env.FORK_BLOCK ? parseInt(process.env.FORK_BLOCK) : undefined
      } : undefined,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasMultiplier: 1.2
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: 1,
      gasMultiplier: 1.2
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    gasPrice: 50
  }
}; 