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
  "function getFarmCount() view returns (uint256)"
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