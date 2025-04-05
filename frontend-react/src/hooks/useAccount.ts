import { useState, useEffect } from 'react';
import { useFarmStore } from '../store';

interface UseAccountReturn {
  account: string | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

/**
 * Hook for managing wallet account connection
 */
const useAccount = (): UseAccountReturn => {
  const { 
    account: storeAccount, 
    setAccount,
    isConnected: storeIsConnected,
    setConnected
  } = useFarmStore();
  
  /**
   * Connect wallet using Web3 provider
   */
  const connectWallet = async (): Promise<void> => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        const account = accounts[0];
        setAccount(account);
        setConnected(true);
        
        // Handle account changes
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            disconnectWallet();
          } else {
            setAccount(accounts[0]);
          }
        });
        
        // Handle chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
        
      } catch (error) {
        console.error('Error connecting to wallet:', error);
      }
    } else {
      console.error('No Ethereum provider detected');
      alert('Please install MetaMask or another Web3 wallet to use this application');
    }
  };
  
  /**
   * Disconnect wallet
   */
  const disconnectWallet = (): void => {
    setAccount(null);
    setConnected(false);
  };
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && storeIsConnected) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setConnected(true);
          } else {
            disconnectWallet();
          }
        } catch (error) {
          console.error('Error checking connection:', error);
          disconnectWallet();
        }
      }
    };
    
    checkConnection();
  }, [storeIsConnected, setAccount, setConnected]);
  
  return {
    account: storeAccount,
    isConnected: storeIsConnected,
    connectWallet,
    disconnectWallet
  };
};

export default useAccount; 