import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import useWeb3 from './useWeb3';
import { 
  FARM_ABI, 
  FACTORY_ABI, 
  ERC20_ABI,
  SWAP_ROUTER_ABI,
  SIMPLE_SWAP_ROUTER_ABI,
  PoolInfo,
  UserInfo,
  TokenInfo,
  FarmData,
  SwapInfo
} from '../types';
import { useFarmStore } from '../store';

// Get environment variables or use defaults
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS || '0xE86cD948176C121C8AD25482F6Af3B1BC3F527Df';
const SIMPLE_SWAP_ROUTER_ADDRESS = process.env.REACT_APP_SIMPLE_SWAP_ROUTER_ADDRESS || '0x5Dcde9e56b34e719a72CF060802D276dcb580730';
const AIH_TOKEN_ADDRESS = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '0xFcB512f45172aa1e331D926321eaA1C52D7dce8E';
const USDC_TOKEN_ADDRESS = process.env.REACT_APP_USDC_TOKEN_ADDRESS || '0xB35B48631b69478f28E4365CC1794E378Ad0FA02';

interface UseContractsReturn {
  factoryContract: ethers.Contract | null;
  farmContract: ethers.Contract | null;
  swapRouterContract: ethers.Contract | null;
  simpleSwapRouterContract: ethers.Contract | null;
  loadFarmContract: (farmAddress: string) => void;
  loadSwapRouterContract: (routerAddress: string) => void;
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
  // Swap functions
  createSwapRouter: (treasury: string) => Promise<ethers.ContractTransaction | null>;
  getSwapRouter: () => Promise<string>;
  getSwapExchangeRate: (fromToken: string, toToken: string) => Promise<string>;
  getSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  swap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  addLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  setExchangeRate: (tokenA: string, tokenB: string, rate: string) => Promise<ethers.ContractTransaction | null>;
  getSwapInfo: () => Promise<SwapInfo | null>;
  simpleSwap: (fromToken: string, toToken: string, amount: string) => Promise<ethers.ContractTransaction | null>;
  addSimpleLiquidity: (tokenA: string, tokenB: string, amountA: string, amountB: string) => Promise<ethers.ContractTransaction | null>;
  getSimpleSwapInfo: () => Promise<SwapInfo | null>;
  getSimpleSwapOutputAmount: (fromToken: string, toToken: string, amount: string) => Promise<string>;
  getTokenBalance: (tokenAddress: string, accountAddress: string) => Promise<ethers.BigNumber>;
  isLoading: boolean;
  error: string | null;
}

