import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { useFarmStore } from '../store';
import useTokenContract from './useTokenContract';
import { SWAP_ROUTER_ABI, SIMPLE_SWAP_ROUTER_ABI } from '../types';

// 环境变量
const SIMPLE_SWAP_ROUTER_ADDRESS = process.env.REACT_APP_SIMPLE_SWAP_ROUTER_ADDRESS || '0x5Dcde9e56b34e719a72CF060802D276dcb580730';

// 类型定义
export interface SwapInfo {
  lpFee: string;
  protocolFee: string;
  treasury: string;
}

export interface UseSwapContractReturn {
  swapRouterContract: ethers.Contract | null;
  simpleSwapRouterContract: ethers.Contract | null;
  loadSwapRouterContract: (routerAddress: string) => void;
  getSwapExchangeRate: (fromToken: string, toToken: string) => Promise<string>;
  getSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  getSimpleSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  swap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  simpleSwap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  addLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  addSimpleLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  setExchangeRate: (tokenA: string, tokenB: string, rate: string) => Promise<ethers.ContractTransaction | null>;
  getSwapInfo: () => Promise<SwapInfo | null>;
  getSimpleSwapInfo: () => Promise<SwapInfo | null>;
  SIMPLE_SWAP_ROUTER_ADDRESS: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * 用于Swap Router合约交互的钩子
 */
export function useSwapContract(): UseSwapContractReturn {
  const { provider, signer, isConnected } = useWeb3();
  const [swapRouterContract, setSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [simpleSwapRouterContract, setSimpleSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getTokenContract, approve } = useTokenContract();

  // 统一错误处理函数
  const handleError = useCallback((context: string, error: any) => {
    const message = error?.message || error?.reason || 'Unknown error';
    const errorMsg = `${context}: ${message}`;
    console.error(`❌ ${errorMsg}`, error);
    setError(errorMsg);
    return null;
  }, []);

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
  }, [isConnected, signer, handleError]);

