import React, { useEffect, useState, useCallback } from 'react';
import { useFarmStore } from '../store';
import useContracts from '../hooks/useContracts';
import useWeb3 from '../hooks/useWeb3';
import { ethers } from 'ethers';
import '../styles/Farms.css';

// FarmCard component to display individual farm information
const FarmCard = ({ 
  pool, 
  userStake, 
  pendingReward, 
  onStake, 
  onHarvest,
  onWithdraw
}: { 
  pool: any; 
  userStake: string; 
  pendingReward: string; 
  onStake: () => void;
  onHarvest: () => void;
  onWithdraw: () => void;
}) => {
  // Format number with commas and fixed decimals
  const formatNumber = (value: string, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Calculate percentage of user stake in the pool
  const calculateStakePercentage = () => {
    if (!userStake || !pool.totalStaked) return 0;
    const userStakeNum = parseFloat(userStake);
    const totalStakedNum = parseFloat(pool.totalStaked);
    if (isNaN(userStakeNum) || isNaN(totalStakedNum) || totalStakedNum === 0) return 0;
    return (userStakeNum / totalStakedNum) * 100;
  };

  const stakePercentage = calculateStakePercentage();

  return (
    <div className="farm-card">
      {/* APR Badge */}
      <div className="apr-badge">
        APR: {pool.apr}%
      </div>
      
      <div className="farm-card-content">
        <h3 className="farm-title">
          {pool.name || `Pool ${pool.id}`}
          {parseFloat(userStake) > 0 && (
            <span className="staked-badge">Staked</span>
          )}
        </h3>
        
        <div className="farm-info">
          <div className="info-row">
            <span className="info-label">Staking Token</span>
            <span className="info-value">{pool.symbol}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Reward Token</span>
            <span className="info-value">{pool.rewardSymbol || 'AIH'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Total Staked</span>
            <span className="info-value">{formatNumber(pool.totalStaked)}</span>
          </div>
        </div>
        
        {parseFloat(userStake) > 0 && (
          <div className="user-stake-info">
            <div className="info-row">
              <span className="info-label">Your Stake</span>
              <span className="info-value">{formatNumber(userStake)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Pending Rewards</span>
              <span className="info-value reward-value">{formatNumber(pendingReward)}</span>
            </div>
            
            {/* Progress bar showing user's percentage of the pool */}
            <div className="pool-share">
              <div className="share-header">
                <span>Pool Share</span>
                <span>{stakePercentage.toFixed(2)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stakePercentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="farm-actions">
          {parseFloat(userStake) > 0 ? (
            <>
              <button className="button secondary-button" onClick={onWithdraw}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z"/>
                  <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                Withdraw
              </button>
              <button className="button primary-button" onClick={onStake}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
                  <path fillRule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Deposit
              </button>
            </>
          ) : (
            <button className="button primary-button" onClick={onStake}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
                <path fillRule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Stake
            </button>
          )}
          <button 
            className={`button ${Number(pendingReward) <= 0 ? 'disabled-button' : 'harvest-button'}`}
            onClick={onHarvest}
            disabled={Number(pendingReward) <= 0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 1a.5.5 0 0 1 .5.5v5.5h5.5a.5.5 0 0 1 0 1h-5.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z"/>
            </svg>
            Harvest
          </button>
        </div>
      </div>
    </div>
  );
};

const Farms: React.FC = () => {
  const { isConnected, account } = useWeb3();
  const { 
    getPools, 
    getUserInfo, 
    getPendingReward,
    getStakingTokenSymbol, 
    getRewardTokenSymbol,
    deposit,
    withdraw,
    compound
  } = useContracts();
  
  const { pools, setUserStake, setPendingReward, setPoolInfo } = useFarmStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('apr');
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<number | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch farm pools
  useEffect(() => {
    const fetchPools = async () => {
      if (!isConnected) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const poolsData = await getPools();
        
        // Process additional data for each pool
        for (const pool of poolsData) {
          const stakingTokenSymbol = await getStakingTokenSymbol(pool.stakingToken);
          const rewardTokenSymbol = await getRewardTokenSymbol(pool.rewardToken);
          
          setPoolInfo(pool.id, {
            ...pool,
            symbol: stakingTokenSymbol,
            rewardSymbol: rewardTokenSymbol,
            apr: calculateApr(pool),
          });
          
          // If user is connected, fetch their stake info
          if (account) {
            const userInfo = await getUserInfo(pool.id, account);
            if (userInfo) {
              setUserStake(pool.id, userInfo.amount);
              
              const pendingReward = await getPendingReward(pool.id, account);
              setPendingReward(pool.id, pendingReward);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching farm data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPools();
  }, [isConnected, account, getPools, getUserInfo, getStakingTokenSymbol, getRewardTokenSymbol, getPendingReward, setPoolInfo, setUserStake, setPendingReward]);
  
  // Calculate APR for a pool
  const calculateApr = (pool: any) => {
    // This is a simplified calculation, in a real app you would
    // use more accurate data and calculations
    const rewardRatePerYear = parseFloat(pool.rewardRate) * 365 * 24 * 60 * 60;
    const totalStakedValue = parseFloat(pool.totalStaked);
    
    if (!totalStakedValue || totalStakedValue === 0) return '100';
    
    const apr = (rewardRatePerYear / totalStakedValue) * 100;
    return apr.toFixed(2);
  };
  
  const updatePendingRewards = useCallback(async () => {
    if (!account || !isConnected) return;
    
    try {
      for (const pool of pools) {
        const pendingReward = await getPendingReward(pool.id, account);
        if (pendingReward) {
          useFarmStore.getState().setPendingReward(pool.id, pendingReward);
        }
      }
    } catch (err) {
      console.error('Error updating pending rewards:', err);
    }
  }, [account, isConnected, pools, getPendingReward]);
  
  // Update pending rewards periodically
  useEffect(() => {
    if (!isConnected || !account) return;
    
    updatePendingRewards();
    
    const timer = setInterval(() => {
      updatePendingRewards();
    }, 10000); // Every 10 seconds
    
    return () => clearInterval(timer);
  }, [isConnected, account, updatePendingRewards]);
  
  const handleStakeClick = (poolId: number) => {
    setSelectedPool(poolId);
    setStakeModalOpen(true);
  };
  
  const handleWithdrawClick = (poolId: number) => {
    setSelectedPool(poolId);
    setWithdrawModalOpen(true);
  };
  
  const handleStakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !stakeAmount || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await deposit(selectedPool, stakeAmount);
      
      // Reset form and close modal
      setStakeAmount('');
      setStakeModalOpen(false);
      
      // Update user stake after a short delay
      setTimeout(async () => {
        if (account) {
          const userInfo = await getUserInfo(selectedPool, account);
          if (userInfo) {
            setUserStake(selectedPool, userInfo.amount);
          }
        }
        setIsProcessing(false);
      }, 2000);
    } catch (err) {
      console.error('Error staking tokens:', err);
      setIsProcessing(false);
    }
  };
  
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !withdrawAmount || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await withdraw(selectedPool, withdrawAmount);
      
      // Reset form and close modal
      setWithdrawAmount('');
      setWithdrawModalOpen(false);
      
      // Update user stake after a short delay
      setTimeout(async () => {
        if (account) {
          const userInfo = await getUserInfo(selectedPool, account);
          if (userInfo) {
            setUserStake(selectedPool, userInfo.amount);
          }
        }
        setIsProcessing(false);
      }, 2000);
    } catch (err) {
      console.error('Error withdrawing tokens:', err);
      setIsProcessing(false);
    }
  };
  
  const handleHarvest = async (poolId: number) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      await compound(poolId);
      
      // Update pending rewards after harvest
      setTimeout(async () => {
        await updatePendingRewards();
        setIsProcessing(false);
      }, 2000);
    } catch (err) {
      console.error('Error harvesting rewards:', err);
      setIsProcessing(false);
    }
  };

  // Filter and sort pools
  const filteredAndSortedPools = pools
    .filter(pool => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (pool.name && pool.name.toLowerCase().includes(query)) ||
        (pool.symbol && pool.symbol.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'apr':
          return parseFloat(b.apr) - parseFloat(a.apr);
        case 'totalStaked':
          return parseFloat(b.totalStaked) - parseFloat(a.totalStaked);
        case 'yourStake':
          const stakeA = parseFloat(useFarmStore.getState().userStakes[a.id] || '0');
          const stakeB = parseFloat(useFarmStore.getState().userStakes[b.id] || '0');
          return stakeB - stakeA;
        default:
          return 0;
      }
    });
  
  if (isLoading) {
    return (
      <div className="farms-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading farms data...</p>
        </div>
      </div>
    );
  }
  
  if (!isConnected) {
    return (
      <div className="farms-page">
        <div className="connect-wallet-message">
          <div className="message-card">
            <h2>Connect Your Wallet</h2>
            <p>Please connect your wallet to view available farms and start earning rewards.</p>
            <p className="secondary-text">Once connected, you'll be able to stake tokens and earn AIH rewards.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="farms-page">
      <div className="gradient-background">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
      </div>
      
      <div className="farms-header">
        <div className="header-content">
          <h1>Yield Farms</h1>
          <p>Stake tokens to earn AIH rewards with AI-powered strategies</p>
        </div>
        
        <div className="farms-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search farms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="search-icon" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </div>
          
          <select 
            className="sort-select" 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="apr">Sort by APR</option>
            <option value="totalStaked">Sort by Total Staked</option>
            <option value="yourStake">Sort by Your Stake</option>
          </select>
        </div>
      </div>
      
      {filteredAndSortedPools.length === 0 ? (
        <div className="no-farms-message">
          <p>No farms match your search criteria.</p>
        </div>
      ) : (
        <div className="farms-grid">
          {filteredAndSortedPools.map((pool) => (
            <FarmCard
              key={pool.id}
              pool={pool}
              userStake={useFarmStore.getState().userStakes[pool.id] || '0'}
              pendingReward={useFarmStore.getState().pendingRewards[pool.id] || '0'}
              onStake={() => handleStakeClick(pool.id)}
              onHarvest={() => handleHarvest(pool.id)}
              onWithdraw={() => handleWithdrawClick(pool.id)}
            />
          ))}
        </div>
      )}
      
      {/* Stake Modal */}
      {stakeModalOpen && selectedPool !== null && (
        <div className="modal-overlay" onClick={() => !isProcessing && setStakeModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stake Tokens</h3>
              <button 
                className="close-button" 
                onClick={() => !isProcessing && setStakeModalOpen(false)}
                disabled={isProcessing}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleStakeSubmit}>
              <div className="form-group">
                <label>Amount to Stake</label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.000001"
                  min="0"
                  required
                  disabled={isProcessing}
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="button secondary-button"
                  onClick={() => !isProcessing && setStakeModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button primary-button"
                  disabled={!stakeAmount || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Stake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Withdraw Modal */}
      {withdrawModalOpen && selectedPool !== null && (
        <div className="modal-overlay" onClick={() => !isProcessing && setWithdrawModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw Tokens</h3>
              <button 
                className="close-button" 
                onClick={() => !isProcessing && setWithdrawModalOpen(false)}
                disabled={isProcessing}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleWithdrawSubmit}>
              <div className="form-group">
                <label>Amount to Withdraw</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.000001"
                  min="0"
                  required
                  disabled={isProcessing}
                />
                <div className="balance-info">
                  Your stake: {parseFloat(useFarmStore.getState().userStakes[selectedPool] || '0').toFixed(6)}
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="button secondary-button"
                  onClick={() => !isProcessing && setWithdrawModalOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="button primary-button"
                  disabled={!withdrawAmount || isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Withdraw'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farms; 