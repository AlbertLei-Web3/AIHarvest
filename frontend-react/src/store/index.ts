import { create } from 'zustand';
import { ethers } from 'ethers';
import { PoolInfo, UserInfo, TokenInfo, SwapPair, SwapInfo } from '../types';

interface FarmState {
  // UI States
  isLoading: boolean;
  errorMessage: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Wallet States
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  setAccount: (account: string | null) => void;
  setChainId: (chainId: number | null) => void;
  setConnected: (connected: boolean) => void;
  
  // Farm Contract States
  factoryAddress: string | null;
  currentFarmAddress: string | null;
  swapRouterAddress: string | null;
  farms: string[];
  pools: PoolInfo[];
  userStakeInfo: Record<number, UserInfo>;
  pendingRewards: Record<number, string>;
  userStakes: Record<number, string>;
  
  // Actions
  setFactoryAddress: (address: string) => void;
  setCurrentFarmAddress: (address: string) => void;
  setSwapRouterAddress: (address: string) => void;
  setFarms: (farms: string[]) => void;
  setPools: (pools: PoolInfo[]) => void;
  updatePool: (pool: PoolInfo) => void;
  setUserStakeInfo: (pid: number, info: UserInfo) => void;
  setPendingReward: (pid: number, amount: string) => void;
  setUserStake: (pid: number, amount: string) => void;
  setPoolInfo: (pid: number, info: Partial<PoolInfo>) => void;
  
  // Token States
  tokens: TokenInfo[];
  setTokens: (tokens: TokenInfo[]) => void;
  updateTokenBalance: (address: string, balance: string) => void;
  
  // Swap States
  swapPairs: SwapPair[];
  swapInfo: SwapInfo | null;
  setSwapPairs: (pairs: SwapPair[]) => void;
  addSwapPair: (pair: SwapPair) => void;
  updateSwapPair: (tokenA: string, tokenB: string, updates: Partial<SwapPair>) => void;
  setSwapInfo: (info: SwapInfo) => void;
}

export const useFarmStore = create<FarmState>((set) => ({
  // UI States
  isLoading: false,
  errorMessage: null,
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ errorMessage: error }),
  
  // Wallet States
  account: null,
  chainId: null,
  isConnected: false,
  setAccount: (account: string | null) => set({ account }),
  setChainId: (chainId: number | null) => set({ chainId }),
  setConnected: (connected: boolean) => set({ isConnected: connected }),
  
  // Farm Contract States
  factoryAddress: process.env.REACT_APP_FACTORY_ADDRESS || null,
  currentFarmAddress: null,
  swapRouterAddress: null,
  farms: [],
  pools: [],
  userStakeInfo: {},
  pendingRewards: {},
  userStakes: {},
  
  // Actions
  setFactoryAddress: (address: string) => set({ factoryAddress: address }),
  setCurrentFarmAddress: (address: string) => set({ currentFarmAddress: address }),
  setSwapRouterAddress: (address: string) => set({ swapRouterAddress: address }),
  setFarms: (farms: string[]) => set({ farms }),
  setPools: (pools: PoolInfo[]) => set({ pools }),
  updatePool: (pool: PoolInfo) => set((state) => ({ 
    pools: state.pools.map(p => p.id === pool.id ? pool : p) 
  })),
  setUserStakeInfo: (pid: number, info: UserInfo) => set((state) => ({ 
    userStakeInfo: { ...state.userStakeInfo, [pid]: info } 
  })),
  setPendingReward: (pid: number, amount: string) => set((state) => ({ 
    pendingRewards: { ...state.pendingRewards, [pid]: amount } 
  })),
  setUserStake: (pid: number, amount: string) => set((state) => ({ 
    userStakes: { ...state.userStakes, [pid]: amount } 
  })),
  setPoolInfo: (pid: number, info: Partial<PoolInfo>) => set((state) => ({ 
    pools: state.pools.map(p => p.id === pid ? { ...p, ...info } : p) 
  })),
  
  // Token States
  tokens: [],
  setTokens: (tokens: TokenInfo[]) => set({ tokens }),
  updateTokenBalance: (address: string, balance: string) => set((state) => ({
    tokens: state.tokens.map(token => 
      token.address.toLowerCase() === address.toLowerCase() 
        ? { ...token, balance } 
        : token
    )
  })),
  
  // Swap States
  swapPairs: [],
  swapInfo: null,
  setSwapPairs: (pairs: SwapPair[]) => set({ swapPairs: pairs }),
  addSwapPair: (pair: SwapPair) => set((state) => ({ 
    swapPairs: [...state.swapPairs, pair] 
  })),
  updateSwapPair: (tokenA: string, tokenB: string, updates: Partial<SwapPair>) => set((state) => ({
    swapPairs: state.swapPairs.map(pair => 
      (pair.tokenA.toLowerCase() === tokenA.toLowerCase() && pair.tokenB.toLowerCase() === tokenB.toLowerCase()) ||
      (pair.tokenA.toLowerCase() === tokenB.toLowerCase() && pair.tokenB.toLowerCase() === tokenA.toLowerCase())
        ? { ...pair, ...updates }
        : pair
    )
  })),
  setSwapInfo: (info: SwapInfo) => set({ swapInfo: info }),
})); 