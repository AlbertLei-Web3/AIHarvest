import { create } from 'zustand';
import { ethers } from 'ethers';
import { Web3State } from '../types';

interface Web3Store extends Web3State {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const useWeb3Store = create<Web3Store>((set) => ({
  connected: false,
  address: null,
  chainId: null,
  provider: null,
  signer: null,

  connect: async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        const signer = provider.getSigner();
        const address = accounts[0];
        const network = await provider.getNetwork();
        
        set({
          connected: true,
          address,
          chainId: network.chainId,
          provider,
          signer,
        });
      } else {
        console.error('No Ethereum provider found. Install MetaMask or another provider.');
      }
    } catch (error) {
      console.error('Error connecting to Ethereum wallet:', error);
    }
  },

  disconnect: () => {
    set({
      connected: false,
      address: null,
      chainId: null,
      provider: null,
      signer: null,
    });
  },
}));

export default useWeb3Store; 