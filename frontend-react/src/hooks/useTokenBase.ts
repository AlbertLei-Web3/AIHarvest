import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { ERC20_ABI } from '../types';

// 环境变量
const AIH_TOKEN_ADDRESS = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';
const USDC_TOKEN_ADDRESS = process.env.REACT_APP_USDC_TOKEN_ADDRESS || '0x0000000000000000000000000000000000000000';

// 类型定义
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  balance: string;
}

export interface UseTokenBaseReturn {
  tokenContract: ethers.Contract | null;
  setTokenContract: (contract: ethers.Contract | null) => void;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (action: string, error: any) => null;
  AIH_TOKEN_ADDRESS: string;
  USDC_TOKEN_ADDRESS: string;
  ERC20ABI: any;
}

/**
 * 基础Token钩子，提供共享状态和通用功能
 */
export function useTokenBase(): UseTokenBaseReturn {
  const { provider, signer, account } = useWeb3();
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 统一错误处理函数
  const handleError = useCallback((action: string, err: any) => {
    const errorMessage = `Failed to ${action}: ${err.message || err}`;
    console.error(errorMessage);
    setError(errorMessage);
    return null;
  }, []);

  return {
    tokenContract,
    setTokenContract,
    provider,
    signer,
    account,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    AIH_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS,
    ERC20ABI: ERC20_ABI
  };
}

export default useTokenBase; 