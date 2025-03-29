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

// Get environment variables or use defaults
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS || '0xE86cD948176C121C8AD25482F6Af3B1BC3F527Df';

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
  // Add factory and token symbol functions used in Farms component
  factory: ethers.Contract | null;
  getStakingTokenSymbol: (address: string) => Promise<string>;
  getRewardTokenSymbol: (address: string) => Promise<string>;
  deposit: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  withdraw: (pid: number, amount: string) => Promise<ethers.ContractTransaction | null>;
  compound: (pid: number) => Promise<ethers.ContractTransaction | null>;
  createFarm: (rewardToken: string, rewardPerSecond: string, startTime: number) => Promise<ethers.ContractTransaction | null>;
  getPendingReward: (pid: number, userAddress: string) => Promise<string>;
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
    if (provider && FACTORY_ADDRESS) {
      try {
        const contract = new ethers.Contract(
          FACTORY_ADDRESS,
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

  // Get token symbol - needed for Farms component
  const getStakingTokenSymbol = async (address: string): Promise<string> => {
    try {
      const tokenContract = getTokenContract(address);
      if (!tokenContract) return '';
      return await tokenContract.symbol();
    } catch (err) {
      console.error('Error getting staking token symbol:', err);
      return '';
    }
  };

  // Get reward token symbol - needed for Farms component
  const getRewardTokenSymbol = async (address: string): Promise<string> => {
    try {
      const tokenContract = getTokenContract(address);
      if (!tokenContract) return '';
      return await tokenContract.symbol();
    } catch (err) {
      console.error('Error getting reward token symbol:', err);
      return '';
    }
  };

  // Get farm data
  const getFarmData = async (): Promise<FarmData | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // Use a simplified version that matches our contract interface
      const [rewardToken, rewardRate] = await Promise.all([
        farmContract.rewardToken(),
        farmContract.rewardRate(),
      ]);
      
      return {
        rewardToken,
        rewardPerSecond: ethers.utils.formatEther(rewardRate),
        startTime: Math.floor(Date.now() / 1000), // Mock value
        endTime: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // Mock value: 30 days from now
        totalAllocPoint: 100, // Mock value
      };
    } catch (err: any) {
      console.error('Error getting farm data:', err);
      setError('Failed to get farm data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get pools - updated to match our PoolInfo interface
  const getPools = async (): Promise<PoolInfo[]> => {
    if (!farmContract) return [];
    setIsLoading(true);
    setError(null);
    
    try {
      // In this simplified version, we mock a single pool
      const stakingTokenAddress = await farmContract.stakingToken();
      const rewardTokenAddress = await farmContract.rewardToken();
      const totalStaked = await farmContract.totalStaked();
      const rewardRate = await farmContract.rewardRate();
      
      // Get token info
      const stakingToken = getTokenContract(stakingTokenAddress);
      if (!stakingToken) return [];
      
      const [name, symbol, decimals] = await Promise.all([
        stakingToken.name(),
        stakingToken.symbol(),
        stakingToken.decimals(),
      ]);
      
      // Calculate APR (simplified)
      const apr = "12.5"; // Mock value
      
      const pool: PoolInfo = {
        id: 0,
        stakingToken: stakingTokenAddress,
        rewardToken: rewardTokenAddress,
        totalStaked: ethers.utils.formatUnits(totalStaked, decimals),
        rewardRate: ethers.utils.formatUnits(rewardRate, decimals),
        apr,
        name,
        symbol,
        lpToken: stakingTokenAddress, // For backward compatibility
      };
      
      return [pool];
    } catch (err: any) {
      console.error('Error getting pools:', err);
      setError('Failed to get pools');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Get user info - updated to match our UserInfo interface
  const getUserInfo = async (pid: number, userAddress: string): Promise<UserInfo | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // In this simplified version, we just get user info from the contract
      const [userInfoData, pendingReward] = await Promise.all([
        farmContract.getUserInfo(userAddress),
        farmContract.getPendingReward(userAddress),
      ]);
      
      // userInfoData is expected to be an array with [amount, rewardDebt]
      const userInfoResult: UserInfo = {
        amount: ethers.utils.formatEther(userInfoData[0]),
        rewardDebt: ethers.utils.formatEther(userInfoData[1]),
        pendingReward: ethers.utils.formatEther(pendingReward),
        pendingRewards: ethers.utils.formatEther(pendingReward), // Alias for compatibility
        unlockTime: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // Mock value: 7 days from now
      };
      
      return userInfoResult;
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

  // Deposit tokens
  const deposit = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // For simplicity, ignoring pid as our contract has a single pool
      const tx = await farmContract.connect(signer).stake(
        ethers.utils.parseEther(amount)
      );
      return tx;
    } catch (err: any) {
      console.error('Error depositing:', err);
      setError(err.message || 'Failed to deposit');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw tokens
  const withdraw = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // For simplicity, ignoring pid as our contract has a single pool
      const tx = await farmContract.connect(signer).withdraw(
        ethers.utils.parseEther(amount)
      );
      return tx;
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      setError(err.message || 'Failed to withdraw');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Compound rewards
  const compound = async (pid: number): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // For simplicity, ignoring pid as our contract has a single pool
      const tx = await farmContract.connect(signer).compound();
      return tx;
    } catch (err: any) {
      console.error('Error compounding:', err);
      setError(err.message || 'Failed to compound');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new farm
  const createFarm = async (
    rewardToken: string, 
    rewardPerSecond: string, 
    startTime: number
  ): Promise<ethers.ContractTransaction | null> => {
    if (!factoryContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await factoryContract.connect(signer).createFarm(
        rewardToken,
        ethers.utils.parseEther(rewardPerSecond),
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

  // Get pending reward
  const getPendingReward = async (pid: number, userAddress: string): Promise<string> => {
    if (!farmContract) return '0';
    setIsLoading(true);
    setError(null);
    
    try {
      // For simplicity, ignoring pid as our contract has a single pool
      const pendingReward = await farmContract.getPendingReward(userAddress);
      return ethers.utils.formatEther(pendingReward);
    } catch (err: any) {
      console.error('Error getting pending reward:', err);
      setError(err.message || 'Failed to get pending reward');
      return '0';
    } finally {
      setIsLoading(false);
    }
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
    factory: factoryContract, // Alias for compatibility with Farms component
    getStakingTokenSymbol,
    getRewardTokenSymbol,
    deposit,
    withdraw,
    compound,
    createFarm,
    getPendingReward,
    isLoading,
    error,
  };
};

export default useContracts; 