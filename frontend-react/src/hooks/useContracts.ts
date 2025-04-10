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
import SimpleFarmABI from '../abis/SimpleFarm.json';

// Get environment variables or use defaults
const FACTORY_ADDRESS = process.env.REACT_APP_FACTORY_ADDRESS || '0xE86cD948176C121C8AD25482F6Af3B1BC3F527Df';
const SIMPLE_SWAP_ROUTER_ADDRESS = process.env.REACT_APP_SIMPLE_SWAP_ROUTER_ADDRESS || '0x5Dcde9e56b34e719a72CF060802D276dcb580730';
const AIH_TOKEN_ADDRESS = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '0xFcB512f45172aa1e331D926321eaA1C52D7dce8E';
const USDC_TOKEN_ADDRESS = process.env.REACT_APP_USDC_TOKEN_ADDRESS || '0xB35B48631b69478f28E4365CC1794E378Ad0FA02';
const FARM_ADDRESS = process.env.REACT_APP_FARM_ADDRESS || '0x02C0e9A0ed9529A3B6d64EDa323057a61cb065B9';

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
        
        // 使用SimpleFarmABI初始化Farm合约
        console.log("初始化SimpleFarm合约:", FARM_ADDRESS);
        const farm = new ethers.Contract(FARM_ADDRESS, SimpleFarmABI, signer);
        setFarmContract(farm);
        
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
      // 使用SimpleFarmABI加载Farm合约
      console.log("加载SimpleFarm合约:", farmAddress);
      const contract = new ethers.Contract(
        farmAddress,
        SimpleFarmABI,
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

  // Get farm data - 适配SimpleFarm合约
  const getFarmData = async (): Promise<FarmData | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // 尝试获取SimpleFarm合约数据
      let rewardToken, rewardRate, startTime, endTime;
      
      try {
        rewardToken = await farmContract.rewardToken();
      } catch (err) {
        console.error("获取奖励代币地址失败，使用AIH代币:", err);
        rewardToken = AIH_TOKEN_ADDRESS;
      }
      
      try {
        rewardRate = await farmContract.rewardPerSecond();
      } catch (err) {
        console.error("获取奖励速率失败，使用默认值:", err);
        rewardRate = ethers.utils.parseEther("0.01");
      }
      
      try {
        startTime = await farmContract.startTime();
      } catch (err) {
        console.error("获取开始时间失败，使用当前时间:", err);
        startTime = Math.floor(Date.now() / 1000);
      }
      
      // 对于SimpleFarm，我们没有明确的结束时间，使用30天作为示例
      endTime = Number(startTime) + 30 * 24 * 60 * 60;
      
      return {
        rewardToken,
        rewardPerSecond: ethers.utils.formatEther(rewardRate),
        startTime: Number(startTime),
        endTime,
        totalAllocPoint: 100, // SimpleFarm没有这个概念，使用默认值
      };
    } catch (err: any) {
      console.error('Error getting farm data:', err);
      setError('Failed to get farm data');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get pools - 适配SimpleFarm合约
  const getPools = async (): Promise<PoolInfo[]> => {
    if (!farmContract) return [];
    setIsLoading(true);
    setError(null);
    
    try {
      // 创建一个简单的模拟池，避免复杂的合约交互
      console.log("使用SimpleFarm合约地址:", FARM_ADDRESS);
      
      // 安全获取质押代币地址
      let stakingTokenAddress;
      try {
        const poolInfo = await farmContract.getPoolInfo(0);
        stakingTokenAddress = poolInfo[0]; // lpToken 
        console.log("从getPoolInfo获取质押代币地址:", stakingTokenAddress);
      } catch (poolError) {
        console.error("获取池信息失败，尝试rewardToken:", poolError);
        try {
          stakingTokenAddress = await farmContract.rewardToken();
          console.log("从rewardToken获取质押代币地址:", stakingTokenAddress);
        } catch (rewardTokenError) {
          console.error("获取代币地址失败，使用默认AIH Token:", rewardTokenError);
          stakingTokenAddress = AIH_TOKEN_ADDRESS;
        }
      }
      
      // 安全获取总质押量
      let totalStaked;
      try {
        totalStaked = await farmContract.totalStaked();
        console.log("总质押量:", ethers.utils.formatEther(totalStaked));
      } catch (stakeError) {
        console.error("获取总质押量失败，使用0:", stakeError);
        totalStaked = ethers.BigNumber.from(0);
      }
      
      // 安全获取奖励速率
      let rewardPerSecond;
      try {
        rewardPerSecond = await farmContract.rewardPerSecond();
        console.log("奖励速率:", ethers.utils.formatEther(rewardPerSecond));
      } catch (rewardError) {
        console.error("获取奖励速率失败，使用默认值:", rewardError);
        rewardPerSecond = ethers.utils.parseEther("0.01");
      }
      
      // 获取代币信息
      const stakingToken = getTokenContract(stakingTokenAddress);
      let name = "AIH Token";
      let symbol = "AIH";
      let decimals = 18;
      
      if (stakingToken) {
        try {
          [name, symbol, decimals] = await Promise.all([
            stakingToken.name().catch(() => "AIH Token"),
            stakingToken.symbol().catch(() => "AIH"),
            stakingToken.decimals().catch(() => 18),
          ]);
          console.log("代币信息:", name, symbol, decimals);
        } catch (tokenInfoError) {
          console.error("获取代币信息失败，使用默认值:", tokenInfoError);
        }
      }
      
      // 计算APR(简化)
      const rewardPerYear = parseFloat(ethers.utils.formatEther(rewardPerSecond)) * 3600 * 24 * 365;
      const totalStakedValue = parseFloat(ethers.utils.formatEther(totalStaked));
      const apr = totalStakedValue > 0 ? ((rewardPerYear / totalStakedValue) * 100).toFixed(2) : "100";
      console.log("计算APR:", apr);
      
      const pool: PoolInfo = {
        id: 0,
        stakingToken: stakingTokenAddress,
        rewardToken: stakingTokenAddress, // 在SimpleFarm中，奖励代币与质押代币相同
        totalStaked: ethers.utils.formatEther(totalStaked),
        rewardRate: ethers.utils.formatEther(rewardPerSecond),
        apr,
        name,
        symbol,
        lpToken: stakingTokenAddress
      };
      
      return [pool];
    } catch (err: any) {
      console.error('Error getting pools:', err);
      setError('Failed to get pools: ' + err.message);
      
      // 返回一个模拟池以避免UI崩溃
      return [{
        id: 0,
        stakingToken: AIH_TOKEN_ADDRESS,
        rewardToken: AIH_TOKEN_ADDRESS,
        totalStaked: "0",
        rewardRate: "0.01",
        apr: "100",
        name: "AIH Farm",
        symbol: "AIH",
        lpToken: AIH_TOKEN_ADDRESS
      }];
    } finally {
      setIsLoading(false);
    }
  };

  // Get user info - 适配SimpleFarm合约
  const getUserInfo = async (pid: number, userAddress: string): Promise<UserInfo | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // 根据合约ABI使用正确的方法获取用户信息
      let userInfoRaw;
      let pendingReward;
      
      try {
        // 尝试先使用getUserInfo方法
        userInfoRaw = await farmContract.getUserInfo(userAddress);
        console.log("使用getUserInfo获取用户信息成功:", userInfoRaw);
      } catch (userError) {
        console.error("getUserInfo失败，尝试使用userInfo映射:", userError);
        try {
          // 备用：尝试使用userInfo映射
          userInfoRaw = await farmContract.userInfo(userAddress);
          console.log("使用userInfo映射获取用户信息成功:", userInfoRaw);
        } catch (mappingError) {
          console.error("两种方式获取用户信息均失败，使用默认值:", mappingError);
          userInfoRaw = [
            ethers.BigNumber.from(0),
            ethers.BigNumber.from(0),
            ethers.BigNumber.from(0)
          ];
        }
      }
      
      try {
        // 尝试获取待领取奖励
        pendingReward = await farmContract.pendingReward(userAddress);
        console.log("待领取奖励:", ethers.utils.formatEther(pendingReward));
      } catch (rewardError) {
        console.error("获取待领取奖励失败，尝试使用getPendingReward:", rewardError);
        try {
          pendingReward = await farmContract.getPendingReward(userAddress);
          console.log("使用getPendingReward获取奖励成功:", ethers.utils.formatEther(pendingReward));
        } catch (err) {
          console.error("两种方式获取奖励均失败，使用0:", err);
          pendingReward = ethers.BigNumber.from(0);
        }
      }
      
      return {
        amount: ethers.utils.formatEther(userInfoRaw[0]),  // amount
        rewardDebt: ethers.utils.formatEther(userInfoRaw[1]), // rewardDebt
        pendingReward: ethers.utils.formatEther(pendingReward),
        unlockTime: Number(userInfoRaw[2])  // unlockTime
      };
    } catch (err: any) {
      console.error('Error getting user info:', err);
      setError('Failed to get user info: ' + err.message);
      
      // 返回默认值以避免UI崩溃
      return {
        amount: "0",
        rewardDebt: "0",
        pendingReward: "0", 
        unlockTime: 0
      };
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

  // Get reward token - 适配SimpleFarm合约
  const getRewardToken = async (): Promise<string | null> => {
    if (!farmContract) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      try {
        const token = await farmContract.rewardToken();
        console.log("奖励代币地址:", token);
        return token;
      } catch (err) {
        console.error('调用rewardToken方法失败，使用默认AIH代币:', err);
        return AIH_TOKEN_ADDRESS;
      }
    } catch (err: any) {
      console.error('Error getting reward token:', err);
      setError('Failed to get reward token');
      return AIH_TOKEN_ADDRESS; // 返回默认值以避免UI崩溃
    } finally {
      setIsLoading(false);
    }
  };

  // Deposit tokens to farm - 适配SimpleFarm合约
  const deposit = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // 安全获取质押代币地址
      let stakingTokenAddress;
      try {
        stakingTokenAddress = await farmContract.rewardToken();
        console.log("获取质押代币地址:", stakingTokenAddress);
      } catch (err) {
        console.error('获取质押代币地址失败，使用AIH代币:', err);
        stakingTokenAddress = AIH_TOKEN_ADDRESS;
      }
      
      // 创建代币合约
      const tokenContract = new ethers.Contract(stakingTokenAddress, ERC20_ABI, signer);
      
      // 安全获取代币精度
      let decimals;
      try {
        decimals = await tokenContract.decimals();
      } catch (err) {
        console.error('获取代币精度失败，使用默认18:', err);
        decimals = 18;
      }
      
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      console.log("质押金额:", amount, "精度:", decimals, "解析后:", parsedAmount.toString());
      
      // 批准代币
      try {
        console.log(`批准 ${parsedAmount} 代币给Farm合约 ${FARM_ADDRESS}`);
        const approveTx = await tokenContract.approve(FARM_ADDRESS, parsedAmount);
        await approveTx.wait();
        console.log('Tokens approved for staking');
      } catch (err) {
        console.error('批准代币失败:', err);
        setError('批准代币失败，请重试');
        return null;
      }
      
      // 执行质押操作
      try {
        console.log(`质押 ${parsedAmount} 代币到Farm合约`);
        const tx = await farmContract.connect(signer).deposit(parsedAmount);
        console.log("质押交易哈希:", tx.hash);
        return tx;
      } catch (err) {
        console.error('质押代币失败:', err);
        setError('质押代币失败，请检查您的余额并重试');
        return null;
      }
    } catch (err: any) {
      console.error('Error depositing tokens:', err);
      setError('Failed to deposit tokens: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw tokens from farm - 适配SimpleFarm合约
  const withdraw = async (pid: number, amount: string): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // 安全获取质押代币地址
      let stakingTokenAddress;
      try {
        stakingTokenAddress = await farmContract.rewardToken();
      } catch (err) {
        console.error('获取质押代币地址失败，使用AIH代币:', err);
        stakingTokenAddress = AIH_TOKEN_ADDRESS;
      }
      
      // 创建代币合约
      const tokenContract = new ethers.Contract(stakingTokenAddress, ERC20_ABI, signer);
      
      // 安全获取代币精度
      let decimals;
      try {
        decimals = await tokenContract.decimals();
      } catch (err) {
        console.error('获取代币精度失败，使用默认18:', err);
        decimals = 18;
      }
      
      const parsedAmount = ethers.utils.parseUnits(amount, decimals);
      console.log("提取金额:", amount, "精度:", decimals, "解析后:", parsedAmount.toString());
      
      // 检查用户质押量
      try {
        let userInfoRaw;
        try {
          userInfoRaw = await farmContract.getUserInfo(account);
        } catch (err) {
          userInfoRaw = await farmContract.userInfo(account);
        }
        
        if (userInfoRaw[0].lt(parsedAmount)) {
          console.error('提取金额超过质押量', userInfoRaw[0].toString(), parsedAmount.toString());
          setError('提取金额超过您的质押量');
          return null;
        }
        
        // 检查解锁时间
        const unlockTime = Number(userInfoRaw[2]);
        const currentTime = Math.floor(Date.now() / 1000);
        if (unlockTime > currentTime) {
          const remainingTime = unlockTime - currentTime;
          const remainingHours = Math.ceil(remainingTime / 3600);
          console.error('质押仍在锁定期', remainingHours, '小时后解锁');
          setError(`您的质押仍在锁定期，还需等待约 ${remainingHours} 小时`);
          return null;
        }
      } catch (err) {
        console.error('检查用户质押量失败:', err);
        // 继续执行，让合约函数处理错误
      }
      
      // 执行提取操作
      try {
        console.log(`从Farm合约提取 ${parsedAmount} 代币`);
        const tx = await farmContract.connect(signer).withdraw(parsedAmount);
        console.log("提取交易哈希:", tx.hash);
        return tx;
      } catch (err) {
        console.error('提取代币失败:', err);
        setError('提取代币失败，可能是锁定期未结束或余额不足');
        return null;
      }
    } catch (err: any) {
      console.error('Error withdrawing tokens:', err);
      setError('Failed to withdraw tokens: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Compound rewards - 适配SimpleFarm合约
  const compound = async (pid: number): Promise<ethers.ContractTransaction | null> => {
    if (!farmContract || !signer) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取待领取奖励
      let pendingReward;
      try {
        pendingReward = await farmContract.pendingReward(account);
      } catch (err) {
        try {
          pendingReward = await farmContract.getPendingReward(account);
        } catch (err2) {
          console.error('获取待领取奖励失败:', err2);
          setError('获取待领取奖励失败');
          return null;
        }
      }
      
      if (pendingReward.isZero()) {
        setError('没有可领取的奖励');
        return null;
      }
      
      console.log("待领取奖励:", ethers.utils.formatEther(pendingReward));
      
      // SimpleFarm没有compound函数，我们使用两步操作模拟:
      // 1. 先调用deposit(0)来收获奖励
      // 2. 然后再质押新获得的奖励
      
      // 步骤1: 收获奖励
      try {
        console.log('收获奖励中...');
        // 调用deposit函数并传入0值，这会触发奖励收获而不增加质押
        const harvestTx = await farmContract.connect(signer).deposit(0);
        console.log("收获交易哈希:", harvestTx.hash);
        await harvestTx.wait();
        console.log('奖励已收获');
        
        // 用户现在应该收到了奖励代币
        
        // 步骤2: 检查奖励代币余额
        let rewardTokenAddress;
        try {
          rewardTokenAddress = await farmContract.rewardToken();
        } catch (err) {
          console.error('获取奖励代币地址失败，使用AIH代币:', err);
          rewardTokenAddress = AIH_TOKEN_ADDRESS;
        }
        
        const tokenContract = new ethers.Contract(rewardTokenAddress, ERC20_ABI, signer);
        
        // 获取用户当前奖励代币余额
        let balance;
        try {
          balance = await tokenContract.balanceOf(account);
          console.log("奖励代币余额:", ethers.utils.formatEther(balance));
        } catch (err) {
          console.error('获取奖励代币余额失败:', err);
          setError('获取奖励代币余额失败');
          return harvestTx; // 至少返回收获交易
        }
        
        if (balance.isZero()) {
          console.log('收获成功，但没有余额可再质押');
          return harvestTx;
        }
        
        // 批准代币
        try {
          console.log("批准质押", ethers.utils.formatEther(balance), "代币");
          const approveTx = await tokenContract.approve(FARM_ADDRESS, balance);
          await approveTx.wait();
          console.log('Tokens approved for staking');
        } catch (err) {
          console.error('批准代币失败:', err);
          setError('批准代币失败，但奖励已收获');
          return harvestTx;
        }
        
        // 质押全部奖励
        try {
          console.log(`质押 ${ethers.utils.formatEther(balance)} 奖励代币回Farm合约`);
          const stakeTx = await farmContract.connect(signer).deposit(balance);
          console.log("质押交易哈希:", stakeTx.hash);
          return stakeTx;
        } catch (err) {
          console.error('质押奖励失败:', err);
          setError('质押奖励失败，但奖励已收获到您的钱包');
          return harvestTx;
        }
        
      } catch (err) {
        console.error('收获奖励失败:', err);
        setError('收获奖励失败');
        return null;
      }
    } catch (err: any) {
      console.error('Error compounding rewards:', err);
      setError('Failed to compound rewards: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get pending reward - 适配SimpleFarm合约
  const getPendingReward = async (pid: number, userAddress: string): Promise<string> => {
    if (!farmContract) return "0";
    
    try {
      // 尝试多种方法获取待领取奖励
      try {
        // 方法1: 直接使用pendingReward函数
        console.log("尝试使用pendingReward获取奖励...");
        const pendingReward = await farmContract.pendingReward(userAddress);
        console.log("使用pendingReward成功:", ethers.utils.formatEther(pendingReward));
        return ethers.utils.formatEther(pendingReward);
      } catch (err) {
        console.error('pendingReward失败，尝试getPendingReward:', err);
        
        try {
          // 方法2: 使用getPendingReward函数
          console.log("尝试使用getPendingReward获取奖励...");
          const pendingReward = await farmContract.getPendingReward(userAddress);
          console.log("使用getPendingReward成功:", ethers.utils.formatEther(pendingReward));
          return ethers.utils.formatEther(pendingReward);
        } catch (err2) {
          console.error('getPendingReward也失败，返回0:', err2);
          return "0";
        }
      }
    } catch (err) {
      console.error('Error getting pending reward:', err);
      return "0"; // 返回0以避免UI崩溃
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