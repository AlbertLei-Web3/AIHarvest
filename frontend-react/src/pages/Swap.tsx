import React, { useState, useEffect } from 'react';
import { useFarmStore } from '../store';
import useContracts from '../hooks/useContracts';
import { ethers } from 'ethers';
import { TokenInfo } from '../types';
import { ArrowDownIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

interface SwapFormProps {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  onTokenChange: (type: 'from' | 'to', token: TokenInfo) => void;
}

const Swap: React.FC = () => {
  const { isConnected, account, tokens } = useFarmStore();
  
  // Mock token list - would be fetched from a contract or API in a real implementation
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([
    { 
      address: '0x1111111111111111111111111111111111111111', 
      name: 'Ethereum', 
      symbol: 'ETH', 
      decimals: 18, 
      balance: '2.5' 
    },
    { 
      address: '0x2222222222222222222222222222222222222222', 
      name: 'AI Token', 
      symbol: 'AI', 
      decimals: 18, 
      balance: '10000' 
    },
    { 
      address: '0x3333333333333333333333333333333333333333', 
      name: 'Tether USD', 
      symbol: 'USDT', 
      decimals: 6, 
      balance: '500' 
    }
  ]);
  
  const [fromToken, setFromToken] = useState<TokenInfo>(availableTokens[0]);
  const [toToken, setToToken] = useState<TokenInfo>(availableTokens[1]);
  const [fromAmount, setFromAmount] = useState<string>('');
  const [toAmount, setToAmount] = useState<string>('');
  const [swapRate, setSwapRate] = useState<string>('1 ETH = 1000 AI');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default slippage
  
  useEffect(() => {
    if (tokens.length > 0) {
      setAvailableTokens(tokens);
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
    }
  }, [tokens]);
  
  const handleFromTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value;
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setFromToken(token);
      updateSwapRate(token, toToken);
    }
  };

  const handleToTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value;
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      setToToken(token);
      updateSwapRate(fromToken, token);
    }
  };

  const handleFromAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFromAmount(value);
    
    // Mock calculation - would use actual exchange rate in real app
    if (value && !isNaN(parseFloat(value))) {
      if (fromToken.symbol === 'ETH' && toToken.symbol === 'AI') {
        setToAmount((parseFloat(value) * 1000).toString());
      } else if (fromToken.symbol === 'AI' && toToken.symbol === 'ETH') {
        setToAmount((parseFloat(value) / 1000).toString());
      } else {
        setToAmount(value); // 1:1 for simplicity
      }
    } else {
      setToAmount('');
    }
  };

  const updateSwapRate = (from: TokenInfo, to: TokenInfo) => {
    // Mock rates - would use oracle or liquidity pool data in real app
    if (from.symbol === 'ETH' && to.symbol === 'AI') {
      setSwapRate('1 ETH = 1000 AI');
    } else if (from.symbol === 'AI' && to.symbol === 'ETH') {
      setSwapRate('1000 AI = 1 ETH');
    } else if (from.symbol === 'ETH' && to.symbol === 'USDT') {
      setSwapRate('1 ETH = 1800 USDT');
    } else if (from.symbol === 'USDT' && to.symbol === 'ETH') {
      setSwapRate('1800 USDT = 1 ETH');
    } else if (from.symbol === 'AI' && to.symbol === 'USDT') {
      setSwapRate('1 AI = 1.8 USDT');
    } else if (from.symbol === 'USDT' && to.symbol === 'AI') {
      setSwapRate('1.8 USDT = 1 AI');
    } else {
      setSwapRate(`1 ${from.symbol} = 1 ${to.symbol}`);
    }
    
    // Update to amount based on new rate
    if (fromAmount) {
      handleFromAmountChange({ target: { value: fromAmount } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    // Swap amounts too
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    
    updateSwapRate(toToken, fromToken);
  };

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || parseFloat(fromAmount) <= 0) return;
    
    try {
      useFarmStore.getState().setLoading(true);
      
      // In a real implementation, this would call the contract swap method
      console.log(`Swapping ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
      
      // Mock successful swap
      setTimeout(() => {
        // Reset form
        setFromAmount('');
        setToAmount('');
        
        // Show success message
        useFarmStore.getState().setError(null);
        alert(`Successfully swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
        
        useFarmStore.getState().setLoading(false);
      }, 2000);
      
    } catch (err: any) {
      console.error('Error swapping tokens:', err);
      useFarmStore.getState().setError(err.message || 'Failed to swap tokens');
      useFarmStore.getState().setLoading(false);
    }
  };

  const getSelectedTokenBalance = (token: TokenInfo) => {
    return token.balance || '0';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Swap Tokens</h1>
        <p className="text-gray-600">
          Exchange tokens at the best rates with lowest fees
        </p>
      </div>
      
      {!isConnected ? (
        <div className="text-center py-16">
          <h3 className="text-xl font-medium text-gray-600">Please connect your wallet</h3>
          <p className="mt-2 text-gray-500">Connect your wallet to use the swap feature</p>
        </div>
      ) : (
        <div className="card p-6">
          {/* From Token */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-700">From</label>
              <div className="text-sm text-gray-600">
                Balance: {getSelectedTokenBalance(fromToken)} {fromToken.symbol}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="number"
                className="input flex-grow"
                placeholder="0.0"
                value={fromAmount}
                onChange={handleFromAmountChange}
              />
              
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={fromToken.address}
                onChange={handleFromTokenChange}
              >
                {availableTokens.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button 
              onClick={handleSwapTokens}
              className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* To Token */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-700">To</label>
              <div className="text-sm text-gray-600">
                Balance: {getSelectedTokenBalance(toToken)} {toToken.symbol}
              </div>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="number"
                className="input flex-grow bg-gray-50"
                placeholder="0.0"
                value={toAmount}
                disabled
              />
              
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={toToken.address}
                onChange={handleToTokenChange}
              >
                {availableTokens.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Exchange Rate */}
          <div className="text-center text-sm text-gray-500 mb-4">
            {swapRate}
          </div>
          
          {/* Slippage Settings */}
          <div className="mb-4">
            <div className="text-sm text-gray-700 mb-2">Slippage Tolerance</div>
            <div className="flex space-x-2">
              {[0.5, 1, 2, 5].map(value => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-2 py-1 text-sm rounded ${
                    slippage === value 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
          
          {/* Swap Button */}
          <button 
            className="btn btn-primary w-full py-3"
            onClick={handleSwap}
            disabled={!fromAmount || parseFloat(fromAmount) <= 0}
          >
            Swap
          </button>
        </div>
      )}
    </div>
  );
};

export default Swap; 