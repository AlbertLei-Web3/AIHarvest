import { useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useFarmBase } from './useFarmBase';
import { useFarmStore } from '../store';
import SimpleFarmABI from '../abis/SimpleFarm.json';

export interface UseFarmInitReturn {
  farmContract: ethers.Contract | null;
  loadFarmContract: (farmAddress: string) => void;
  isLoading: boolean;
  error: string | null;
  FARM_ADDRESS: string;
}

/**
 * Farm合约初始化钩子
 * 提供合约的加载和初始化功能
 */
export function useFarmInit(): UseFarmInitReturn {
  const {
    farmContract,
    signer, 
    isConnected,
    provider,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    FARM_ADDRESS
  } = useFarmBase();

  // 初始化合约
  useEffect(() => {
    if (!isConnected || !signer) return;
    
    console.log("🔄 Initializing Farm contract...");
    
    // 添加超时保护
    const timeoutId = setTimeout(() => {
      console.error("⏱️ Farm contract initialization timed out");
      setError('Farm contract initialization timed out - please reload the page');
    }, 10000); // 10秒超时
    
    const initFarmContract = async () => {
      try {
        if (FARM_ADDRESS && FARM_ADDRESS !== '') {
          console.log("🔄 Initializing Farm contract at:", FARM_ADDRESS);
          const farm = new ethers.Contract(FARM_ADDRESS, SimpleFarmABI, signer);
          
          // 测试合约是否响应
          try {
            const rewardToken = await farm.rewardToken();
            console.log("✅ Farm contract responding - reward token:", rewardToken);
          } catch (testError) {
            console.warn("⚠️ Farm contract initialized but not responding to calls:", testError);
          }
        } else {
          console.warn("⚠️ No Farm address provided, skipping Farm initialization");
        }
      } catch (error) {
        handleError("Farm contract initialization", error);
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    initFarmContract();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConnected, signer, FARM_ADDRESS, handleError, setError]);

  // 加载Farm合约
  const loadFarmContract = useCallback((farmAddress: string) => {
    if (!provider) {
      console.log("⚠️ Provider not initialized");
      return;
    }
    
    console.log("🔄 Loading farm contract from address:", farmAddress);
    setIsLoading(true);
    
    try {
      const contract = new ethers.Contract(farmAddress, SimpleFarmABI, provider);
      console.log("✅ Farm contract loaded successfully");
      
      // 存储地址到store中
      try {
        const state = useFarmStore.getState();
        if (typeof state.setSwapRouterAddress === 'function') {
          state.setSwapRouterAddress(farmAddress);
        }
      } catch (err) {
        console.warn("⚠️ Could not update farm address in store:", err);
      }
    } catch (err) {
      handleError("Loading farm contract", err);
    } finally {
      setIsLoading(false);
    }
  }, [provider, handleError, setIsLoading]);

  return {
    farmContract,
    loadFarmContract,
    isLoading,
    error,
    FARM_ADDRESS
  };
}

export default useFarmInit; 