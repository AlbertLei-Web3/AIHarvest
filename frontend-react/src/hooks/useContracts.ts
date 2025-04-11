import { useCallback } from 'react';
import { ethers } from 'ethers';
import useTokenContract from './useTokenContract';
import useSwapContract from './useSwapContract';
import useFarmContract from './useFarmContract';
import useWeb3 from './useWeb3';

export interface UseContractsReturn {
  // 钱包状态
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  
  // Farm合约相关
  farmContract: ethers.Contract | null;
  factoryContract: ethers.Contract | null; // 兼容旧代码
  loadFarmContract: (farmAddress: string) => void;
  getPools: () => Promise<any[]>;
  getUserInfo: (pid: number, userAddress: string) => Promise<any | null>;
  deposit: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  harvest: () => Promise<ethers.ContractTransaction | null>;
  compound: (pid: number) => Promise<ethers.ContractTransaction | null>; // 添加pid参数

  // Token相关
  getTokenInfo: (tokenAddress: string) => Promise<any | null>;
  getTokenBalance: (tokenAddress: string, accountAddress: string) => Promise<ethers.BigNumber>;
  getAllowance: (tokenAddress: string, ownerAddress: string, spenderAddress: string) => Promise<string>;
  approve: (tokenAddress: string, spenderAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  transfer: (tokenAddress: string, recipientAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  getTokenContract: (tokenAddress: string) => ethers.Contract | null;

  // Swap合约相关
  swapRouterContract: ethers.Contract | null;
  simpleSwapRouterContract: ethers.Contract | null; // 添加简易交换路由合约
  loadSwapRouterContract: (routerAddress: string) => void;
  getSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  getSimpleSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>; // 添加简易交换输出金额方法 
  swap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  simpleSwap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>; // 添加简易交换方法
  getSwapInfo: () => Promise<any | null>;
  getSimpleSwapInfo: () => Promise<any | null>; // 添加获取简易交换信息方法
  
  // 常量地址
  FARM_ADDRESS: string;
  AIH_TOKEN_ADDRESS: string;
  USDC_TOKEN_ADDRESS: string;
  SIMPLE_SWAP_ROUTER_ADDRESS: string;

  // 状态
  isLoading: boolean;
  error: string | null;
}

/**
 * 聚合所有合约交互的钩子
 * 提供统一访问接口
 */
const useContracts = (): UseContractsReturn => {
  const tokenHook = useTokenContract();
  const swapHook = useSwapContract();
  const farmHook = useFarmContract();
  const web3Hook = useWeb3();
  
  // 实现包含pid参数的compound方法
  const compound = useCallback(async (pid: number): Promise<ethers.ContractTransaction | null> => {
    console.log(`Compound called for pool ${pid}, using harvest method`);
    return farmHook.harvest();
  }, [farmHook]);

  // 实现兼容旧方法的getUserInfo
  const getUserInfo = useCallback(async (pid: number, userAddress: string): Promise<any | null> => {
    console.log(`Getting user info for pool ${pid} and user ${userAddress}`);
    return farmHook.getUserInfo_legacy(pid, userAddress);
  }, [farmHook]);

  // 实现兼容旧方法的deposit
  const deposit = useCallback(async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    console.log(`Depositing to pool ${pid} amount ${amount}`);
    return farmHook.deposit_legacy(pid, amount);
  }, [farmHook]);

  // 实现兼容旧方法的withdraw
  const withdraw = useCallback(async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    console.log(`Withdrawing from pool ${pid} amount ${amount}`);
    return farmHook.withdraw_legacy(pid, amount);
  }, [farmHook]);

  // 合并错误状态
  const error = tokenHook.error || swapHook.error || farmHook.error || web3Hook.error;
  
  // 合并加载状态
  const isLoading = tokenHook.isLoading || swapHook.isLoading || farmHook.isLoading;

  // 获取钱包状态
  const { account, isConnected } = web3Hook;
  const chainId = web3Hook.chainId; // 从useWeb3获取
  
  return {
    // 钱包状态
    account,
    isConnected,
    chainId,
    
    // Farm相关
    farmContract: farmHook.farmContract,
    factoryContract: farmHook.farmContract, // 为了兼容性，将farmContract赋值给factoryContract
    loadFarmContract: farmHook.loadFarmContract,
    getPools: farmHook.getPools,
    getUserInfo,
    deposit,
    withdraw,
    harvest: farmHook.harvest,
    compound,
    
    // Token相关
    getTokenInfo: tokenHook.getTokenInfo,
    getTokenBalance: tokenHook.getTokenBalance,
    
    // Swap相关
    swapRouterContract: swapHook.swapRouterContract,
    simpleSwapRouterContract: swapHook.simpleSwapRouterContract,
    loadSwapRouterContract: swapHook.loadSwapRouterContract,
    getSwapOutputAmount: swapHook.getSwapOutputAmount,
    getSimpleSwapOutputAmount: swapHook.getSimpleSwapOutputAmount,
    swap: swapHook.swap,
    simpleSwap: swapHook.simpleSwap,
    getSwapInfo: swapHook.getSwapInfo,
    getSimpleSwapInfo: swapHook.getSimpleSwapInfo,
    
    // 通用方法
    getAllowance: tokenHook.getAllowance,
    approve: tokenHook.approve,
    transfer: tokenHook.transfer,
    getTokenContract: tokenHook.getTokenContract,
    
    // 常量地址
    FARM_ADDRESS: farmHook.FARM_ADDRESS,
    AIH_TOKEN_ADDRESS: tokenHook.AIH_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS: tokenHook.USDC_TOKEN_ADDRESS,
    SIMPLE_SWAP_ROUTER_ADDRESS: swapHook.SIMPLE_SWAP_ROUTER_ADDRESS,
    
    // 状态
    isLoading,
    error
  };
};

export default useContracts; 