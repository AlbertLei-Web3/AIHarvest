import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { SWAP_ROUTER_ABI, SIMPLE_SWAP_ROUTER_ABI } from '../types';

// 环境变量
const SIMPLE_SWAP_ROUTER_ADDRESS = process.env.REACT_APP_SIMPLE_SWAP_ROUTER_ADDRESS || '0x5Dcde9e56b34e719a72CF060802D276dcb580730';

// 类型定义
export interface SwapInfo {
  lpFee: string;
  protocolFee: string;
  treasury: string;
}

export interface UseSwapBaseReturn {
  swapRouterContract: ethers.Contract | null;
  setSwapRouterContract: (contract: ethers.Contract | null) => void;
  simpleSwapRouterContract: ethers.Contract | null;
  setSimpleSwapRouterContract: (contract: ethers.Contract | null) => void;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  isConnected: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (context: string, error: any) => null;
  SIMPLE_SWAP_ROUTER_ADDRESS: string;
  SWAP_ROUTER_ABI: any;
  SIMPLE_SWAP_ROUTER_ABI: any;
}

/**
 * 基础Swap钩子，提供共享状态和通用功能
 */
export function useSwapBase(): UseSwapBaseReturn {
  const { provider, signer, account, isConnected } = useWeb3();
  const [swapRouterContract, setSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [simpleSwapRouterContract, setSimpleSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 统一错误处理函数
  const handleError = useCallback((context: string, error: any) => {
    const message = error?.message || error?.reason || 'Unknown error';
    const errorMsg = `${context}: ${message}`;
    console.error(`❌ ${errorMsg}`, error);
    setError(errorMsg);
    return null;
  }, []);

  return {
    swapRouterContract,
    setSwapRouterContract,
    simpleSwapRouterContract,
    setSimpleSwapRouterContract,
    provider,
    signer,
    account,
    isConnected,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    SIMPLE_SWAP_ROUTER_ADDRESS,
    SWAP_ROUTER_ABI,
    SIMPLE_SWAP_ROUTER_ABI
  };
}

export default useSwapBase; 