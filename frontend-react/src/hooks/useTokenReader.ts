import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useTokenBase, TokenInfo } from './useTokenBase';

export interface UseTokenReaderReturn {
  getTokenInfo: (tokenAddress: string) => Promise<TokenInfo | null>;
  getTokenSymbol: (tokenAddress: string) => Promise<string>;
  getTokenBalance: (tokenAddress: string, userAddress: string) => Promise<string>;
  getAllowance: (tokenAddress: string, ownerAddress: string, spenderAddress: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Token合约读取钩子
 * 专注于从代币合约读取数据
 */
export function useTokenReader(): UseTokenReaderReturn {
  const {
    provider,
    account,
    isLoading,
    setIsLoading,
    error,
    handleError,
    setError,
    ERC20ABI
  } = useTokenBase();

  // 获取代币信息
  const getTokenInfo = useCallback(async (tokenAddress: string): Promise<TokenInfo | null> => {
    setIsLoading(true);
    
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      console.log("🔄 Getting token info for:", tokenAddress);
      
      // 创建代币合约实例
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      
      // 获取代币基本信息
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      
      // 如果有账户，获取余额
      let balance = ethers.BigNumber.from(0);
      if (account) {
        balance = await contract.balanceOf(account);
      }

      const tokenInfo: TokenInfo = {
        name,
        symbol,
        decimals,
        totalSupply: ethers.utils.formatUnits(totalSupply, decimals),
        balance: ethers.utils.formatUnits(balance, decimals)
      };

      console.log('✅ Token info for', tokenAddress, ':', tokenInfo);
      return tokenInfo;
    } catch (err: any) {
      return handleError('getting token info', err);
    } finally {
      setIsLoading(false);
    }
  }, [provider, account, ERC20ABI, handleError, setIsLoading]);

  // 获取代币符号
  const getTokenSymbol = useCallback(async (tokenAddress: string): Promise<string> => {
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }

      console.log("🔄 Getting token symbol for:", tokenAddress);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const symbol = await contract.symbol();
      console.log(`✅ Token symbol: ${symbol}`);
      return symbol;
    } catch (err: any) {
      console.error('❌ Error getting token symbol:', err);
      return 'UNKNOWN';
    }
  }, [provider, ERC20ABI]);

  // 获取代币余额
  const getTokenBalance = useCallback(async (tokenAddress: string, userAddress: string): Promise<string> => {
    setIsLoading(true);
    
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      
      if (!ethers.utils.isAddress(userAddress)) {
        throw new Error('Invalid user address');
      }

      console.log(`🔄 Getting balance of ${userAddress} for token:`, tokenAddress);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const formattedBalance = ethers.utils.formatUnits(balance, decimals);
      
      console.log(`✅ Balance: ${formattedBalance}`);
      return formattedBalance;
    } catch (err: any) {
      console.error('❌ Error getting token balance:', err);
      setError(`Failed to get token balance: ${err.message}`);
      return '0';
    } finally {
      setIsLoading(false);
    }
  }, [provider, ERC20ABI, setError, setIsLoading]);

  // 获取授权额度
  const getAllowance = useCallback(async (
    tokenAddress: string, 
    ownerAddress: string, 
    spenderAddress: string
  ): Promise<string> => {
    setIsLoading(true);
    
    try {
      if (!provider) {
        throw new Error('Provider not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      
      if (!ethers.utils.isAddress(ownerAddress)) {
        throw new Error('Invalid owner address');
      }
      
      if (!ethers.utils.isAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }

      console.log(`🔄 Getting allowance of ${ownerAddress} for spender ${spenderAddress} on token:`, tokenAddress);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, provider);
      const decimals = await contract.decimals();
      const allowance = await contract.allowance(ownerAddress, spenderAddress);
      const formattedAllowance = ethers.utils.formatUnits(allowance, decimals);
      
      console.log(`✅ Allowance: ${formattedAllowance}`);
      return formattedAllowance;
    } catch (err: any) {
      console.error('❌ Error getting allowance:', err);
      setError(`Failed to get allowance: ${err.message}`);
      return '0';
    } finally {
      setIsLoading(false);
    }
  }, [provider, ERC20ABI, setError, setIsLoading]);

  return {
    getTokenInfo,
    getTokenSymbol,
    getTokenBalance,
    getAllowance,
    isLoading,
    error
  };
}

export default useTokenReader; 