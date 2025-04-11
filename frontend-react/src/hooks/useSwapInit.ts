import { useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useSwapBase } from './useSwapBase';
import { useFarmStore } from '../store';

export interface UseSwapInitReturn {
  swapRouterContract: ethers.Contract | null;
  simpleSwapRouterContract: ethers.Contract | null;
  loadSwapRouterContract: (routerAddress: string) => void;
  isLoading: boolean;
  error: string | null;
  SIMPLE_SWAP_ROUTER_ADDRESS: string;
}

/**
 * Swap合约初始化钩子
 * 专注于加载和初始化Swap合约
 */
export function useSwapInit(): UseSwapInitReturn {
  const {
    swapRouterContract,
    setSwapRouterContract,
    simpleSwapRouterContract,
    setSimpleSwapRouterContract,
    provider,
    signer,
    isConnected,
    isLoading,
    setIsLoading,
    error,
    setError,
    handleError,
    SIMPLE_SWAP_ROUTER_ADDRESS,
    SWAP_ROUTER_ABI,
    SIMPLE_SWAP_ROUTER_ABI
  } = useSwapBase();

  // 初始化合约
  useEffect(() => {
    if (!isConnected || !signer) return;
    
    console.log("🔄 Initializing Swap contracts...");
    
    // 添加超时保护
    const timeoutId = setTimeout(() => {
      console.error("⏱️ Swap contract initialization timed out");
      setError('Swap contract initialization timed out - please reload the page');
    }, 10000); // 10秒超时
    
    const initSwapContracts = async () => {
      try {
        // SimpleSwapRouter 合约初始化
        if (SIMPLE_SWAP_ROUTER_ADDRESS && SIMPLE_SWAP_ROUTER_ADDRESS !== '') {
          try {
            console.log("🔄 Initializing SimpleSwapRouter contract at:", SIMPLE_SWAP_ROUTER_ADDRESS);
            const simpleSwapRouter = new ethers.Contract(
              SIMPLE_SWAP_ROUTER_ADDRESS,
              SIMPLE_SWAP_ROUTER_ABI,
              signer
            );
            setSimpleSwapRouterContract(simpleSwapRouter);
            console.log("✅ SimpleSwapRouter contract initialized");
            
            // 测试合约是否响应
            try {
              const treasury = await simpleSwapRouter.treasury();
              console.log("✅ SimpleSwapRouter contract responding - treasury:", treasury);
            } catch (testError) {
              console.warn("⚠️ SimpleSwapRouter initialized but not responding to calls:", testError);
            }
          } catch (routerError) {
            console.error("❌ Error initializing SimpleSwapRouter contract:", routerError);
          }
        } else {
          console.warn("⚠️ No SimpleSwapRouter address provided, skipping initialization");
        }
      } catch (error) {
        handleError("Swap contract initialization", error);
      } finally {
        clearTimeout(timeoutId);
      }
    };
    
    initSwapContracts();
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isConnected, signer, setSimpleSwapRouterContract, SIMPLE_SWAP_ROUTER_ADDRESS, SIMPLE_SWAP_ROUTER_ABI, handleError, setError]);

  // 加载Swap Router合约
  const loadSwapRouterContract = useCallback((routerAddress: string) => {
    if (!provider) {
      console.log("⚠️ Provider not initialized");
      return;
    }
    
    console.log("🔄 Loading swap router contract from address:", routerAddress);
    setIsLoading(true);
    
    try {
      const contract = new ethers.Contract(
        routerAddress,
        SWAP_ROUTER_ABI,
        provider
      );
      setSwapRouterContract(contract);
      console.log("✅ Swap router contract loaded successfully");
      
      // 存储地址到store中
      try {
        const state = useFarmStore.getState();
        if (typeof state.setSwapRouterAddress === 'function') {
          state.setSwapRouterAddress(routerAddress);
        }
      } catch (err) {
        console.warn("⚠️ Could not update swap router address in store:", err);
      }
    } catch (err) {
      handleError("Loading swap router contract", err);
    } finally {
      setIsLoading(false);
    }
  }, [provider, SWAP_ROUTER_ABI, setSwapRouterContract, setIsLoading, handleError]);

  return {
    swapRouterContract,
    simpleSwapRouterContract,
    loadSwapRouterContract,
    isLoading,
    error,
    SIMPLE_SWAP_ROUTER_ADDRESS
  };
}

export default useSwapInit; 