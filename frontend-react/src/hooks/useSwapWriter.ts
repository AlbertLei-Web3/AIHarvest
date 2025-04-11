import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useSwapBase } from './useSwapBase';
import useTokenContract from './useTokenContract';

export interface UseSwapWriterReturn {
  swap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  simpleSwap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  addLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  addSimpleLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  setExchangeRate: (tokenA: string, tokenB: string, rate: string) => Promise<ethers.ContractTransaction | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Swap合约写入钩子
 * 专注于向Swap合约发送交易
 */
export function useSwapWriter(): UseSwapWriterReturn {
  const {
    swapRouterContract,
    simpleSwapRouterContract,
    signer,
    isLoading,
    setIsLoading,
    error,
    handleError
  } = useSwapBase();
  
  const { approve, getTokenBalance } = useTokenContract();

  // 标准Swap交易
  const swap = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) {
      console.log("⚠️ Swap router contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Swapping tokens from:", fromToken, "to:", toToken, "amount:", amount);
      
      // 1. 创建代币合约实例
      const tokenContract = new ethers.Contract(
        fromToken,
        ['function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)'],
        signer
      );
      
      // 2. 获取小数位数和解析金额
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // 3. 检查用户余额
      const userAddress = await signer.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);
      
      if (balance.lt(parsedAmount)) {
        console.error("❌ Insufficient balance:", ethers.utils.formatUnits(balance, decimals), "needed:", amount);
        throw new Error(`Insufficient balance. You have ${ethers.utils.formatUnits(balance, decimals)}, but trying to swap ${amount}`);
      }
      
      // 4. 授权代币使用
      const approveTx = await approve(fromToken, swapRouterContract.address, amount);
      if (approveTx) {
        console.log("🔄 Waiting for approval transaction to be mined...");
        await approveTx.wait();
        console.log("✅ Approval confirmed");
      }
      
      // 5. 执行交换
      const tx = await swapRouterContract.swap(fromToken, toToken, parsedAmount);
      console.log("✅ Swap transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Swapping tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, signer, approve, setIsLoading, handleError]);

  // 简化版Swap交易
  const simpleSwap = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) {
      console.log("⚠️ SimpleSwapRouter contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 SimpleSwapping tokens from:", fromToken, "to:", toToken, "amount:", amount);
      
      // 1. 创建代币合约实例
      const tokenContract = new ethers.Contract(
        fromToken,
        ['function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)'],
        signer
      );
      
      // 2. 获取小数位数和解析金额
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // 3. 检查用户余额
      const userAddress = await signer.getAddress();
      const balance = await tokenContract.balanceOf(userAddress);
      
      if (balance.lt(parsedAmount)) {
        console.error("❌ Insufficient balance:", ethers.utils.formatUnits(balance, decimals), "needed:", amount);
        throw new Error(`Insufficient balance. You have ${ethers.utils.formatUnits(balance, decimals)}, but trying to swap ${amount}`);
      }
      
      // 4. 授权代币使用
      const approveTx = await approve(fromToken, simpleSwapRouterContract.address, amount);
      if (approveTx) {
        console.log("🔄 Waiting for approval transaction to be mined...");
        await approveTx.wait();
        console.log("✅ Approval confirmed");
      }
      
      // 5. 执行交换
      const tx = await simpleSwapRouterContract.swap(fromToken, toToken, parsedAmount);
      console.log("✅ SimpleSwap transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("SimpleSwapping tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, signer, approve, setIsLoading, handleError]);

  // 添加流动性
  const addLiquidity = useCallback(async (
    tokenA: string, 
    tokenB: string, 
    amountA: string, 
    amountB: string
  ): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) {
      console.log("⚠️ Swap router contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Adding liquidity for pair:", tokenA, tokenB, "amounts:", amountA, amountB);
      
      // 1. 获取代币小数位数和解析金额
      const tokenAContract = new ethers.Contract(
        tokenA,
        ['function decimals() view returns (uint8)'],
        signer
      );
      const tokenBContract = new ethers.Contract(
        tokenB,
        ['function decimals() view returns (uint8)'],
        signer
      );
      
      const decimalsA = await tokenAContract.decimals();
      const decimalsB = await tokenBContract.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // 2. 授权代币使用
      const approveATx = await approve(tokenA, swapRouterContract.address, amountA);
      if (approveATx) {
        console.log("🔄 Waiting for tokenA approval transaction to be mined...");
        await approveATx.wait();
        console.log("✅ TokenA approval confirmed");
      }
      
      const approveBTx = await approve(tokenB, swapRouterContract.address, amountB);
      if (approveBTx) {
        console.log("🔄 Waiting for tokenB approval transaction to be mined...");
        await approveBTx.wait();
        console.log("✅ TokenB approval confirmed");
      }
      
      // 3. 添加流动性
      const tx = await swapRouterContract.addLiquidity(
        tokenA,
        tokenB,
        parsedAmountA,
        parsedAmountB
      );
      console.log("✅ Add liquidity transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Adding liquidity", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, signer, approve, setIsLoading, handleError]);

  // 添加简化版流动性
  const addSimpleLiquidity = useCallback(async (
    tokenA: string, 
    tokenB: string, 
    amountA: string, 
    amountB: string
  ): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) {
      console.log("⚠️ SimpleSwapRouter contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Adding simple liquidity for pair:", tokenA, tokenB, "amounts:", amountA, amountB);
      
      // 1. 获取代币小数位数和解析金额
      const tokenAContract = new ethers.Contract(
        tokenA,
        ['function decimals() view returns (uint8)'],
        signer
      );
      const tokenBContract = new ethers.Contract(
        tokenB,
        ['function decimals() view returns (uint8)'],
        signer
      );
      
      const decimalsA = await tokenAContract.decimals();
      const decimalsB = await tokenBContract.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // 2. 授权代币使用
      const approveATx = await approve(tokenA, simpleSwapRouterContract.address, amountA);
      if (approveATx) {
        console.log("🔄 Waiting for tokenA approval transaction to be mined...");
        await approveATx.wait();
        console.log("✅ TokenA approval confirmed");
      }
      
      const approveBTx = await approve(tokenB, simpleSwapRouterContract.address, amountB);
      if (approveBTx) {
        console.log("🔄 Waiting for tokenB approval transaction to be mined...");
        await approveBTx.wait();
        console.log("✅ TokenB approval confirmed");
      }
      
      // 3. 添加流动性
      const tx = await simpleSwapRouterContract.addLiquidity(
        tokenA,
        tokenB,
        parsedAmountA,
        parsedAmountB
      );
      console.log("✅ Add simple liquidity transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Adding simple liquidity", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, signer, approve, setIsLoading, handleError]);

  // 设置交换率
  const setExchangeRate = useCallback(async (
    tokenA: string, 
    tokenB: string, 
    rate: string
  ): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) {
      console.log("⚠️ SimpleSwapRouter contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Setting exchange rate for pair:", tokenA, tokenB, "rate:", rate);
      
      // 解析汇率为wei
      const parsedRate = ethers.utils.parseEther(rate);
      
      // 设置汇率
      const tx = await simpleSwapRouterContract.setExchangeRate(tokenA, tokenB, parsedRate);
      console.log("✅ Set exchange rate transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Setting exchange rate", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, signer, setIsLoading, handleError]);

  return {
    swap,
    simpleSwap,
    addLiquidity,
    addSimpleLiquidity,
    setExchangeRate,
    isLoading,
    error
  };
}

export default useSwapWriter; 