import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { 
  FARM_ABI, 
  FACTORY_ABI, 
  ERC20_ABI,
  PoolInfo,
  UserInfo,
  TokenInfo,
  FarmData
} from '../types';

// Network configuration
const NETWORK_CONFIG = {
  // These addresses would come from your deployment
  FACTORY_ADDRESS: '0x0000000000000000000000000000000000000000', // Replace with actual address
};

interface UseContractsReturn {
  factoryContract: ethers.Contract | null;
  farmContract: ethers.Contract | null;
  loadFarmContract: (farmAddress: string) => void;
  getTokenContract: (tokenAddress: string) => ethers.Contract | null;
  getFarmData: () => Promise<FarmData | null>;
  getPools: () => Promise<PoolInfo[]>;
  getUserInfo: (pid: number, userAddress: string) => Promise<UserInfo | null>;
  getTokenInfo: (tokenAddress: string) => Promise<TokenInfo | null>;
  getRewardToken: () => Promise<string | null>;
  deposit: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  compound: (pid: number) => Promise<ethers.ContractTransaction | null>;
  createFarm: (rewardToken: string, rewardPerSecond: string, startTime: number) => Promise<ethers.ContractTransaction | null>;
  isLoading: boolean;
  error: string | null;
}

const useContracts = (): UseContractsReturn => {
  const { provider, signer, isConnected } = useWeb3();
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [farmContract, setFarmContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize factory contract
  useEffect(() => {
    if (provider && NETWORK_CONFIG.FACTORY_ADDRESS) {
      try {
        const contract = new ethers.Contract(
          NETWORK_CONFIG.FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );
        setFactoryContract(contract);
      } catch (err: any) {
        console.error('Error initializing factory contract:', err);
        setError('Failed to initialize factory contract');
      }
    }
  }, [provider]);

  // Load farm contract
  const loadFarmContract = useCallback((farmAddress: string) => {
    if (!provider) return;
    
    try {
      const contract = new ethers.Contract(
        farmAddress,
        FARM_ABI,
        provider
      );
      setFarmContract(contract);
    } catch (err: any) {
      console.error('Error loading farm contract:', err);
      setError('Failed to load farm contract');
    }
  }, [provider]);

  // Get token contract
  const getTokenContract = useCallback((tokenAddress: string) => {
    if (!provider) return null;
    
    try {
      return new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
    } catch (err) {
      console.error('Error getting token contract:', err);
      return null;
    }
  }, [provider]);

  // Get farm data
  const getFarmData = async (): Promise<FarmData | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const [rewardToken, rewardPerSecond, startTime, endTime, totalAllocPoint] = await Promise.all([
        farmContract.rewardToken(),
        farmContract.rewardPerSecond(),
        farmContract.startTime(),
        farmContract.endTime(),
        farmContract.totalAllocPoint(),
      ]);
      
      return {
        rewardToken,
        rewardPerSecond: ethers.utils.formatEther(rewardPerSecond),
        startTime: startTime.toNumber(),
        endTime: endTime.toNumber(),
        totalAllocPoint: totalAllocPoint.toNumber(),
      };
    } catch (err: any) {
      console.error('Error getting farm data:', err);
      setError('Failed to get farm data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get pools
  const getPools = async (): Promise<PoolInfo[]> => {
    if (!farmContract) return [];
    setIsLoading(true);
    setError(null);
    
    try {
      const poolLength = await farmContract.poolLength();
      const pools: PoolInfo[] = [];
      
      for (let i = 0; i < poolLength; i++) {
        const poolInfo = await farmContract.poolInfo(i);
        
        // Get token info
        const lpToken = getTokenContract(poolInfo.lpToken);
        if (!lpToken) continue;
        
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          lpToken.name(),
          lpToken.symbol(),
          lpToken.decimals(),
          lpToken.totalSupply(),
        ]);
        
        // Calculate total staked
        const balance = await lpToken.balanceOf(farmContract.address);
        
        // Get APR (simplified calculation)
        const farmData = await getFarmData();
        const apr = farmData ? calculateAPR(
          farmData.rewardPerSecond,
          farmData.totalAllocPoint,
          poolInfo.allocPoint.toNumber(),
          ethers.utils.formatUnits(balance, decimals)
        ) : 0;
        
        pools.push({
          lpToken: poolInfo.lpToken,
          allocPoint: poolInfo.allocPoint.toNumber(),
          lastRewardTime: poolInfo.lastRewardTime.toNumber(),
          accRewardPerShare: poolInfo.accRewardPerShare.toNumber(),
          name,
          symbol,
          totalStaked: ethers.utils.formatUnits(balance, decimals),
          apr,
        });
      }
      
      return pools;
    } catch (err: any) {
      console.error('Error getting pools:', err);
      setError('Failed to get pools');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get user info
  const getUserInfo = async (pid: number, userAddress: string): Promise<UserInfo | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const [userInfo, pendingReward] = await Promise.all([
        farmContract.userInfo(pid, userAddress),
        farmContract.pendingReward(pid, userAddress),
      ]);
      
      return {
        amount: ethers.utils.formatEther(userInfo.amount),
        rewardDebt: ethers.utils.formatEther(userInfo.rewardDebt),
        unlockTime: userInfo.unlockTime.toNumber(),
        pendingRewards: ethers.utils.formatEther(pendingReward),
      };
    } catch (err: any) {
      console.error('Error getting user info:', err);
      setError('Failed to get user info');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get token info
  const getTokenInfo = async (tokenAddress: string): Promise<TokenInfo | null> => {
    if (!provider || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenContract = getTokenContract(tokenAddress);
      if (!tokenContract) return null;
      
      const userAddress = await signer.getAddress();
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(userAddress),
      ]);
      
      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        balance: ethers.utils.formatUnits(balance, decimals),
      };
    } catch (err: any) {
      console.error('Error getting token info:', err);
      setError('Failed to get token info');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get reward token
  const getRewardToken = async (): Promise<string | null> => {
    if (!farmContract) return null;
    
    try {
      return await farmContract.rewardToken();
    } catch (err) {
      console.error('Error getting reward token:', err);
      return null;
    }
  };

  // Deposit
  const deposit = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer || !isConnected) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // Get pool info to know which token to approve
      const poolInfo = await farmContract.poolInfo(pid);
      const lpToken = getTokenContract(poolInfo.lpToken);
      if (!lpToken) throw new Error('LP token contract not found');
      
      // Connect with signer for transactions
      const lpTokenWithSigner = lpToken.connect(signer);
      const farmWithSigner = farmContract.connect(signer);
      
      // Convert amount to wei
      const amountWei = ethers.utils.parseEther(amount);
      
      // Approve tokens first
      const approvalTx = await lpTokenWithSigner.approve(farmContract.address, amountWei);
      await approvalTx.wait();
      
      // Now deposit
      const tx = await farmWithSigner.deposit(pid, amountWei);
      return tx;
    } catch (err: any) {
      console.error('Error depositing:', err);
      setError(err.message || 'Failed to deposit');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw
  const withdraw = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer || !isConnected) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const farmWithSigner = farmContract.connect(signer);
      const amountWei = ethers.utils.parseEther(amount);
      
      const tx = await farmWithSigner.withdraw(pid, amountWei);
      return tx;
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      setError(err.message || 'Failed to withdraw');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Compound
  const compound = async (pid: number): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer || !isConnected) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const farmWithSigner = farmContract.connect(signer);
      const tx = await farmWithSigner.compound(pid);
      return tx;
    } catch (err: any) {
      console.error('Error compounding:', err);
      setError(err.message || 'Failed to compound');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create farm
  const createFarm = async (
    rewardToken: string, 
    rewardPerSecond: string, 
    startTime: number
  ): Promise<ethers.ContractTransaction | null> => {
    if (!factoryContract || !signer || !isConnected) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const factoryWithSigner = factoryContract.connect(signer);
      const rewardPerSecondWei = ethers.utils.parseEther(rewardPerSecond);
      
      const tx = await factoryWithSigner.createFarm(
        rewardToken,
        rewardPerSecondWei,
        startTime
      );
      
      return tx;
    } catch (err: any) {
      console.error('Error creating farm:', err);
      setError(err.message || 'Failed to create farm');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate APR
  const calculateAPR = (
    rewardPerSecond: string,
    totalAllocPoint: number,
    poolAllocPoint: number,
    totalStaked: string
  ): number => {
    if (totalAllocPoint === 0 || parseFloat(totalStaked) === 0) return 0;
    
    // Daily rewards for this pool
    const poolRewardPerSecond = parseFloat(rewardPerSecond) * (poolAllocPoint / totalAllocPoint);
    const dailyRewards = poolRewardPerSecond * 86400; // 86400 seconds in a day
    
    // Annual rewards
    const annualRewards = dailyRewards * 365;
    
    // APR = (Annual Rewards / Total Staked) * 100
    return (annualRewards / parseFloat(totalStaked)) * 100;
  };

  return {
    factoryContract,
    farmContract,
    loadFarmContract,
    getTokenContract,
    getFarmData,
    getPools,
    getUserInfo,
    getTokenInfo,
    getRewardToken,
    deposit,
    withdraw,
    compound,
    createFarm,
    isLoading,
    error,
  };
};

export default useContracts; 