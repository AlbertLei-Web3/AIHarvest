import React, { useState, useEffect } from 'react';
import { useFarmStore } from '../store';
import useContracts from '../hooks/useContracts';
import { ethers } from 'ethers';

const Staking: React.FC = () => {
  const { 
    pools, 
    userStakeInfo, 
    isConnected, 
    isLoading, 
    account,
    pendingRewards 
  } = useFarmStore();
  
  const { 
    deposit, 
    withdraw, 
    compound 
  } = useContracts();
  
  const [stakeAmount, setStakeAmount] = useState<string>('0');
  const [stakePercentage, setStakePercentage] = useState<number>(0);
  const [unstakeAmount, setUnstakeAmount] = useState<string>('0');
  const [unstakePercentage, setUnstakePercentage] = useState<number>(0);
  const [selectedPool, setSelectedPool] = useState<number>(0);
  
  // Mock data - would be replaced with actual values from contracts
  const tokenBalance = '1000.00';
  const stakedBalance = userStakeInfo[selectedPool]?.amount || '0';
  const pendingReward = pendingRewards[selectedPool] || '0';
  const stakingAPR = pools[selectedPool]?.apr || '0';
  
  useEffect(() => {
    if (pools.length > 0 && selectedPool >= pools.length) {
      setSelectedPool(0);
    }
  }, [pools, selectedPool]);

  const handleStakeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setStakePercentage(value);
    setStakeAmount(((parseFloat(tokenBalance) * value) / 100).toFixed(2));
  };

  const handleStakeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStakeAmount(value);
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parseFloat(tokenBalance) > 0) {
      setStakePercentage((parsedValue / parseFloat(tokenBalance)) * 100);
    } else {
      setStakePercentage(0);
    }
  };

  const handleUnstakeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setUnstakePercentage(value);
    setUnstakeAmount(((parseFloat(stakedBalance) * value) / 100).toFixed(2));
  };

  const handleUnstakeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUnstakeAmount(value);
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && parseFloat(stakedBalance) > 0) {
      setUnstakePercentage((parsedValue / parseFloat(stakedBalance)) * 100);
    } else {
      setUnstakePercentage(0);
    }
  };

  const handleMaxStake = () => {
    setStakeAmount(tokenBalance);
    setStakePercentage(100);
  };

  const handleMaxUnstake = () => {
    setUnstakeAmount(stakedBalance);
    setUnstakePercentage(100);
  };

  const handleStake = async () => {
    if (!isConnected || parseFloat(stakeAmount) <= 0) return;
    
    try {
      useFarmStore.getState().setLoading(true);
      const tx = await deposit(selectedPool, ethers.utils.parseEther(stakeAmount).toString());
      if (tx) {
        await tx.wait();
        // Reset form
        setStakeAmount('0');
        setStakePercentage(0);
      }
    } catch (err: any) {
      console.error('Error staking:', err);
      useFarmStore.getState().setError(err.message || 'Failed to stake');
    } finally {
      useFarmStore.getState().setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!isConnected || parseFloat(unstakeAmount) <= 0) return;
    
    try {
      useFarmStore.getState().setLoading(true);
      const tx = await withdraw(selectedPool, ethers.utils.parseEther(unstakeAmount).toString());
      if (tx) {
        await tx.wait();
        // Reset form
        setUnstakeAmount('0');
        setUnstakePercentage(0);
      }
    } catch (err: any) {
      console.error('Error unstaking:', err);
      useFarmStore.getState().setError(err.message || 'Failed to unstake');
    } finally {
      useFarmStore.getState().setLoading(false);
    }
  };

  const handleHarvest = async () => {
    if (!isConnected) return;
    
    try {
      useFarmStore.getState().setLoading(true);
      const tx = await compound(selectedPool);
      if (tx) {
        await tx.wait();
      }
    } catch (err: any) {
      console.error('Error harvesting:', err);
      useFarmStore.getState().setError(err.message || 'Failed to harvest');
    } finally {
      useFarmStore.getState().setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Staking</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Stake your tokens to earn rewards. Our AI-powered strategies optimize your staking returns automatically.
        </p>
      </div>
      
      {!isConnected ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium text-gray-600">Please connect your wallet</h3>
          <p className="mt-2 text-gray-500">Connect your wallet to view staking options</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Staking Info Card */}
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Your Staking Info</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className="text-xl font-medium">{tokenBalance} AI</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Staked Balance</p>
                  <p className="text-xl font-medium">{stakedBalance} AI</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Pending Rewards</p>
                  <p className="text-xl font-medium text-secondary-600">{pendingReward} AI</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">APR</p>
                  <p className="text-xl font-medium text-primary-600">{stakingAPR}%</p>
                </div>
                
                <button 
                  className="btn btn-primary w-full"
                  onClick={handleHarvest}
                  disabled={parseFloat(pendingReward) <= 0}
                >
                  Harvest Rewards
                </button>
              </div>
            </div>
          </div>
          
          {/* Stake Card */}
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Stake Tokens</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-700">Amount to Stake</label>
                  <button 
                    className="text-sm text-primary-600 hover:text-primary-700"
                    onClick={handleMaxStake}
                  >
                    MAX
                  </button>
                </div>
                
                <input
                  type="number"
                  className="input"
                  value={stakeAmount}
                  onChange={handleStakeInputChange}
                  placeholder="0.00"
                />
                
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stakePercentage}
                    onChange={handleStakeSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">0%</span>
                    <span className="text-xs text-gray-500">100%</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary w-full"
                  onClick={handleStake}
                  disabled={parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(tokenBalance)}
                >
                  Stake
                </button>
              </div>
            </div>
          </div>
          
          {/* Unstake Card */}
          <div className="card">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Unstake Tokens</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-700">Amount to Unstake</label>
                  <button 
                    className="text-sm text-primary-600 hover:text-primary-700"
                    onClick={handleMaxUnstake}
                  >
                    MAX
                  </button>
                </div>
                
                <input
                  type="number"
                  className="input"
                  value={unstakeAmount}
                  onChange={handleUnstakeInputChange}
                  placeholder="0.00"
                />
                
                <div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={unstakePercentage}
                    onChange={handleUnstakeSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">0%</span>
                    <span className="text-xs text-gray-500">100%</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary w-full"
                  onClick={handleUnstake}
                  disabled={parseFloat(unstakeAmount) <= 0 || parseFloat(unstakeAmount) > parseFloat(stakedBalance)}
                >
                  Unstake
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staking; 