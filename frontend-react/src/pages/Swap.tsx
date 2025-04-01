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
  const { isConnected, account, tokens, swapRouterAddress, isLoading } = useFarmStore();
  const { swap, getSwapOutputAmount, getTokenInfo, getSwapInfo } = useContracts();
  
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
  const [swapRate, setSwapRate] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5% default slippage
  const [lpFee, setLpFee] = useState<string>('0.25'); // 0.25% default LP fee
  const [protocolFee, setProtocolFee] = useState<string>('0.05'); // 0.05% default protocol fee
  
  useEffect(() => {
    if (tokens.length > 0) {
      setAvailableTokens(tokens);
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
    }
  }, [tokens]);
  
  // Fetch swap info when router address changes
  useEffect(() => {
    const fetchSwapInfo = async () => {
      if (swapRouterAddress) {
        const info = await getSwapInfo();
        if (info) {
          setLpFee((parseFloat(info.lpFee) / 10).toString());
          setProtocolFee((parseFloat(info.protocolFee) / 10).toString());
        }
      }
    };
    
    fetchSwapInfo();
  }, [swapRouterAddress, getSwapInfo]);
  
  // Get output amount when input changes
  useEffect(() => {
    const getOutput = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !swapRouterAddress || !fromToken || !toToken) {
        setToAmount('');
        return;
      }
      
      try {
        const outputAmount = await getSwapOutputAmount(
          fromToken.address,
          toToken.address,
          fromAmount
        );
        
        setToAmount(outputAmount);
        
        // Update swap rate for display
        if (parseFloat(fromAmount) > 0) {
          const rate = parseFloat(outputAmount) / parseFloat(fromAmount);
          setSwapRate(`1 ${fromToken.symbol} ≈ ${rate.toFixed(6)} ${toToken.symbol}`);
        }
      } catch (err) {
        console.error('Error getting output amount:', err);
        setToAmount('');
      }
    };
    
    getOutput();
  }, [fromAmount, fromToken, toToken, swapRouterAddress, getSwapOutputAmount]);
  
  const handleFromTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value;
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      // Don't allow selecting the same token
      if (token.address === toToken.address) {
        handleSwapTokens();
        return;
      }
      
      setFromToken(token);
      setFromAmount(''); // Reset amount when token changes
      setToAmount('');
    }
  };

  const handleToTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = event.target.value;
    const token = availableTokens.find(t => t.address === tokenAddress);
    if (token) {
      // Don't allow selecting the same token
      if (token.address === fromToken.address) {
        handleSwapTokens();
        return;
      }
      
      setToToken(token);
      setToAmount(''); // Reset amount when token changes
    }
  };

  const handleFromAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    
    // Don't allow negative values
    if (value === '' || parseFloat(value) >= 0) {
      setFromAmount(value);
    }
  };

  const handleSwapTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    
    // Reset amounts
    setFromAmount('');
    setToAmount('');
  };

  const handleSwap = async () => {
    if (!isConnected || !fromAmount || parseFloat(fromAmount) <= 0 || !swapRouterAddress) {
      return;
    }
    
    try {
      useFarmStore.getState().setLoading(true);
      useFarmStore.getState().setError(null);
      
      // Check if user has enough balance
      const fromTokenBalance = parseFloat(fromToken.balance);
      const fromAmountValue = parseFloat(fromAmount);
      
      if (fromAmountValue > fromTokenBalance) {
        useFarmStore.getState().setError(`Insufficient ${fromToken.symbol} balance`);
        return;
      }
      
      // Perform the swap
      const tx = await swap(fromToken.address, toToken.address, fromAmount);
      
      if (tx) {
        // Wait for transaction to be mined
        await tx.wait();
        
        // Show success message
        alert(`Successfully swapped ${fromAmount} ${fromToken.symbol} for approximately ${toAmount} ${toToken.symbol}`);
        
        // Reset form
        setFromAmount('');
        setToAmount('');
        
        // Update token balances
        const updatedFromToken = await getTokenInfo(fromToken.address);
        const updatedToToken = await getTokenInfo(toToken.address);
        
        if (updatedFromToken) {
          useFarmStore.getState().updateTokenBalance(fromToken.address, updatedFromToken.balance);
        }
        
        if (updatedToToken) {
          useFarmStore.getState().updateTokenBalance(toToken.address, updatedToToken.balance);
        }
      }
    } catch (err: any) {
      console.error('Error swapping tokens:', err);
      useFarmStore.getState().setError(err.message || 'Failed to swap tokens');
    } finally {
      useFarmStore.getState().setLoading(false);
    }
  };

  const getSelectedTokenBalance = (token: TokenInfo) => {
    return token.balance || '0';
  };
  
  const getMaxAmount = () => {
    const balance = getSelectedTokenBalance(fromToken);
    setFromAmount(balance);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Swap Tokens</h1>
        <p className="text-gray-600">
          Exchange tokens at the best rates with low fees ({lpFee}% LP, {protocolFee}% protocol)
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
              <div className="text-sm text-gray-600 flex">
                <span>Balance: {getSelectedTokenBalance(fromToken)} {fromToken.symbol}</span>
                <button 
                  className="ml-2 text-blue-500 text-xs font-medium"
                  onClick={getMaxAmount}
                >
                  MAX
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <input
                type="number"
                className="input flex-grow"
                placeholder="0.0"
                value={fromAmount}
                onChange={handleFromAmountChange}
                disabled={isLoading}
              />
              
              <select
                className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                value={fromToken.address}
                onChange={handleFromTokenChange}
                disabled={isLoading}
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
              disabled={isLoading}
            >
              <ArrowsUpDownIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* To Token */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-700">To (estimated)</label>
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
                disabled={isLoading}
              >
                {availableTokens.map(token => (
                  <option key={token.address} value={token.address}>
                    {token.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Price and slippage info */}
          {swapRate && (
            <div className="bg-gray-50 rounded-md p-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Price</span>
                <span>{swapRate}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Fee</span>
                <span>{parseFloat(lpFee) + parseFloat(protocolFee)}% ({lpFee}% LP + {protocolFee}% protocol)</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Slippage Tolerance</span>
                <span>{slippage}%</span>
              </div>
            </div>
          )}
          
          {/* Swap Button */}
          <button
            className="btn-primary w-full py-3 rounded-md"
            onClick={handleSwap}
            disabled={!fromAmount || parseFloat(fromAmount) <= 0 || !toAmount || parseFloat(toAmount) <= 0 || isLoading}
          >
            {isLoading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Swap; 