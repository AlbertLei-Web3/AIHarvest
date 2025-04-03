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
  const { isConnected, account, tokens, isLoading } = useFarmStore();
  const { 
    simpleSwap, 
    simpleSwapRouterContract,
    getSimpleSwapOutputAmount, 
    getTokenInfo, 
    getSimpleSwapInfo 
  } = useContracts();
  
  // Use actual deployed token addresses from environment variables
  const AIH_TOKEN_ADDRESS = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '0xFcB512f45172aa1e331D926321eaA1C52D7dce8E';
  const USDC_TOKEN_ADDRESS = process.env.REACT_APP_USDC_TOKEN_ADDRESS || '0xB35B48631b69478f28E4365CC1794E378Ad0FA02';
  
  // Initial token list with actual deployed tokens
  const [availableTokens, setAvailableTokens] = useState<TokenInfo[]>([
    { 
      address: AIH_TOKEN_ADDRESS, 
      name: 'AI Harvest Token', 
      symbol: 'AIH', 
      decimals: 18, 
      balance: '0' 
    },
    { 
      address: USDC_TOKEN_ADDRESS, 
      name: 'USD Coin', 
      symbol: 'USDC', 
      decimals: 18, 
      balance: '0' 
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
  const [exchangeRates, setExchangeRates] = useState<Map<string, string>>(new Map());
  const [isWhitelistEnabled, setIsWhitelistEnabled] = useState<boolean>(false);
  const [whitelistedTokens, setWhitelistedTokens] = useState<Map<string, boolean>>(new Map());
  
  // Load token balances when connected
  useEffect(() => {
    const loadTokensInfo = async () => {
      if (isConnected) {
        const updatedTokens = [...availableTokens];
        
        for (let i = 0; i < updatedTokens.length; i++) {
          const tokenInfo = await getTokenInfo(updatedTokens[i].address);
          if (tokenInfo) {
            updatedTokens[i] = {
              ...updatedTokens[i],
              name: tokenInfo.name,
              symbol: tokenInfo.symbol,
              decimals: tokenInfo.decimals,
              balance: tokenInfo.balance
            };
          }
        }
        
        setAvailableTokens(updatedTokens);
        if (updatedTokens.length > 0) {
          setFromToken(updatedTokens[0]);
          setToToken(updatedTokens[1]);
        }
      }
    };
    
    loadTokensInfo();
  }, [isConnected, getTokenInfo]);
  
  // Fetch swap info when router address changes
  useEffect(() => {
    const fetchSwapInfo = async () => {
      if (simpleSwapRouterContract) {
        const info = await getSimpleSwapInfo();
        if (info) {
          setLpFee((parseFloat(info.lpFee) / 100).toString());
          setProtocolFee((parseFloat(info.protocolFee) / 100).toString());
        }
        
        // Get whitelist status
        try {
          const status = await simpleSwapRouterContract.whitelistEnabled();
          setIsWhitelistEnabled(status);
          
          // Check if tokens are whitelisted
          const newWhitelistedTokens = new Map<string, boolean>();
          for (const token of availableTokens) {
            const isWhitelisted = await simpleSwapRouterContract.whitelistedTokens(token.address);
            newWhitelistedTokens.set(token.address, isWhitelisted);
          }
          setWhitelistedTokens(newWhitelistedTokens);
          
          // Get exchange rates
          const newExchangeRates = new Map<string, string>();
          for (let i = 0; i < availableTokens.length; i++) {
            for (let j = 0; j < availableTokens.length; j++) {
              if (i !== j) {
                const rate = await simpleSwapRouterContract.exchangeRates(
                  availableTokens[i].address, 
                  availableTokens[j].address
                );
                const key = `${availableTokens[i].address}-${availableTokens[j].address}`;
                newExchangeRates.set(key, ethers.utils.formatEther(rate));
              }
            }
          }
          setExchangeRates(newExchangeRates);
        } catch (err) {
          console.error('Error fetching swap configuration:', err);
        }
      }
    };
    
    fetchSwapInfo();
  }, [simpleSwapRouterContract, getSimpleSwapInfo, availableTokens]);
  
  // Get output amount when input changes
  useEffect(() => {
    const getOutput = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0 || !simpleSwapRouterContract || !fromToken || !toToken) {
        setToAmount('');
        return;
      }
      
      try {
        const outputAmount = await getSimpleSwapOutputAmount(
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
  }, [fromAmount, fromToken, toToken, simpleSwapRouterContract, getSimpleSwapOutputAmount]);
  
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
    if (!isConnected || !fromAmount || parseFloat(fromAmount) <= 0 || !simpleSwapRouterContract) {
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
      
      // Check whitelist if enabled
      if (isWhitelistEnabled) {
        const isFromTokenWhitelisted = whitelistedTokens.get(fromToken.address);
        const isToTokenWhitelisted = whitelistedTokens.get(toToken.address);
        
        if (!isFromTokenWhitelisted || !isToTokenWhitelisted) {
          useFarmStore.getState().setError('One or both tokens are not whitelisted');
          return;
        }
      }
      
      // Perform the swap
      const tx = await simpleSwap(fromToken.address, toToken.address, fromAmount);
      
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
          
          // Update local state
          const updatedTokens = availableTokens.map(token => 
            token.address === fromToken.address 
              ? { ...token, balance: updatedFromToken.balance } 
              : token
          );
          setAvailableTokens(updatedTokens);
          setFromToken(updatedFromToken);
        }
        
        if (updatedToToken) {
          useFarmStore.getState().updateTokenBalance(toToken.address, updatedToToken.balance);
          
          // Update local state
          const updatedTokens = availableTokens.map(token => 
            token.address === toToken.address 
              ? { ...token, balance: updatedToToken.balance } 
              : token
          );
          setAvailableTokens(updatedTokens);
          setToToken(updatedToToken);
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
        <h1 className="text-3xl font-bold mb-4">SimpleSwap Exchange</h1>
        <p className="text-gray-600">
          Swap AIH ⇄ USDC with low fees ({lpFee}% LP, {protocolFee}% protocol)
        </p>
        {isWhitelistEnabled && (
          <div className="mt-2 text-sm text-blue-600">
            Whitelist protection enabled - only whitelisted tokens can be swapped
          </div>
        )}
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
            
            {isWhitelistEnabled && !whitelistedTokens.get(fromToken.address) && (
              <div className="mt-1 text-red-500 text-xs">This token is not whitelisted</div>
            )}
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
            
            {isWhitelistEnabled && !whitelistedTokens.get(toToken.address) && (
              <div className="mt-1 text-red-500 text-xs">This token is not whitelisted</div>
            )}
          </div>
          
          {/* Price and slippage info */}
          {swapRate && (
            <div className="bg-gray-50 rounded-md p-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Exchange Rate</span>
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
            disabled={
              !fromAmount || 
              parseFloat(fromAmount) <= 0 || 
              !toAmount || 
              parseFloat(toAmount) <= 0 || 
              isLoading ||
              (isWhitelistEnabled && (!whitelistedTokens.get(fromToken.address) || !whitelistedTokens.get(toToken.address)))
            }
          >
            {isLoading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Swap; 