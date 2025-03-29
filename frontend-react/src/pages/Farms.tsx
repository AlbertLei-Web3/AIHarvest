import React, { useEffect, useState, useCallback } from 'react';
import { useFarmStore } from '../store';
import useContracts from '../hooks/useContracts';
import useWeb3 from '../hooks/useWeb3';

// FarmCard component to display individual farm information
const FarmCard = ({ 
  pool, 
  userStake, 
  pendingReward, 
  onStake, 
  onHarvest 
}: { 
  pool: any; 
  userStake: string; 
  pendingReward: string; 
  onStake: () => void; 
  onHarvest: () => void;
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
    <div className="card mb-4 h-100 position-relative overflow-hidden">
      {/* APR Badge */}
      <div className="position-absolute top-0 end-0 bg-success text-white fw-bold px-3 py-1 m-2 rounded-pill">
        APR: {pool.apr}%
      </div>
      
      <div className="card-body d-flex flex-column">
        <h5 className="card-title mb-3 d-flex align-items-center">
          {pool.name || `Pool ${pool.id}`}
          {parseFloat(userStake) > 0 && (
            <span className="badge bg-primary ms-2">Staked</span>
          )}
        </h5>
        
        <div className="mb-4">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Staking Token</span>
            <span className="fw-medium">{pool.symbol}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Reward Token</span>
            <span className="fw-medium">{pool.rewardSymbol || 'AI'}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted small">Total Staked</span>
            <span className="fw-medium">{formatNumber(pool.totalStaked)}</span>
          </div>
        </div>
        
        {parseFloat(userStake) > 0 && (
          <div className="p-3 bg-light rounded mb-4">
            <div className="d-flex justify-content-between mb-1">
              <span className="text-muted small">Your Stake</span>
              <span className="fw-medium">{formatNumber(userStake)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted small">Pending Rewards</span>
              <span className="fw-medium text-success">{formatNumber(pendingReward)}</span>
            </div>
            
            {/* Progress bar showing user's percentage of the pool */}
            <div className="mt-2">
              <div className="d-flex justify-content-between small mb-1">
                <span>Pool Share</span>
                <span>{stakePercentage.toFixed(2)}%</span>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${stakePercentage}%` }}
                  aria-valuenow={stakePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-auto">
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center"
              onClick={onStake}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-in-down me-1" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1h-2z"/>
                <path fillRule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              {parseFloat(userStake) > 0 ? 'Manage' : 'Stake'}
            </button>
            <button 
              className="btn btn-success flex-grow-1 d-flex align-items-center justify-content-center"
              onClick={onHarvest}
              disabled={Number(pendingReward) <= 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-harvest me-1" viewBox="0 0 16 16">
                <path d="M8 1a.5.5 0 0 1 .5.5v5.5h5.5a.5.5 0 0 1 0 1h-5.5V14a.5.5 0 0 1-1 0V8.5H2a.5.5 0 0 1 0-1h5.5V2a.5.5 0 0 1 .5-.5z"/>
              </svg>
              Harvest
            </button>
          </div>
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
    getRewardTokenSymbol 
  } = useContracts();
  
  const { pools, setUserStake, setPendingReward, setPoolInfo } = useFarmStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('apr');
  
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
          });
          
          // If user is connected, fetch their stake info
          if (account) {
            const userInfo = await getUserInfo(pool.id, account);
            if (userInfo) {
              setUserStake(pool.id, userInfo.amount);
              setPendingReward(pool.id, userInfo.pendingReward);
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
  }, [isConnected, account, getPools, getUserInfo, getStakingTokenSymbol, getRewardTokenSymbol, setPoolInfo, setUserStake, setPendingReward]);
  
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
  
  const handleStake = (poolId: number) => {
    // In a real app, you would open a modal with a staking form
    alert(`Stake in pool ${poolId}`);
  };
  
  const handleHarvest = async (poolId: number) => {
    // In a real app, you would call the harvest function from the contract
    alert(`Harvest from pool ${poolId}`);
    
    // Update pending rewards after harvest
    setTimeout(updatePendingRewards, 2000);
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
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading farms data...</p>
        </div>
      </div>
    );
  }
  
  if (!isConnected) {
    return (
      <div className="container mt-5">
        <div className="text-center py-5">
          <div className="alert alert-info mx-auto" style={{ maxWidth: '500px' }} role="alert">
            <h4 className="alert-heading mb-3">Connect Your Wallet</h4>
            <p>Please connect your wallet to view available farms and start earning rewards.</p>
            <hr />
            <p className="mb-0">Once connected, you'll be able to stake tokens and earn AI rewards.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mt-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-2">Yield Farms</h1>
          <p className="text-muted">Stake tokens to earn AI rewards with AI-powered strategies</p>
        </div>
        
        <div className="d-flex mt-3 mt-md-0">
          <div className="position-relative me-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search farms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search position-absolute text-muted" style={{ right: '10px', top: '10px' }} viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </div>
          
          <select 
            className="form-select" 
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
        <div className="alert alert-warning text-center py-4" role="alert">
          <p className="mb-0">No farms match your search criteria.</p>
        </div>
      ) : (
        <div className="row">
          {filteredAndSortedPools.map((pool) => (
            <div className="col-md-6 col-lg-4 mb-4" key={pool.id}>
              <FarmCard
                pool={pool}
                userStake={useFarmStore.getState().userStakes[pool.id] || '0'}
                pendingReward={useFarmStore.getState().pendingRewards[pool.id] || '0'}
                onStake={() => handleStake(pool.id)}
                onHarvest={() => handleHarvest(pool.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Farms; 