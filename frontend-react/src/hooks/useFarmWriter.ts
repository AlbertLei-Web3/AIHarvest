import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useFarmBase } from './useFarmBase';
import useTokenContract from './useTokenContract';

export interface UseFarmWriterReturn {
  deposit: (amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw: (amount: string) => Promise<ethers.ContractTransaction | null>;
  harvest: () => Promise<ethers.ContractTransaction | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Farm合约写入钩子
 * 提供所有写入操作和交易的功能
 */
export function useFarmWriter(): UseFarmWriterReturn {
  const {
    farmContract,
    signer,
    isLoading,
    setIsLoading,
    error,
    handleError
  } = useFarmBase();

  const { loadTokenContract, approve } = useTokenContract();

  // 质押代币
  const deposit = useCallback(async (amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) {
      console.log("⚠️ Farm contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    console.log("🔄 Depositing tokens:", amount);
    
    try {
      // 1. 解析金额
      let parsedAmount;
      try {
        parsedAmount = ethers.utils.parseEther(amount);
        console.log("✅ Parsed amount:", parsedAmount.toString());
      } catch (parseErr) {
        console.error("❌ Error parsing amount:", parseErr);
        return null;
      }
      
      // 2. 获取质押代币地址
      let stakingTokenAddress;
      try {
        stakingTokenAddress = await farmContract.stakingToken();
        console.log("✅ Staking token address:", stakingTokenAddress);
      } catch (err) {
        console.error("❌ Error getting staking token:", err);
        return null;
      }
      
      // 3. 检查用户余额
      const userAddress = await signer.getAddress();
      
      // 加载代币合约
      loadTokenContract(stakingTokenAddress);
      
      try {
        // 使用ethers直接创建合约实例来检查余额
        const tokenContract = new ethers.Contract(
          stakingTokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          signer
        );
        
        const balance = await tokenContract.balanceOf(userAddress);
        if (balance.lt(parsedAmount)) {
          console.error("❌ Insufficient balance:", ethers.utils.formatEther(balance), "needed:", amount);
          return null;
        }
        console.log("✅ User has sufficient balance");
      } catch (err) {
        console.error("❌ Error checking balance:", err);
        return null;
      }
      
      // 4. 授权代币使用
      try {
        const tx = await approve(stakingTokenAddress, farmContract.address, amount);
        if (tx) {
          console.log("🔄 Waiting for approval transaction to be mined...");
          await tx.wait();
          console.log("✅ Approval confirmed");
        }
      } catch (err) {
        console.error("❌ Error approving tokens:", err);
        return null;
      }
      
      // 5. 质押代币 - SimpleFarm.deposit只接受一个参数(amount)
      console.log("🔄 Depositing tokens...");
      const tx = await farmContract.connect(signer).deposit(parsedAmount);
      console.log("✅ Deposit transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Depositing tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, signer, approve, loadTokenContract, handleError, setIsLoading]);

  // 提取代币
  const withdraw = useCallback(async (amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) {
      console.log("⚠️ Farm contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    console.log("🔄 Withdrawing tokens:", amount);
    
    try {
      // 1. 解析金额
      let parsedAmount;
      try {
        parsedAmount = ethers.utils.parseEther(amount);
        console.log("✅ Parsed amount:", parsedAmount.toString());
      } catch (parseErr) {
        console.error("❌ Error parsing amount:", parseErr);
        return null;
      }
      
      // 2. 获取用户信息以检查质押量和锁定状态
      const userAddress = await signer.getAddress();
      
      try {
        const userInfoResult = await farmContract.userInfo(userAddress);
        const stakedAmount = userInfoResult.amount;
        const unlockTime = Number(userInfoResult.unlockTime);
        const currentTime = Math.floor(Date.now() / 1000);
        
        // 检查是否有足够的质押量
        if (stakedAmount.lt(parsedAmount)) {
          console.error("❌ Insufficient staked amount:", ethers.utils.formatEther(stakedAmount));
          return null;
        }
        
        // 检查是否已解锁
        if (unlockTime > currentTime) {
          const remainingTime = unlockTime - currentTime;
          const remainingHours = Math.ceil(remainingTime / 3600);
          console.error("❌ Tokens still locked:", remainingHours, "hours remaining");
          return null;
        }
        
        console.log("✅ Tokens unlocked and sufficient");
      } catch (err) {
        console.error("❌ Error checking user info:", err);
        return null;
      }
      
      // 3. 提取代币 - SimpleFarm.withdraw只接受一个参数(amount)
      console.log("🔄 Withdrawing tokens...");
      const tx = await farmContract.connect(signer).withdraw(parsedAmount);
      console.log("✅ Withdraw transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Withdrawing tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, signer, handleError, setIsLoading]);

  // 收获奖励
  const harvest = useCallback(async (): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) {
      console.log("⚠️ Farm contract or signer not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // SimpleFarm没有直接的harvest函数，但可以通过deposit(0)实现相同效果
      console.log("🔄 Harvesting rewards...");
      const tx = await farmContract.connect(signer).deposit(0);
      console.log("✅ Harvest transaction sent:", tx.hash);
      return tx;
    } catch (err: any) {
      return handleError("Harvesting rewards", err);
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, signer, handleError, setIsLoading]);

  return {
    deposit,
    withdraw,
    harvest,
    isLoading,
    error
  };
}

export default useFarmWriter; 