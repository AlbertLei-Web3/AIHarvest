import { useCallback } from 'react';
import { ethers } from 'ethers';
import { useFarmBase, FarmData, PoolInfo, UserInfo } from './useFarmBase';
import useTokenContract from './useTokenContract';

export interface UseFarmReaderReturn {
  getFarmData: () => Promise<FarmData | null>;
  getPools: () => Promise<PoolInfo[]>;
  getUserInfo: (userAddress: string) => Promise<UserInfo | null>;
  getRewardToken: () => Promise<string | null>;
  getPendingReward: (userAddress: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Farm合约读取钩子
 * 提供所有只读操作的功能
 */
export function useFarmReader(): UseFarmReaderReturn {
  const {
    farmContract,
    provider,
    isLoading,
    setIsLoading,
    error,
    handleError,
  } = useFarmBase();
  
  const { AIH_TOKEN_ADDRESS } = useTokenContract();

  // 获取Farm数据
  const getFarmData = useCallback(async (): Promise<FarmData | null> => {
    if (!farmContract) {
      console.log("⚠️ Farm contract not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    console.log("🔄 Getting farm data from SimpleFarm contract");
    
    try {
      // 获取Farm基本信息
      const owner = await farmContract.owner();
      const stakingToken = await farmContract.stakingToken();
      const rewardToken = await farmContract.rewardToken();
      const rewardRate = await farmContract.rewardRate();
      const totalStaked = await farmContract.totalStaked();
      const lockDuration = await farmContract.lockDuration();

      const farmData: FarmData = {
        owner,
        stakingToken,
        rewardToken,
        rewardRate: ethers.utils.formatEther(rewardRate),
        totalStaked: ethers.utils.formatEther(totalStaked),
        lockDuration: lockDuration.toNumber()
      };

      console.log('Farm data:', farmData);
      return farmData;
    } catch (err: any) {
      return handleError("Getting farm data", err);
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, handleError, setIsLoading]);

  // 获取池子信息
  const getPools = useCallback(async (): Promise<PoolInfo[]> => {
    if (!farmContract) {
      console.log("⚠️ Farm contract not initialized");
      return [];
    }
    
    setIsLoading(true);
    
    console.log("🔄 Getting pool info from SimpleFarm contract");
    
    try {
      // 由于SimpleFarm只有一个池子，我们直接构建池子信息
      const stakingToken = await farmContract.stakingToken();
      const totalStaked = await farmContract.totalStaked();
      const rewardRate = await farmContract.rewardRate();
      const lockDuration = await farmContract.lockDuration();
      
      // 在SimpleFarm中这些值可能不直接提供，使用默认值
      const lastRewardBlock = await provider?.getBlockNumber() || 0;
      const accRewardPerShare = ethers.BigNumber.from(0);

      const poolInfo: PoolInfo = {
        stakingToken,
        totalStaked: ethers.utils.formatEther(totalStaked),
        rewardPerBlock: ethers.utils.formatEther(rewardRate),
        lastRewardBlock: lastRewardBlock,
        accRewardPerShare: accRewardPerShare.toString(),
        lockDuration: lockDuration.toNumber()
      };

      console.log('Pool info:', poolInfo);
      return [poolInfo];
    } catch (err: any) {
      handleError("Getting pools", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, provider, handleError, setIsLoading]);

  // 获取用户信息
  const getUserInfo = useCallback(async (userAddress: string): Promise<UserInfo | null> => {
    if (!farmContract) {
      console.log("⚠️ Farm contract not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    console.log("🔄 Getting user info for address:", userAddress);
    
    try {
      // 获取用户信息
      const userInfo = await farmContract.userInfo(userAddress);
      const pendingReward = await farmContract.pendingReward(userAddress);
      
      const result: UserInfo = {
        amount: ethers.utils.formatEther(userInfo.amount || 0),
        rewardDebt: ethers.utils.formatEther(userInfo.rewardDebt || 0),
        pendingRewards: ethers.utils.formatEther(pendingReward || 0),
        unlockTime: userInfo.unlockTime ? userInfo.unlockTime.toNumber() : 0
      };

      console.log('User info for', userAddress, ':', result);
      return result;
    } catch (err: any) {
      return handleError("Getting user info", err);
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, handleError, setIsLoading]);

  // 获取奖励代币地址
  const getRewardToken = useCallback(async (): Promise<string | null> => {
    if (!farmContract) {
      console.log("⚠️ Farm contract not initialized");
      return null;
    }
    
    setIsLoading(true);
    
    try {
      console.log("🔄 Getting reward token address");
      
      try {
        const token = await farmContract.rewardToken();
        console.log("✅ Reward token address:", token);
        return token;
      } catch (err) {
        console.error("❌ Error getting reward token:", err);
        console.log("⚠️ Using default AIH token");
        return AIH_TOKEN_ADDRESS;
      }
    } catch (err: any) {
      handleError("Getting reward token", err);
      return AIH_TOKEN_ADDRESS; // 返回默认值以避免UI崩溃
    } finally {
      setIsLoading(false);
    }
  }, [farmContract, AIH_TOKEN_ADDRESS, handleError, setIsLoading]);

  // 获取待领取奖励
  const getPendingReward = useCallback(async (userAddress: string): Promise<string> => {
    if (!farmContract) {
      console.log("⚠️ Farm contract not initialized");
      return "0";
    }
    
    try {
      // SimpleFarm.pendingReward只接受一个参数(user address)
      console.log("🔄 Getting pending reward for:", userAddress);
      const pendingReward = await farmContract.pendingReward(userAddress);
      console.log("✅ Pending reward:", ethers.utils.formatEther(pendingReward));
      return ethers.utils.formatEther(pendingReward);
    } catch (err) {
      console.error("❌ Error getting pending reward:", err);
      return "0";
    }
  }, [farmContract]);

  return {
    getFarmData,
    getPools,
    getUserInfo,
    getRewardToken,
    getPendingReward,
    isLoading,
    error
  };
}

export default useFarmReader; 