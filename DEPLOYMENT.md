# AI Harvest Deployment Guide

This document provides step-by-step instructions for deploying the AI Harvest project to a testnet for demonstration purposes.

## Prerequisites

Before deployment, make sure you have:

1. **MetaMask Wallet**: With test ETH on your target network
2. **Alchemy Account**: For RPC endpoint access
3. **Etherscan Account**: For contract verification (optional)
4. **Node.js and npm**: Installed on your computer

## Smart Contract Deployment

### Step 1: Configure Environment Variables

1. Navigate to the `aiharvest` directory
2. Create a `.env` file by copying `.env.example`
3. Fill in your private key and API keys:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Step 2: Install Dependencies

Make sure all dependencies are installed:

```bash
cd aiharvest
npm install
```

### Step 3: Deploy to Goerli Testnet

Run the deployment script:

```bash
npx hardhat run scripts/deploy.js --network goerli
```

This will output something like:

```
Deploying contracts with the account: 0x...
TestToken deployed to: 0x123...
Factory deployed to: 0x456...
Farm deployed to: 0x789...
```

**Important**: Save these addresses for the frontend configuration.

### Step 4: Verify Contracts (Optional)

If you provided an Etherscan API key, you can verify the contracts:

```bash
npx hardhat verify --network goerli 0x123... # TestToken address
npx hardhat verify --network goerli 0x456... # Factory address
npx hardhat verify --network goerli 0x789... # Farm address
```

## Frontend Deployment

### Step 1: Configure Environment Variables

1. Navigate to the `frontend-react` directory
2. Create a `.env` file by copying `.env.example`
3. Update with your deployed contract addresses:

```
REACT_APP_FACTORY_ADDRESS=0x456... # Factory address from the deployment
REACT_APP_NETWORK_ID=5 # 5 for Goerli, 11155111 for Sepolia
REACT_APP_RPC_URL=https://eth-goerli.g.alchemy.com/v2/your_alchemy_key
```

### Step 2: Install Dependencies

```bash
cd frontend-react
npm install
```

### Step 3: Build for Production

Generate a production build:

```bash
npm run build
```

This creates a `build` directory with optimized files.

### Step 4: Deploy to Netlify

The easiest way to deploy is using Netlify:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod --dir=build`

Alternatively, you can use the Netlify web interface:

1. Go to [Netlify](https://app.netlify.com/)
2. Create a new site from Git or drag & drop the `build` folder

### Step 5: Configure Redirects

For React Router to work properly, add a `_redirects` file in the `public` directory with:

```
/*    /index.html   200
```

## Testing the Deployment

1. Visit your deployed frontend URL
2. Connect your MetaMask wallet
3. Make sure you're on the Goerli testnet
4. Try to interact with the farming pools

## Common Issues and Troubleshooting

### Contract Deployment Failures

- Ensure you have enough test ETH for gas
- Check that your private key is correct
- Verify network connectivity

### Frontend Connection Issues

- Ensure the contract addresses in `.env` are correct
- Check that MetaMask is connected to the right network
- Clear browser cache if you experience persistent issues

### RPC Rate Limiting

If you encounter "Rate limit exceeded" errors:
- Create a dedicated API key for this project
- Consider using a paid Alchemy plan for demos

## Demo Preparation

For interview demonstrations, prepare the following:

1. Create several test accounts with different balances
2. Pre-populate some farming pools with liquidity
3. Create a script to showcase the compounding feature
4. Prepare a brief explanation of the architecture 