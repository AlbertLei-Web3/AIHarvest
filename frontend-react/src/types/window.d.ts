interface Ethereum {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Ethereum;
  }
}

export {}; 