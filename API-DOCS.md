# AI Harvest API Documentation

This document outlines the API interfaces for integrating with the AI Harvest platform.

## Smart Contract Interfaces

### Farm Contract

The Farm contract is the main contract for staking and earning rewards.

#### View Functions

##### `poolInfo(uint256 pid) → PoolInfo`

Returns information about a specific pool.

- Parameters:
  - `pid`: Pool ID
- Returns:
  - `lpToken`: Address of the LP token
  - `allocPoint`: Allocation points assigned to the pool
  - `lastRewardTime`: Last timestamp when rewards were distributed
  - `accRewardPerShare`: Accumulated rewards per share

##### `userInfo(uint256 pid, address user) → UserInfo`

Returns information about a user's position in a specific pool.

- Parameters:
  - `pid`: Pool ID
  - `user`: User address
- Returns:
  - `amount`: Amount of LP tokens staked
  - `rewardDebt`: Reward debt
  - `unlockTime`: Timestamp when tokens can be withdrawn

##### `pendingReward(uint256 pid, address user) → uint256`

Calculates the pending reward for a user in a specific pool.

- Parameters:
  - `pid`: Pool ID
  - `user`: User address
- Returns:
  - Amount of pending rewards

##### `poolLength() → uint256`

Returns the number of pools.

- Returns:
  - Number of pools

#### State-Changing Functions

##### `deposit(uint256 pid, uint256 amount)`

Stakes LP tokens in a specific pool.

- Parameters:
  - `pid`: Pool ID
  - `amount`: Amount of LP tokens to stake

##### `withdraw(uint256 pid, uint256 amount)`

Withdraws LP tokens from a specific pool and claims rewards.

- Parameters:
  - `pid`: Pool ID
  - `amount`: Amount of LP tokens to withdraw

##### `compound(uint256 pid)`

Compounds rewards by reinvesting them.

- Parameters:
  - `pid`: Pool ID

##### `emergencyWithdraw(uint256 pid)`

Withdraws LP tokens in an emergency without claiming rewards.

- Parameters:
  - `pid`: Pool ID

### Factory Contract

#### View Functions

##### `getAllFarms() → address[]`

Returns all deployed Farm contracts.

- Returns:
  - Array of Farm contract addresses

##### `getMyFarms() → address[]`

Returns all Farms created by the caller.

- Returns:
  - Array of Farm contract addresses

#### State-Changing Functions

##### `createFarm(address rewardToken, uint256 rewardPerSecond, uint256 startTime) → address`

Creates a new Farm contract.

- Parameters:
  - `rewardToken`: Address of the reward token
  - `rewardPerSecond`: Amount of reward tokens to distribute per second
  - `startTime`: Timestamp when rewards should start
- Returns:
  - Address of the newly created Farm contract

## JavaScript/TypeScript Integration

### Initialization

```typescript
import { ethers } from 'ethers';
import { FARM_ABI, FACTORY_ABI } from './abis';

// Initialize provider and signer
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// Initialize contracts
const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
const farmContract = new ethers.Contract(FARM_ADDRESS, FARM_ABI, signer);
```

### Fetching Data

```typescript
// Get all pools
async function getAllPools() {
  const poolLength = await farmContract.poolLength();
  const pools = [];
  
  for (let i = 0; i < poolLength; i++) {
    const poolInfo = await farmContract.poolInfo(i);
    pools.push(poolInfo);
  }
  
  return pools;
}

// Get user info for all pools
async function getUserInfo(userAddress) {
  const poolLength = await farmContract.poolLength();
  const positions = [];
  
  for (let i = 0; i < poolLength; i++) {
    const userInfo = await farmContract.userInfo(i, userAddress);
    const pendingReward = await farmContract.pendingReward(i, userAddress);
    
    positions.push({
      poolId: i,
      userInfo,
      pendingReward
    });
  }
  
  return positions;
}
```

### Transactions

