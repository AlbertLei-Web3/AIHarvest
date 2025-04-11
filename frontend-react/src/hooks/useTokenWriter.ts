import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useTokenBase } from './useTokenBase';

export interface UseTokenWriterReturn {
  approve: (tokenAddress: string, spenderAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  transfer: (tokenAddress: string, recipientAddress: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Token合约写入钩子
 * 专注于向代币合约发送交易
 */
export function useTokenWriter(): UseTokenWriterReturn {
  const {
    signer,
    isLoading,
    setIsLoading,
    error,
    handleError,
    ERC20ABI
  } = useTokenBase();

  // 授权代币给指定地址
  const approve = useCallback(async (
    tokenAddress: string, 
    spenderAddress: string, 
    amount: string
  ): Promise<ethers.ContractTransaction | null> => {
    setIsLoading(true);
    
    try {
      if (!signer) {
        throw new Error('Signer not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      
      if (!ethers.utils.isAddress(spenderAddress)) {
        throw new Error('Invalid spender address');
      }
      
      if (!amount || parseFloat(amount) < 0) {
        throw new Error('Invalid amount');
      }

      console.log(`🔄 Approving ${amount} tokens for spender ${spenderAddress} on token:`, tokenAddress);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
      const amountWei = ethers.utils.parseUnits(amount, decimals);
      
      const tx = await contract.approve(spenderAddress, amountWei);
      console.log('✅ Approval transaction submitted:', tx.hash);
      
      return tx;
    } catch (err: any) {
      return handleError('approving token', err);
    } finally {
      setIsLoading(false);
    }
  }, [signer, ERC20ABI, handleError, setIsLoading]);

  // 转移代币到指定地址
  const transfer = useCallback(async (
    tokenAddress: string,
    recipientAddress: string,
    amount: string
  ): Promise<ethers.ContractTransaction | null> => {
    setIsLoading(true);
    
    try {
      if (!signer) {
        throw new Error('Signer not available');
      }
      
      if (!ethers.utils.isAddress(tokenAddress)) {
        throw new Error('Invalid token address');
      }
      
      if (!ethers.utils.isAddress(recipientAddress)) {
        throw new Error('Invalid recipient address');
      }
      
      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount');
      }

      console.log(`🔄 Transferring ${amount} tokens to ${recipientAddress} from token:`, tokenAddress);
      const contract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      const decimals = await contract.decimals();
      const amountWei = ethers.utils.parseUnits(amount, decimals);
      
      // 检查余额
      const senderAddress = await signer.getAddress();
      const balance = await contract.balanceOf(senderAddress);
      if (balance.lt(amountWei)) {
        throw new Error(`Insufficient balance. You have ${ethers.utils.formatUnits(balance, decimals)}, but trying to send ${amount}`);
      }
      
      const tx = await contract.transfer(recipientAddress, amountWei);
      console.log('✅ Transfer transaction submitted:', tx.hash);
      
      return tx;
    } catch (err: any) {
      return handleError('transferring token', err);
    } finally {
      setIsLoading(false);
    }
  }, [signer, ERC20ABI, handleError, setIsLoading]);

  return {
    approve,
    transfer,
    isLoading,
    error
  };
}

export default useTokenWriter; 