  // 加载Swap Router合约
  const loadSwapRouterContract = useCallback((routerAddress: string) => {
    if (!provider) {
      console.log("⚠️ Provider not initialized");
      return;
    }
    
    console.log("🔄 Loading swap router contract from address:", routerAddress);
    
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
    }
  }, [provider, handleError]);

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
      
      const outputAmount = await simpleSwapRouterContract.getOutputAmount(
        fromToken,
        toToken,
        parsedAmount
      );
      
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

  // 执行代币兑换
  const swap = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) {
      console.log("⚠️ Swap router contract or signer not initialized");
      setError('No wallet connected or swap router not initialized');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Swapping tokens from:", fromToken, "to:", toToken, "amount:", amount);
      
      // 1. 获取代币精度和解析金额
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) {
        setError('Failed to create token contract');
        return null;
      }
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // 2. 授权代币使用
      try {
        const tx = await approve(fromToken, swapRouterContract.address, parsedAmount.toString());
        if (tx) {
          console.log("🔄 Waiting for approval transaction to be mined...");
          await tx.wait();
          console.log("✅ Approval transaction confirmed");
        } else {
          throw new Error("Approval transaction failed");
        }
      } catch (approvalError) {
        handleError("Token approval for swap", approvalError);
        setIsLoading(false);
        return null;
      }
      
      // 3. 执行代币兑换
      try {
        const swapTx = await swapRouterContract.swap(
          fromToken,
          toToken,
          parsedAmount
        );
        
        console.log("🔄 Swap transaction submitted:", swapTx.hash);
        return swapTx;
      } catch (swapError) {
        return handleError("Executing swap transaction", swapError);
      }
    } catch (err) {
      return handleError("Swap operation", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, signer, getTokenContract, approve, handleError]);

  // 使用SimpleSwap路由兑换代币
  const simpleSwap = useCallback(async (fromToken: string, toToken: string, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) {
      console.log("⚠️ SimpleSwapRouter contract or signer not initialized");
      setError('No wallet connected or SimpleSwapRouter not initialized');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Using SimpleSwap for tokens from:", fromToken, "to:", toToken, "amount:", amount);
      
      // 1. 获取代币精度和解析金额
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) {
        setError('Failed to create token contract');
        return null;
      }
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // 检查授权
      const userAddress = await signer.getAddress();
      const allowanceStr = await tokenContract.allowance(userAddress, SIMPLE_SWAP_ROUTER_ADDRESS);
      const allowance = ethers.BigNumber.from(allowanceStr);
      
      if (allowance.lt(parsedAmount)) {
        console.log("🔄 Current allowance insufficient, approving...");
        const tx = await approve(fromToken, SIMPLE_SWAP_ROUTER_ADDRESS, parsedAmount.toString());
        if (tx) {
          console.log("🔄 Waiting for approval transaction to be mined...");
          await tx.wait();
          console.log("✅ Approval transaction confirmed");
        } else {
          throw new Error("Approval transaction failed");
        }
      } else {
        console.log("✅ Sufficient allowance already exists");
      }
      
      // 执行兑换
      try {
        const swapTx = await simpleSwapRouterContract.swap(
          fromToken,
          toToken,
          parsedAmount,
          { gasLimit: 300000 }
        );
        
        console.log("🔄 SimpleSwap transaction submitted:", swapTx.hash);
        return swapTx;
      } catch (swapError) {
        return handleError("Executing SimpleSwap transaction", swapError);
      }
    } catch (err) {
      return handleError("SimpleSwap operation", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, signer, getTokenContract, approve, handleError]);

  // 添加流动性
  const addLiquidity = useCallback(async (tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) {
      console.log("⚠️ Swap router contract or signer not initialized");
      setError('No wallet connected or swap router not initialized');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Adding liquidity for tokens:", tokenA, tokenB, "amounts:", amountA, amountB);
      
      // 1. 获取代币精度和解析金额
      const tokenContractA = getTokenContract(tokenA);
      const tokenContractB = getTokenContract(tokenB);
      
      if (!tokenContractA || !tokenContractB) {
        setError('Failed to create token contract(s)');
        return null;
      }
      
      const decimalsA = await tokenContractA.decimals();
      const decimalsB = await tokenContractB.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // 2. 授权代币使用
      try {
        const txA = await approve(tokenA, swapRouterContract.address, parsedAmountA.toString());
        if (txA) {
          console.log("🔄 Waiting for token A approval transaction to be mined...");
          await txA.wait();
          console.log("✅ Token A approval transaction confirmed");
        } else {
          throw new Error("Token A approval transaction failed");
        }
        
        const txB = await approve(tokenB, swapRouterContract.address, parsedAmountB.toString());
        if (txB) {
          console.log("🔄 Waiting for token B approval transaction to be mined...");
          await txB.wait();
          console.log("✅ Token B approval transaction confirmed");
        } else {
          throw new Error("Token B approval transaction failed");
        }
      } catch (approvalError) {
        handleError("Token approval for adding liquidity", approvalError);
        setIsLoading(false);
        return null;
      }
      
      // 3. 添加流动性
      try {
        const lpTx = await swapRouterContract.addLiquidity(
          tokenA,
          tokenB,
          parsedAmountA,
          parsedAmountB,
          { gasLimit: 400000 }
        );
        
        console.log("🔄 Add liquidity transaction submitted:", lpTx.hash);
        return lpTx;
      } catch (lpError) {
        return handleError("Executing add liquidity transaction", lpError);
      }
    } catch (err) {
      return handleError("Add liquidity operation", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, signer, getTokenContract, approve, handleError]);

  // 使用SimpleSwap添加流动性
  const addSimpleLiquidity = useCallback(async (tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) {
      console.log("⚠️ SimpleSwapRouter contract or signer not initialized");
      setError('No wallet connected or SimpleSwapRouter not initialized');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Adding liquidity with SimpleSwap for tokens:", tokenA, tokenB, "amounts:", amountA, amountB);
      
      // 1. 获取代币精度和解析金额
      const tokenContractA = getTokenContract(tokenA);
      const tokenContractB = getTokenContract(tokenB);
      
      if (!tokenContractA || !tokenContractB) {
        setError('Failed to create token contract(s)');
        return null;
      }
      
      const decimalsA = await tokenContractA.decimals();
      const decimalsB = await tokenContractB.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // 2. 授权代币使用
      try {
        const txA = await approve(tokenA, SIMPLE_SWAP_ROUTER_ADDRESS, parsedAmountA.toString());
        if (txA) {
          console.log("🔄 Waiting for token A approval transaction to be mined...");
          await txA.wait();
          console.log("✅ Token A approval transaction confirmed");
        } else {
          throw new Error("Token A approval transaction failed");
        }
        
        const txB = await approve(tokenB, SIMPLE_SWAP_ROUTER_ADDRESS, parsedAmountB.toString());
        if (txB) {
          console.log("🔄 Waiting for token B approval transaction to be mined...");
          await txB.wait();
          console.log("✅ Token B approval transaction confirmed");
        } else {
          throw new Error("Token B approval transaction failed");
        }
      } catch (approvalError) {
        handleError("Token approval for adding liquidity with SimpleSwap", approvalError);
        setIsLoading(false);
        return null;
      }
      
      // 3. 添加流动性
      try {
        const lpTx = await simpleSwapRouterContract.addLiquidity(
          tokenA,
          tokenB,
          parsedAmountA,
          parsedAmountB,
          { gasLimit: 400000 }
        );
        
        console.log("🔄 Add liquidity transaction with SimpleSwap submitted:", lpTx.hash);
        return lpTx;
      } catch (lpError) {
        return handleError("Executing add liquidity transaction with SimpleSwap", lpError);
      }
    } catch (err) {
      return handleError("Add liquidity operation with SimpleSwap", err);
    } finally {
      setIsLoading(false);
    }
  }, [simpleSwapRouterContract, signer, getTokenContract, approve, handleError]);

  // 设置兑换率
  const setExchangeRate = useCallback(async (tokenA: string, tokenB: string, rate: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) {
      console.log("⚠️ Swap router contract or signer not initialized");
      setError('No wallet connected or swap router not initialized');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Setting exchange rate for tokens:", tokenA, tokenB, "rate:", rate);
      const parsedRate = ethers.utils.parseEther(rate);
      
      const tx = await swapRouterContract.setExchangeRate(
        tokenA,
        tokenB,
        parsedRate
      );
      
      console.log("🔄 Set exchange rate transaction submitted:", tx.hash);
      return tx;
    } catch (err) {
      return handleError("Setting exchange rate", err);
    } finally {
      setIsLoading(false);
    }
  }, [swapRouterContract, signer, handleError]);

  // 获取Swap信息
  const getSwapInfo = useCallback(async (): Promise<SwapInfo | null> => {
    if (!swapRouterContract) {
      console.log("⚠️ Swap router contract not initialized");
      return null;
    }
    
    try {
      console.log("🔄 Getting swap info...");
      const lpFee = await swapRouterContract.lpFee();
      const protocolFee = await swapRouterContract.protocolFee();
      const treasury = await swapRouterContract.treasury();
      
      const info: SwapInfo = {
        lpFee: ethers.utils.formatEther(lpFee),
        protocolFee: ethers.utils.formatEther(protocolFee),
        treasury
      };
      
      console.log("✅ Swap info retrieved:", info);
      return info;
    } catch (err) {
      console.error("❌ Error getting swap info:", err);
      return null;
    }
  }, [swapRouterContract]);

  // 获取SimpleSwap信息
  const getSimpleSwapInfo = useCallback(async (): Promise<SwapInfo | null> => {
    if (!simpleSwapRouterContract) {
      console.log("⚠️ SimpleSwapRouter contract not initialized");
      return null;
    }
    
    try {
      console.log("🔄 Getting SimpleSwap info...");
      const lpFee = await simpleSwapRouterContract.lpFee();
      const protocolFee = await simpleSwapRouterContract.protocolFee();
      const treasury = await simpleSwapRouterContract.treasury();
      
      const info: SwapInfo = {
        lpFee: ethers.utils.formatEther(lpFee),
        protocolFee: ethers.utils.formatEther(protocolFee),
        treasury
      };
      
      console.log("✅ SimpleSwap info retrieved:", info);
      return info;
    } catch (err) {
      console.error("❌ Error getting SimpleSwap info:", err);
      return null;
    }
  }, [simpleSwapRouterContract]);

  return {
    swapRouterContract,
    simpleSwapRouterContract,
    loadSwapRouterContract,
    getSwapExchangeRate,
    getSwapOutputAmount,
    getSimpleSwapOutputAmount,
    swap,
    simpleSwap,
    addLiquidity,
    addSimpleLiquidity,
    setExchangeRate,
    getSwapInfo,
    getSimpleSwapInfo,
    SIMPLE_SWAP_ROUTER_ADDRESS,
    isLoading,
    error
  };
}

export default useSwapContract; 