```typescript
// Deposit LP tokens
async function deposit(pid, amount) {
  const amountWei = ethers.utils.parseEther(amount);
  const tx = await farmContract.deposit(pid, amountWei);
  return await tx.wait();
}

// Withdraw LP tokens
async function withdraw(pid, amount) {
  const amountWei = ethers.utils.parseEther(amount);
  const tx = await farmContract.withdraw(pid, amountWei);
  return await tx.wait();
}

// Compound rewards
async function compound(pid) {
  const tx = await farmContract.compound(pid);
  return await tx.wait();
}

// Create a new farm
async function createFarm(rewardToken, rewardPerSecond, startTime) {
  const rewardPerSecondWei = ethers.utils.parseEther(rewardPerSecond);
  const tx = await factoryContract.createFarm(rewardToken, rewardPerSecondWei, startTime);
  return await tx.wait();
}
```

## Events

The contracts emit the following events that can be listened to:

### Farm Contract Events

- `Deposit(address indexed user, uint256 indexed pid, uint256 amount)`
- `Withdraw(address indexed user, uint256 indexed pid, uint256 amount)`
- `EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)`
- `Compound(address indexed user, uint256 indexed pid, uint256 amount)`
- `PoolAdded(uint256 indexed pid, address indexed lpToken, uint256 allocPoint)`
- `AllocationPointUpdated(uint256 indexed pid, uint256 oldAllocPoint, uint256 newAllocPoint)`

### Factory Contract Events

- `FarmCreated(address indexed creator, address indexed farm, address rewardToken)`

## Listening to Events

```typescript
// Listen for deposit events
farmContract.on("Deposit", (user, pid, amount, event) => {
  console.log(`User ${user} deposited ${ethers.utils.formatEther(amount)} tokens to pool ${pid}`);
});

// Listen for farm creation events
factoryContract.on("FarmCreated", (creator, farm, rewardToken, event) => {
  console.log(`New farm created at ${farm} by ${creator} with reward token ${rewardToken}`);
});
```

## Error Handling

The contracts use custom errors for better error handling and gas efficiency:

```typescript
try {
  await farmContract.withdraw(pid, amount);
} catch (error) {
  // Extract custom error
  const errorName = error.error?.data?.originalError?.data?.toString() || error.message;
  
  if (errorName.includes("TokensLocked")) {
    console.error("Tokens are still locked. Try again later.");
  } else if (errorName.includes("InsufficientBalance")) {
    console.error("Insufficient balance for withdrawal.");
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Pagination and Data Filtering

When dealing with large amounts of data, you can implement pagination:

```typescript
// Get pools with pagination
async function getPoolsWithPagination(offset, limit) {
  const poolLength = await farmContract.poolLength();
  const pools = [];
  
  const end = Math.min(offset + limit, poolLength);
  
  for (let i = offset; i < end; i++) {
    const poolInfo = await farmContract.poolInfo(i);
    pools.push(poolInfo);
  }
  
  return {
    pools,
    total: poolLength,
    offset,
    limit
  };
}
```

## Rate Limiting

When making multiple calls to the blockchain, it's advisable to implement rate limiting to avoid hitting RPC provider limits:

```typescript
async function getAllUserInfoWithRateLimit(address) {
  const poolLength = await farmContract.poolLength();
  const results = [];
  
  for (let i = 0; i < poolLength; i++) {
    // Add a delay between calls
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const userInfo = await farmContract.userInfo(i, address);
    results.push(userInfo);
  }
  
  return results;
}
```

## Websocket Subscriptions

For real-time updates, you can use websocket providers:

```typescript
const wsProvider = new ethers.providers.WebSocketProvider(WS_RPC_URL);
const farmContractWs = new ethers.Contract(FARM_ADDRESS, FARM_ABI, wsProvider);

// Subscribe to all events
farmContractWs.on("*", (event) => {
  console.log("Event received:", event);
});

// Remember to close the connection when done
function cleanup() {
  wsProvider.removeAllListeners();
  wsProvider.connection.close();
}
``` 