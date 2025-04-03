// Farm Types
export interface PoolInfo {
  id: number;
  stakingToken: string;
  rewardToken: string;
  totalStaked: string;
  rewardRate: string;
  apr: string;
  name?: string;
  symbol?: string;
  rewardSymbol?: string;
  lpToken?: string;
}

export interface UserInfo {
  amount: string;
  rewardDebt: string;
  pendingReward: string;
  pendingRewards?: string;
  unlockTime?: number;
}

export interface FarmData {
  rewardToken: string;
  rewardPerSecond: string;
  startTime: number;
  endTime: number;
  totalAllocPoint: number;
}

// UI Types
export interface ConnectWalletProps {
  onConnect: () => Promise<void>;
  isConnected: boolean;
  walletAddress: string | null;
}

export interface FarmCardProps {
  poolId: number;
  poolInfo: PoolInfo;
  userInfo: UserInfo | null;
  onDeposit: (pid: number, amount: string) => Promise<void>;
  onWithdraw: (pid: number, amount: string) => Promise<void>;
  onCompound: (pid: number) => Promise<void>;
}

export interface StakingPositionProps {
  poolId: number;
  poolInfo: PoolInfo;
  userInfo: UserInfo;
  onWithdraw: (pid: number, amount: string) => Promise<void>;
  onCompound: (pid: number) => Promise<void>;
}

export interface SwapFormProps {
  onSwap: (fromToken: string, toToken: string, amount: string) => Promise<void>;
  tokens: TokenInfo[];
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
}

// Swap Types
export interface SwapPair {
  tokenA: string;
  tokenB: string;
  exchangeRate: string;
  lpBalance: string;
}

export interface SwapInfo {
  lpFee: string; // 0.25%
  protocolFee: string; // 0.05%
  treasury: string;
}

export interface SwapResult {
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  lpFeeAmount: string;
  protocolFeeAmount: string;
  transactionHash: string;
}

// State Types
export interface AppState {
  loading: boolean;
  connected: boolean;
  walletAddress: string | null;
  chainId: number | null;
  farms: PoolInfo[];
  userFarms: Record<number, UserInfo>;
  tokens: TokenInfo[];
  errors: string[];
}

// API Types
export interface Transaction {
  hash: string;
  wait: () => Promise<any>;
}

export interface FarmAPI {
  getPoolInfo(pid: number): Promise<PoolInfo>;
  deposit(pid: number, amount: string): Promise<Transaction>;
  withdraw(pid: number, amount: string): Promise<Transaction>;
  pendingReward(pid: number, userAddress: string): Promise<string>;
  compound(pid: number): Promise<Transaction>;
}

export interface FactoryAPI {
  createFarm(
    rewardToken: string,
    rewardPerSecond: string,
    startTime: number
  ): Promise<Transaction>;
  getAllFarms(): Promise<string[]>;
  getSwapRouter(): Promise<string>;
  createSwapRouter(treasury: string): Promise<Transaction>;
}

export interface SwapAPI {
  getExchangeRate(fromToken: string, toToken: string): Promise<string>;
  getOutputAmount(fromToken: string, toToken: string, amount: string): Promise<string>;
  swap(fromToken: string, toToken: string, amount: string): Promise<Transaction>;
  addLiquidity(tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<Transaction>;
  getLpBalance(tokenA: string, tokenB: string): Promise<string>;
  getSwapInfo(): Promise<SwapInfo>;
}

// Contract ABIs
export const FARM_ABI = [
  "function stake(uint256 _amount) external",
  "function withdraw(uint256 _amount) external",
  "function harvest() external",
  "function compound() external",
  "function getPendingReward(address _user) view returns (uint256)",
  "function getUserInfo(address _user) view returns (uint256, uint256)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function stakingToken() view returns (address)",
  "function rewardToken() view returns (address)"
];

export const FACTORY_ABI = [
  "function getAllFarms() view returns (address[])",
  "function createFarm(address _stakingToken, address _rewardToken, uint256 _rewardRate) external returns (address)",
  "function getFarmCount() view returns (uint256)",
  "function createSwapRouter(address _treasury) external returns (address)",
  "function getSwapRouter() view returns (address)",
  "function swapRouter() view returns (address)"
];

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address recipient, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

export const SWAP_ROUTER_ABI = [
  "function swap(address fromToken, address toToken, uint256 amount) external returns (uint256)",
  "function getOutputAmount(address fromToken, address toToken, uint256 amount) external view returns (uint256)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function setExchangeRate(address tokenA, address tokenB, uint256 rate) external",
  "function exchangeRates(address tokenA, address tokenB) view returns (uint256)",
  "function lpBalances(address tokenA, address tokenB) view returns (uint256)",
  "function lpFee() view returns (uint256)",
  "function protocolFee() view returns (uint256)",
  "function treasury() view returns (address)"
];

export const SIMPLE_SWAP_ROUTER_ABI = [
  "function FEE_DENOMINATOR() external view returns (uint256)",
  "function fee() external view returns (uint256)",
  "function lpFee() external view returns (uint256)",
  "function protocolFee() external view returns (uint256)",
  "function treasury() external view returns (address)",
  "function maxSwapAmount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function paused() external view returns (bool)",
  "function whitelistEnabled() external view returns (bool)",
  "function whitelistedTokens(address) external view returns (bool)",
  "function exchangeRates(address, address) external view returns (uint256)",
  "function lpBalances(address, address) external view returns (uint256)",
  "function version() external pure returns (string)",
  "function getOutputAmount(address fromToken, address toToken, uint256 amount) external view returns (uint256)",
  "function swap(address fromToken, address toToken, uint256 amount) external returns (uint256)",
  "function addLiquidity(address tokenA, address tokenB, uint256 amountA, uint256 amountB) external",
  "function addTokenToWhitelist(address token) external",
  "function removeTokenFromWhitelist(address token) external",
  "function setExchangeRate(address tokenA, address tokenB, uint256 rate) external",
  "function setMaxSwapAmount(uint256 _maxAmount) external",
  "function setTreasury(address _treasury) external",
  "function setWhitelistStatus(bool enabled) external",
  "function updateFees(uint256 _lpFee, uint256 _protocolFee) external",
  "function emergencyWithdraw(address token, address to, uint256 amount) external",
  "function pause() external",
  "function unpause() external",
  "function transferOwnership(address newOwner) external",
  "function renounceOwnership() external",
  "event TokenSwapped(address indexed fromToken, address indexed toToken, address indexed user, uint256 fromAmount, uint256 toAmount, uint256 fee)",
  "event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 share)",
  "event ExchangeRateUpdated(address indexed tokenA, address indexed tokenB, uint256 newRate)",
  "event FeeUpdated(uint256 newFee)",
  "event TreasuryUpdated(address oldTreasury, address newTreasury)",
  "event MaxSwapAmountUpdated(uint256 oldLimit, uint256 newLimit)",
  "event TokenAddedToWhitelist(address indexed token)",
  "event TokenRemovedFromWhitelist(address indexed token)",
  "event WhitelistStatusChanged(bool enabled)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
]; 