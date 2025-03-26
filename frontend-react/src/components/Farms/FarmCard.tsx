import React, { useState } from 'react';
import { FarmCardProps } from '../../types';

const FarmCard: React.FC<FarmCardProps> = ({
  poolId,
  poolInfo,
  userInfo,
  onDeposit,
  onWithdraw,
  onCompound,
}) => {
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [isCompounding, setIsCompounding] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsDepositing(true);
    try {
      await onDeposit(poolId, depositAmount);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    setIsWithdrawing(true);
    try {
      await onWithdraw(poolId, withdrawAmount);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdraw error:', error);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleCompound = async () => {
    setIsCompounding(true);
    try {
      await onCompound(poolId);
    } catch (error) {
      console.error('Compound error:', error);
    } finally {
      setIsCompounding(false);
    }
  };

  // Check if user has staked tokens
  const hasStaked = userInfo && parseFloat(userInfo.amount) > 0;
  
  // Check if there are pending rewards
  const hasPendingRewards = userInfo && parseFloat(userInfo.pendingRewards) > 0;
  
  // Format APR with 2 decimal places
  const formattedAPR = poolInfo.apr.toFixed(2);

  return (
    <div className="farm-card">
      <div className="farm-card-header">
        <h3>{poolInfo.name}</h3>
        <div className="farm-card-tag">
          <span>APR: {formattedAPR}%</span>
        </div>
      </div>
      
      <div className="farm-card-body">
        <div className="farm-stats">
          <div className="stat-item">
            <span className="stat-label">Total Staked</span>
            <span className="stat-value">{parseFloat(poolInfo.totalStaked).toFixed(4)} {poolInfo.symbol}</span>
          </div>
          
          {userInfo && (
            <div className="stat-item">
              <span className="stat-label">Your Stake</span>
              <span className="stat-value">{parseFloat(userInfo.amount).toFixed(4)} {poolInfo.symbol}</span>
            </div>
          )}
          
          {userInfo && (
            <div className="stat-item">
              <span className="stat-label">Pending Rewards</span>
              <span className="stat-value">{parseFloat(userInfo.pendingRewards).toFixed(4)}</span>
            </div>
          )}
        </div>
        
        <div className="farm-actions">
          <div className="tab-buttons">
            <button 
              className={`tab-button ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              Deposit
            </button>
            <button 
              className={`tab-button ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >
              Withdraw
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'deposit' ? (
              <div className="deposit-form">
                <div className="input-group">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder={`Amount in ${poolInfo.symbol}`}
                    min="0"
                    step="0.01"
                  />
                  <button 
                    onClick={() => setDepositAmount('100')} // Example max value, would be replaced with actual balance
                    className="max-button"
                  >
                    MAX
                  </button>
                </div>
                <button 
                  onClick={handleDeposit} 
                  disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="action-button"
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </button>
              </div>
            ) : (
              <div className="withdraw-form">
                <div className="input-group">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Amount in ${poolInfo.symbol}`}
                    min="0"
                    step="0.01"
                    disabled={!hasStaked}
                  />
                  <button 
                    onClick={() => hasStaked && setWithdrawAmount(userInfo.amount)} 
                    className="max-button"
                    disabled={!hasStaked}
                  >
                    MAX
                  </button>
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || !hasStaked}
                  className="action-button"
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </div>
            )}
          </div>
          
          {hasPendingRewards && (
            <button 
              onClick={handleCompound}
              disabled={isCompounding || !hasPendingRewards}
              className="compound-button"
            >
              {isCompounding ? 'Compounding...' : 'Compound Rewards'}
            </button>
          )}
        </div>
      </div>
      
      <div className="farm-card-footer">
        <a 
          href={`https://etherscan.io/address/${poolInfo.lpToken}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="view-token-link"
        >
          View Token
        </a>
      </div>
    </div>
  );
};

export default FarmCard; 