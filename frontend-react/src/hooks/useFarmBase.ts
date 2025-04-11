import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { useFarmStore } from '../store';
import SimpleFarmABI from '../abis/SimpleFarm.json';

// 环境变量
const FARM_ADDRESS = process.env.REACT_APP_FARM_ADDRESS || '0x0000000000000000000000000000000000000000';

// 类型定义
export interface UserInfo {
  amount: string;
  rewardDebt: string;
  pendingRewards: string;
  unlockTime: number;
}

export interface PoolInfo {
  stakingToken: string;
  totalStaked: string;
  rewardPerBlock: string;
  lastRewardBlock: number;
  accRewardPerShare: string;
  lockDuration: number;
}

export interface FarmData {
  owner: string;
  stakingToken: string;
  rewardToken: string;
  rewardRate: string;
  totalStaked: string;
  lockDuration: number;
}

export interface UseFarmBaseReturn {
  farmContract: ethers.Contract | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (context: string, error: any) => null;
  FARM_ADDRESS: string;
}

/**
 * 基础Farm钩子，提供共享状态和通用功能
 */
export function useFarmBase(): UseFarmBaseReturn {
  const { provider, signer, account, isConnected } = useWeb3();
  const [farmContract, setFarmContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化合约实例
  const initContract = useCallback((address: string, abi: any) => {
    if (!provider) return null;
    
    try {
      const contract = new ethers.Contract(
        address,
        abi,
        signer || provider
      );
      setFarmContract(contract);
      return contract;
    } catch (err) {
      console.error("❌ Contract initialization error:", err);
      setError("Failed to initialize contract");
      return null;
    }
  }, [provider, signer]);

  // 统一错误处理函数
  const handleError = useCallback((context: string, error: any) => {
    const message = error?.message || error?.reason || 'Unknown error';
    const errorMsg = `${context}: ${message}`;
    console.error(`❌ ${errorMsg}`, error);
    setError(errorMsg);
    return null;
  }, []);

  return {
    farmContract,
    provider,
    signer,
    account,
    isConnected,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    FARM_ADDRESS
  };
}

export default useFarmBase; 