const useContracts = (): UseContractsReturn => {
  const { provider, signer, account, chainId, isConnected } = useWeb3();
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [farmContract, setFarmContract] = useState<ethers.Contract | null>(null);
  const [swapRouterContract, setSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [simpleSwapRouterContract, setSimpleSwapRouterContract] = useState<ethers.Contract | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contracts
  useEffect(() => {
    if (isConnected && signer) {
      try {
        const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
        setFactoryContract(factory);
        
        // Initialize SimpleSwapRouter
        const simpleSwapRouter = new ethers.Contract(
          SIMPLE_SWAP_ROUTER_ADDRESS,
          SIMPLE_SWAP_ROUTER_ABI,
          signer
        );
        setSimpleSwapRouterContract(simpleSwapRouter);
      } catch (error) {
        console.error('Error initializing contracts:', error);
        setError('Failed to initialize contracts');
      }
    }
  }, [isConnected, signer]);

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

  // Load swap router contract
  const loadSwapRouterContract = useCallback((routerAddress: string) => {
    if (!provider) return;
    
    try {
      const contract = new ethers.Contract(
        routerAddress,
        SWAP_ROUTER_ABI,
        provider
      );
      setSwapRouterContract(contract);
      useFarmStore.getState().setSwapRouterAddress(routerAddress);
    } catch (err: any) {
      console.error('Error loading swap router contract:', err);
      setError('Failed to load swap router contract');
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
      const [amount, rewardDebt] = await farmContract.getUserInfo(userAddress);
      const pendingReward = await farmContract.getPendingReward(userAddress);
      
      return {
        amount: ethers.utils.formatEther(amount),
        rewardDebt: ethers.utils.formatEther(rewardDebt),
        pendingReward: ethers.utils.formatEther(pendingReward),
        unlockTime: 0, // not implemented in the current contract
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
    if (!provider) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenContract = getTokenContract(tokenAddress);
      if (!tokenContract) return null;
      
      const account = useFarmStore.getState().account;
      
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        account ? tokenContract.balanceOf(account) : ethers.BigNumber.from(0),
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
    setIsLoading(true);
    setError(null);
    
    try {
      return await farmContract.rewardToken();
    } catch (err: any) {
      console.error('Error getting reward token:', err);
      setError('Failed to get reward token');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit tokens to farm
  const deposit = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const stakingTokenAddress = await farmContract.stakingToken();
      const tokenContract = new ethers.Contract(stakingTokenAddress, ERC20_ABI, signer);
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // Approve tokens first
      const tx1 = await tokenContract.approve(farmContract.address, parsedAmount);
      await tx1.wait();
      
      // Then deposit
      const tx2 = await farmContract.connect(signer).deposit(0, parsedAmount);
      return tx2;
    } catch (err: any) {
      console.error('Error depositing tokens:', err);
      setError('Failed to deposit tokens: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw tokens from farm
  const withdraw = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const stakingTokenAddress = await farmContract.stakingToken();
      const tokenContract = new ethers.Contract(stakingTokenAddress, ERC20_ABI, signer);
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      const tx = await farmContract.connect(signer).withdraw(0, parsedAmount);
      return tx;
    } catch (err: any) {
      console.error('Error withdrawing tokens:', err);
      setError('Failed to withdraw tokens: ' + err.message);
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
      const tx = await farmContract.connect(signer).compound(0);
      return tx;
    } catch (err: any) {
      console.error('Error compounding rewards:', err);
      setError('Failed to compound rewards: ' + err.message);
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
    if (!factoryContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedRewardRate = ethers.utils.parseEther(rewardPerSecond);
      
      const tx = await factoryContract.connect(signer).createFarm(
        rewardToken,
        parsedRewardRate,
        startTime
      );
      
      return tx;
    } catch (err: any) {
      console.error('Error creating farm:', err);
      setError('Failed to create farm: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending reward
  const getPendingReward = async (pid: number, userAddress: string): Promise<string> => {
    if (!farmContract) return '0';
    
    try {
      const pendingReward = await farmContract.getPendingReward(userAddress);
      return ethers.utils.formatEther(pendingReward);
    } catch (err) {
      console.error('Error getting pending reward:', err);
      return '0';
    }
  };
  
  // Create swap router
  const createSwapRouter = async (treasury: string): Promise<ethers.ContractTransaction | null> => {
    if (!factoryContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await factoryContract.connect(signer).createSwapRouter(treasury);
      return tx;
    } catch (err: any) {
      console.error('Error creating swap router:', err);
      setError('Failed to create swap router: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get swap router
  const getSwapRouter = async (): Promise<string> => {
    if (!factoryContract) return '';
    
    try {
      const swapRouter = await factoryContract.getSwapRouter();
      if (swapRouter && swapRouter !== ethers.constants.AddressZero) {
        loadSwapRouterContract(swapRouter);
        return swapRouter;
      }
      return '';
    } catch (err) {
      console.error('Error getting swap router:', err);
      return '';
    }
  };
  
  // Get exchange rate
  const getSwapExchangeRate = async (fromToken: string, toToken: string): Promise<string> => {
    if (!swapRouterContract) return '0';
    
    try {
      const rate = await swapRouterContract.exchangeRates(fromToken, toToken);
      return ethers.utils.formatEther(rate);
    } catch (err) {
      console.error('Error getting exchange rate:', err);
      return '0';
    }
  };
  
  // Get output amount
  const getSwapOutputAmount = async (fromToken: string, toToken: string, amount: string): Promise<string> => {
    if (!swapRouterContract) return '0';
    
    try {
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) return '0';
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      const outputAmount = await swapRouterContract.getOutputAmount(fromToken, toToken, parsedAmount);
      
      const outputTokenContract = getTokenContract(toToken);
      if (!outputTokenContract) return '0';
      
      const outputDecimals = await outputTokenContract.decimals();
      return ethers.utils.formatUnits(outputAmount, outputDecimals);
    } catch (err) {
      console.error('Error getting output amount:', err);
      return '0';
    }
  };
  
  // Swap tokens
  const swap = async (fromToken: string, toToken: string, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenContract = new ethers.Contract(fromToken, ERC20_ABI, signer);
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // Approve tokens first
      const tx1 = await tokenContract.approve(swapRouterContract.address, parsedAmount);
      await tx1.wait();
      
      // Then swap
      const tx2 = await swapRouterContract.connect(signer).swap(fromToken, toToken, parsedAmount);
      return tx2;
    } catch (err: any) {
      console.error('Error swapping tokens:', err);
      setError('Failed to swap tokens: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add liquidity
  const addLiquidity = async (tokenA: string, tokenB: string, amountA: string, amountB: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, signer);
      const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, signer);
      
      const decimalsA = await tokenAContract.decimals();
      const decimalsB = await tokenBContract.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // Approve tokens first
      const tx1 = await tokenAContract.approve(swapRouterContract.address, parsedAmountA);
      await tx1.wait();
      
      const tx2 = await tokenBContract.approve(swapRouterContract.address, parsedAmountB);
      await tx2.wait();
      
      // Then add liquidity
      const tx3 = await swapRouterContract.connect(signer).addLiquidity(tokenA, tokenB, parsedAmountA, parsedAmountB);
      return tx3;
    } catch (err: any) {
      console.error('Error adding liquidity:', err);
      setError('Failed to add liquidity: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set exchange rate
  const setExchangeRate = async (tokenA: string, tokenB: string, rate: string): Promise<ethers.ContractTransaction | null> => {
    if (!swapRouterContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      const parsedRate = ethers.utils.parseEther(rate);
      const tx = await swapRouterContract.connect(signer).setExchangeRate(tokenA, tokenB, parsedRate);
      return tx;
    } catch (err: any) {
      console.error('Error setting exchange rate:', err);
      setError('Failed to set exchange rate: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get swap info
  const getSwapInfo = async (): Promise<SwapInfo | null> => {
    if (!swapRouterContract) return null;
    
    try {
      const [lpFee, protocolFee, treasury] = await Promise.all([
        swapRouterContract.lpFee(),
        swapRouterContract.protocolFee(),
        swapRouterContract.treasury(),
      ]);
      
      return {
        lpFee: lpFee.toString(),
        protocolFee: protocolFee.toString(),
        treasury,
      };
    } catch (err) {
      console.error('Error getting swap info:', err);
      return null;
    }
  };

  // SimpleSwap
  const simpleSwap = async (
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) return null;
    
    try {
      setIsLoading(true);
      
      const tokenContract = getTokenContract(fromToken);
      if (!tokenContract) return null;
      
      const decimals = await tokenContract.decimals();
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      
      // Check and set allowance if needed
      const allowance = await tokenContract.allowance(
        account,
        SIMPLE_SWAP_ROUTER_ADDRESS
      );
      
      if (allowance.lt(parsedAmount)) {
        const approveTx = await tokenContract.approve(
          SIMPLE_SWAP_ROUTER_ADDRESS,
          ethers.constants.MaxUint256
        );
        await approveTx.wait();
      }
      
      const tx = await simpleSwapRouterContract.swap(fromToken, toToken, parsedAmount);
      return tx;
    } catch (err) {
      console.error('Error performing SimpleSwapRouter swap:', err);
      setError('Failed to swap tokens');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get SimpleSwapRouter info
  const getSimpleSwapInfo = async (): Promise<SwapInfo | null> => {
    if (!simpleSwapRouterContract) return null;
    
    try {
      const [lpFee, protocolFee, treasury] = await Promise.all([
        simpleSwapRouterContract.lpFee(),
        simpleSwapRouterContract.protocolFee(),
        simpleSwapRouterContract.treasury()
      ]);
      
      return {
        lpFee: lpFee.toString(),
        protocolFee: protocolFee.toString(),
        treasury
      };
    } catch (err) {
      console.error('Error getting SimpleSwapRouter info:', err);
      return null;
    }
  };
  
  // Get SimpleSwapRouter output amount
  const getSimpleSwapOutputAmount = async (
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<string> => {
    if (!simpleSwapRouterContract) return '0';
    
    try {
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
      return ethers.utils.formatUnits(outputAmount, outputDecimals);
    } catch (err) {
      console.error('Error getting SimpleSwapRouter output amount:', err);
      return '0';
    }
  };
  
  // Add liquidity to SimpleSwapRouter
  const addSimpleLiquidity = async (
    tokenA: string,
    tokenB: string,
    amountA: string,
    amountB: string
  ): Promise<ethers.ContractTransaction | null> => {
    if (!simpleSwapRouterContract || !signer) return null;
    
    try {
      setIsLoading(true);
      
      const tokenAContract = getTokenContract(tokenA);
      const tokenBContract = getTokenContract(tokenB);
      
      if (!tokenAContract || !tokenBContract) return null;
      
      const decimalsA = await tokenAContract.decimals();
      const decimalsB = await tokenBContract.decimals();
      
      const parsedAmountA = ethers.utils.parseUnits(amountA, decimalsA);
      const parsedAmountB = ethers.utils.parseUnits(amountB, decimalsB);
      
      // Check and set allowances if needed
      const allowanceA = await tokenAContract.allowance(
        account,
        SIMPLE_SWAP_ROUTER_ADDRESS
      );
      
      const allowanceB = await tokenBContract.allowance(
        account,
        SIMPLE_SWAP_ROUTER_ADDRESS
      );
      
      if (allowanceA.lt(parsedAmountA)) {
        const approveTxA = await tokenAContract.approve(
          SIMPLE_SWAP_ROUTER_ADDRESS,
          ethers.constants.MaxUint256
        );
        await approveTxA.wait();
      }
      
      if (allowanceB.lt(parsedAmountB)) {
        const approveTxB = await tokenBContract.approve(
          SIMPLE_SWAP_ROUTER_ADDRESS,
          ethers.constants.MaxUint256
        );
        await approveTxB.wait();
      }
      
      const tx = await simpleSwapRouterContract.addLiquidity(
        tokenA,
        tokenB,
        parsedAmountA,
        parsedAmountB
      );
      
      return tx;
    } catch (err) {
      console.error('Error adding liquidity to SimpleSwapRouter:', err);
      setError('Failed to add liquidity');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get token balance
  const getTokenBalance = async (
    tokenAddress: string,
    accountAddress: string
  ): Promise<ethers.BigNumber> => {
    if (!provider) return ethers.BigNumber.from(0);
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        provider
      );
      
      const balance = await tokenContract.balanceOf(accountAddress);
      return balance;
    } catch (err) {
      console.error('Error getting token balance:', err);
      return ethers.BigNumber.from(0);
    }
  };

  return {
    factoryContract,
    farmContract,
    swapRouterContract,
    simpleSwapRouterContract,
    loadFarmContract,
    loadSwapRouterContract,
    getTokenContract,
    getFarmData,
    getPools,
    getUserInfo,
    getTokenInfo,
    getRewardToken,
    factory: factoryContract,
    getStakingTokenSymbol,
    getRewardTokenSymbol,
    deposit,
    withdraw,
    compound,
    createFarm,
    getPendingReward,
    // Swap functions
    createSwapRouter,
    getSwapRouter,
    getSwapExchangeRate,
    getSwapOutputAmount,
    swap,
    addLiquidity,
    setExchangeRate,
    getSwapInfo,
    simpleSwap,
    addSimpleLiquidity,
    getSimpleSwapInfo,
    getSimpleSwapOutputAmount,
    getTokenBalance,
    isLoading,
    error,
  };
};

export default useContracts; 