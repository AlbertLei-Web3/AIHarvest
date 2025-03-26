# AI Harvest Setup Guide

This guide provides step-by-step instructions for setting up and running the AI Harvest project locally and deploying it to a testnet.

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- MetaMask browser extension
- Git

## Local Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AIHarvest
```

### 2. Smart Contract Setup

Navigate to the smart contract directory and install dependencies:

```bash
cd aiharvest
npm install
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend-react
npm install
```

### 4. Running the Frontend Locally

Start the development server:

```bash
npm start
```

This will launch the application on http://localhost:3000

### 5. Connecting with MetaMask

1. Install MetaMask browser extension if you haven't already
2. Create or import a wallet
3. Connect to the local network (localhost:8545) or a testnet
4. Ensure you have some test ETH in your wallet

## Testnet Deployment

### 1. Smart Contract Deployment

#### Setting Up Environment Variables

Create a `.env` file in the `aiharvest` directory with the following variables:

```
PRIVATE_KEY=your_private_key_here
ALCHEMY_API_KEY=your_alchemy_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Deploying to Goerli Testnet

```bash
cd aiharvest
npx hardhat run scripts/deploy.js --network goerli
```

This will deploy the contracts to the Goerli testnet and output the contract addresses. Save these addresses as you'll need them for the frontend configuration.

### 2. Frontend Deployment Configuration

Update the contract addresses in the frontend configuration:

1. Create a `.env` file in the `frontend-react` directory with the following variables:

```
REACT_APP_FACTORY_ADDRESS=deployed_factory_contract_address
REACT_APP_NETWORK_ID=5 # For Goerli testnet
```

### 3. Building and Deploying the Frontend

Build the frontend for production:

```bash
cd frontend-react
npm run build
```

The built files will be in the `build` directory. You can deploy these files to any static hosting service like Netlify, Vercel, or GitHub Pages.

#### Deploying to Netlify (Example)

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Deploy: `netlify deploy --prod --dir=build`

#### Deploying to Vercel (Example)

1. Install Vercel CLI: `npm install -g vercel`
2. Deploy: `vercel --prod`

## Testing

### Smart Contract Testing

Run the smart contract tests:

```bash
cd aiharvest
npx hardhat test
```

### Frontend Testing

Run the frontend tests:

```bash
cd frontend-react
npm test
```

## Troubleshooting

### Common Issues

1. **MetaMask Connection Issues**
   - Ensure MetaMask is unlocked
   - Check if you're connected to the correct network
   - Try resetting your MetaMask account (Settings > Advanced > Reset Account)

2. **Smart Contract Deployment Failures**
   - Check if you have enough test ETH for gas fees
   - Verify that your private key in .env is correct
   - Ensure you're deploying to the right network

3. **Frontend Connection Issues**
   - Verify that contract addresses in .env are correct
   - Check browser console for errors

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Ethers.js Documentation](https://docs.ethers.io/v5/)
- [MetaMask Documentation](https://docs.metamask.io/) 