import { useEffect } from 'react';
import { ethers } from 'ethers';
import { useFarmBase, UserInfo, PoolInfo, FarmData } from './useFarmBase';
import { useFarmInit } from './useFarmInit';
import { useFarmReader } from './useFarmReader';
import { useFarmWriter } from './useFarmWriter';

export type { UserInfo, PoolInfo, FarmData };

export interface UseFarmContractReturn {
  // 合约实例
  farmContract: ethers.Contract | null;
  
  // 初始化相关
  loadFarmContract: (farmAddress: string) => void;
  
  // 读取操作
  getFarmData: () => Promise<FarmData | null>;
  getPools: () => Promise<PoolInfo[]>;
  getUserInfo: (userAddress: string) => Promise<UserInfo | null>;
  getUserInfo_legacy: (pid: number, userAddress: string) => Promise<UserInfo | null>;
  getRewardToken: () => Promise<string | null>;
  getPendingReward: (userAddress: string) => Promise<string>;
  
  // 写入操作
  deposit: (amount: string) => Promise<ethers.ContractTransaction | null>;
  deposit_legacy: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw: (amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw_legacy: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  harvest: () => Promise<ethers.ContractTransaction | null>;
  
  // 状态
  isLoading: boolean;
  error: string | null;
  FARM_ADDRESS: string;
}

/**
 * 综合性Farm合约交互钩子
 * 组合了初始化、读取和写入功能
 */
export function useFarmContract(): UseFarmContractReturn {
  // 获取所有子钩子的功能
  const base = useFarmBase();
  const initHook = useFarmInit();
  const readerHook = useFarmReader();
  const writerHook = useFarmWriter();

  // 合并错误状态
  const error = base.error || initHook.error || readerHook.error || writerHook.error;
  
  // 合并加载状态
  const isLoading = initHook.isLoading || readerHook.isLoading || writerHook.isLoading;

  // 兼容旧接口的方法
  const getUserInfo_legacy = async (pid: number, userAddress: string): Promise<UserInfo | null> => {
    console.log(`Legacy getUserInfo called with pid ${pid}, but using simplified contract without pid`);
    return readerHook.getUserInfo(userAddress);
  };

  const deposit_legacy = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    console.log(`Legacy deposit called with pid ${pid}, but using simplified contract without pid`);
    return writerHook.deposit(amount);
  };

  const withdraw_legacy = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    console.log(`Legacy withdraw called with pid ${pid}, but using simplified contract without pid`);
    return writerHook.withdraw(amount);
  };

  return {
    // 合约实例
    farmContract: base.farmContract,
    
    // 初始化相关
    loadFarmContract: initHook.loadFarmContract,
    
    // 读取操作
    getFarmData: readerHook.getFarmData,
    getPools: readerHook.getPools,
    getUserInfo: readerHook.getUserInfo,
    getUserInfo_legacy,
    getRewardToken: readerHook.getRewardToken,
    getPendingReward: readerHook.getPendingReward,
    
    // 写入操作
    deposit: writerHook.deposit,
    deposit_legacy,
    withdraw: writerHook.withdraw,
    withdraw_legacy,
    harvest: writerHook.harvest,
    
    // 状态
    isLoading,
    error,
    FARM_ADDRESS: base.FARM_ADDRESS
  };
}

export default useFarmContract; 