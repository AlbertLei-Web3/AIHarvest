import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Add window ethereum interface
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface UseWeb3Return {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

const useWeb3 = (): UseWeb3Return => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the provider
  useEffect(() => {
    if (window.ethereum) {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(ethersProvider);
    }
  }, []);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setIsConnected(false);
    } else {
      setAccount(accounts[0]);
      setIsConnected(true);
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((chainIdHex: string) => {
    setChainId(parseInt(chainIdHex, 16));
  }, []);

  // Setup listeners
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  // Check initial connection
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum && provider) {
        try {
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
            
            const network = await provider.getNetwork();
            setChainId(network.chainId);
            
            const ethersSigner = provider.getSigner();
            setSigner(ethersSigner);
          }
        } catch (error) {
          console.error('Error checking connection:', error);
        }
      }
    };

    checkConnection();
  }, [provider]);

  // Connect to wallet
  const connect = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    if (!provider) {
      setError('Provider not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        const network = await provider.getNetwork();
        setChainId(network.chainId);
        
        const ethersSigner = provider.getSigner();
        setSigner(ethersSigner);
      }
    } catch (error: any) {
      console.error('Error connecting to wallet:', error);
      setError(error.message || 'Failed to connect to wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from wallet
  const disconnect = () => {
    setAccount(null);
    setIsConnected(false);
    setSigner(null);
  };

  return {
    provider,
    signer,
    account,
    chainId,
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
  };
};

export default useWeb3; 