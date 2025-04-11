import { useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useTokenBase } from './useTokenBase';

export interface UseTokenInitReturn {
  tokenContract: ethers.Contract | null;
  loadTokenContract: (tokenAddress: string) => void;
  isLoading: boolean;
  error: string | null;
  AIH_TOKEN_ADDRESS: string;
}

/**
 * Token合约初始化钩子
 * 专注于加载和初始化代币合约
 */
export function useTokenInit(): UseTokenInitReturn {
  const {
    tokenContract,
    setTokenContract,
    provider,
    signer,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    AIH_TOKEN_ADDRESS,
    ERC20ABI
  } = useTokenBase();

  // 加载代币合约
  const loadTokenContract = useCallback((tokenAddress: string) => {
    try {
      if (!provider) {
        console.warn("⚠️ Provider not initialized");
        return;
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      console.log("🔄 Loading token contract:", tokenAddress);
      setIsLoading(true);
      
      const contractWithProvider = new ethers.Contract(
        tokenAddress,
        ERC20ABI,
        provider
      );

      // 如果有signer，创建一个带signer的合约实例，允许写操作
      const contract = signer 
        ? contractWithProvider.connect(signer)
        : contractWithProvider;

      setTokenContract(contract);
      console.log('✅ Token contract loaded:', tokenAddress);
      setError(null);
    } catch (err: any) {
      handleError('loading token contract', err);
      setTokenContract(null);
    } finally {
      setIsLoading(false);
    }
  }, [provider, signer, ERC20ABI, setTokenContract, setIsLoading, setError, handleError]);

  // 在provider或signer变化时加载默认代币合约
  useEffect(() => {
    if (provider && AIH_TOKEN_ADDRESS) {
      loadTokenContract(AIH_TOKEN_ADDRESS);
    }
  }, [provider, signer, AIH_TOKEN_ADDRESS, loadTokenContract]);

  return {
    tokenContract,
    loadTokenContract,
    isLoading,
    error,
    AIH_TOKEN_ADDRESS
  };
}

export default useTokenInit; 