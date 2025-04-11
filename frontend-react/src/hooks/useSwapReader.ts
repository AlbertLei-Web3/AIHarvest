import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useSwapBase, SwapInfo } from './useSwapBase';
import useTokenContract from './useTokenContract';

export interface UseSwapReaderReturn {
  getSwapExchangeRate: (fromToken: string, toToken: string) => Promise<string>;
  getSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  getSimpleSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  getSwapInfo: () => Promise<SwapInfo | null>;
  getSimpleSwapInfo: () => Promise<SwapInfo | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Swap合约读取钩子
 * 专注于从Swap合约读取数据
 */
export function useSwapReader(): UseSwapReaderReturn {
  const {
    swapRouterContract,
    simpleSwapRouterContract,
    isLoading,
    setIsLoading,
    error,
    handleError
  } = useSwapBase();
  
  const { getTokenContract } = useTokenContract();

  // 获取兑换率
  const getSwapExchangeRate = useCallback(async (fromToken: string, toToken: string): Promise<string> => {
    if (!swapRouterContract) {
      console.log("⚠️ Swap router contract not initialized");
      return '0';
    }
    
    try {
      console.log("🔄 Getting exchange rate from:", fromToken, "to:", toToken);
      const rate = await swapRouterContract.exchangeRates(fromToken, toToken);
      console.log("✅ Exchange rate:", ethers.utils.formatEther(rate));
      return ethers.utils.formatEther(rate);
    } catch (err) {
      console.error("❌ Error getting exchange rate:", err);
      return '0';
    }
  }, [swapRouterContract]);

  // 获取输出金额
  const getSwapOutputAmount = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<string> => {
    if (!swapRouterContract) {
      console.log("⚠️ Swap router contract not initialized");
      return '0';
    }
    
    try {
      console.log("🔄 Calculating output amount for swap from:", fromToken, "to:", toToken, "amount:", amount);
      
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) return '0';
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      const outputAmount = await swapRouterContract.getOutputAmount(fromToken, toToken, parsedAmount);
      
      const outputTokenContract = getTokenContract(toToken);
      if (!outputTokenContract) return '0';
      
      const outputDecimals = await outputTokenContract.decimals();
      const formattedOutput = ethers.utils.formatUnits(outputAmount, outputDecimals);
      
      console.log("✅ Output amount:", formattedOutput);
      return formattedOutput;
    } catch (err) {
      console.error("❌ Error calculating output amount:", err);
      return '0';
    }
  }, [swapRouterContract, getTokenContract]);

  // 获取SimpleSwap输出金额
  const getSimpleSwapOutputAmount = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<string> => {
    if (!simpleSwapRouterContract) {
      console.log("⚠️ SimpleSwapRouter contract not initialized");
      return '0';
    }
    
    try {
      console.log("🔄 Calculating SimpleSwap output amount from:", fromToken, "to:", toToken, "amount:", amount);
      
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) return '0';
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // 对于SimpleSwapRouter，使用getAmountOut方法
      const outputAmount = await simpleSwapRouterContract.getAmountOut(fromToken, toToken, parsedAmount);
      
      const outputTokenContract = getTokenContract(toToken);
      if (!outputTokenContract) return '0';
      
      const outputDecimals = await outputTokenContract.decimals();
      const formattedOutput = ethers.utils.formatUnits(outputAmount, outputDecimals);
      
      console.log("✅ SimpleSwap output amount:", formattedOutput);
      return formattedOutput;
    } catch (err) {
      console.error("❌ Error calculating SimpleSwap output amount:", err);
      return '0';
    }
  }, [simpleSwapRouterContract, getTokenContract]);

  // 获取Swap合约信息
  const getSwapInfo = useCallback(async (): Promise<SwapInfo | null> => {
    if (!swapRouterContract) {
      console.log("⚠️ Swap router contract not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Getting swap router info");
      
      const lpFee = await swapRouterContract.lpFee();
      const protocolFee = await swapRouterContract.protocolFee();
      const treasury = await swapRouterContract.treasury();
      
      const info: SwapInfo = {
        lpFee: ethers.utils.formatEther(lpFee),
        protocolFee: ethers.utils.formatEther(protocolFee),
        treasury
      };
      
      console.log("✅ Swap router info:", info);
      return info;
    } catch (err: any) {
      return handleError("Getting swap info", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, setIsLoading, handleError]);

  // 获取SimpleSwap合约信息
  const getSimpleSwapInfo = useCallback(async (): Promise<SwapInfo | null> => {
    if (!simpleSwapRouterContract) {
      console.log("⚠️ SimpleSwapRouter contract not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Getting SimpleSwapRouter info");
      
      const lpFee = await simpleSwapRouterContract.feePercentage();
      const protocolFee = ethers.BigNumber.from(0); // 简化版没有协议费
      const treasury = await simpleSwapRouterContract.treasury();
      
      const info: SwapInfo = {
        lpFee: ethers.utils.formatEther(lpFee),
        protocolFee: ethers.utils.formatEther(protocolFee),
        treasury
      };
      
      console.log("✅ SimpleSwapRouter info:", info);
      return info;
    } catch (err: any) {
      return handleError("Getting SimpleSwap info", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, setIsLoading, handleError]);

  return {
    getSwapExchangeRate,
    getSwapOutputAmount,
    getSimpleSwapOutputAmount,
    getSwapInfo,
    getSimpleSwapInfo,
    isLoading,
    error
  };
}

export default useSwapReader; 