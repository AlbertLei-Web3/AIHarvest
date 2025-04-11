import { ethers } from 'ethers';
import { useCallback } from 'react';
import { useTokenBase, TokenInfo } from './useTokenBase';
import { useTokenInit } from './useTokenInit';
import { useTokenReader } from './useTokenReader';
import { useTokenWriter } from './useTokenWriter';

export type { TokenInfo };

export interface UseTokenContractReturn {
  tokenContract: ethers.Contract | null;
  loadTokenContract: (tokenAddress: string) => void;
  getTokenInfo: (tokenAddress: string) => Promise<TokenInfo | null>;
  getTokenSymbol: (tokenAddress: string) => Promise<string>;
  getTokenBalance: (tokenAddress: string, userAddress: string) => Promise<ethers.BigNumber>;
  approve: (tokenAddress: string, spenderAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  transfer: (tokenAddress: string, recipientAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  getAllowance: (tokenAddress: string, ownerAddress: string, spenderAddress: string) => Promise<string>;
  getTokenContract: (tokenAddress: string) => ethers.Contract | null;
  isLoading: boolean;
  error: string | null;
  AIH_TOKEN_ADDRESS: string;
  USDC_TOKEN_ADDRESS: string;
}

/**
 * 综合Token合约交互钩子
 * 组合了初始化、读取和写入功能
 */
const useTokenContract = (): UseTokenContractReturn => {
  // 获取所有子钩子的功能
  const base = useTokenBase();
  const initHook = useTokenInit();
  const readerHook = useTokenReader();
  const writerHook = useTokenWriter();
  
  // 合并错误状态
  const error = base.error || initHook.error || readerHook.error || writerHook.error;
  
  // 合并加载状态
  const isLoading = initHook.isLoading || readerHook.isLoading || writerHook.isLoading;

  // 获取代币合约实例
  const getTokenContract = useCallback((tokenAddress: string): ethers.Contract | null => {
    if (!base.provider || !ethers.utils.isAddress(tokenAddress)) {
      return null;
    }
    
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        base.ERC20ABI,
        base.signer || base.provider
      );
      return contract;
    } catch (err) {
      console.error("❌ Error creating token contract instance:", err);
      return null;
    }
  }, [base.provider, base.signer, base.ERC20ABI]);

  // 转换getTokenBalance方法返回类型
  const getTokenBalance = useCallback(async (
    tokenAddress: string,
    userAddress: string
  ): Promise<ethers.BigNumber> => {
    try {
      const balanceStr = await readerHook.getTokenBalance(tokenAddress, userAddress);
      const tokenContract = getTokenContract(tokenAddress);
      
      if (!tokenContract) {
        return ethers.BigNumber.from(0);
      }
      
      // 获取代币精度
      const decimals = await tokenContract.decimals();
      
      // 将字符串余额转换为BigNumber
      return ethers.utils.parseUnits(balanceStr, decimals);
    } catch (err) {
      console.error("Error converting balance to BigNumber:", err);
      return ethers.BigNumber.from(0);
    }
  }, [readerHook.getTokenBalance, getTokenContract]);

  return {
    // 合约实例
    tokenContract: initHook.tokenContract,
    
    // 初始化功能
    loadTokenContract: initHook.loadTokenContract,
    
    // 读取功能
    getTokenInfo: readerHook.getTokenInfo,
    getTokenSymbol: readerHook.getTokenSymbol,
    getTokenBalance,
    getAllowance: readerHook.getAllowance,
    
    // 写入功能
    approve: writerHook.approve,
    transfer: writerHook.transfer,
    
    // 获取代币合约实例
    getTokenContract,
    
    // 状态
    isLoading,
    error,
    AIH_TOKEN_ADDRESS: base.AIH_TOKEN_ADDRESS,
    USDC_TOKEN_ADDRESS: base.USDC_TOKEN_ADDRESS
  };
};

export default useTokenContract; 