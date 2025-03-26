import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ConnectWalletProps } from '../../types';

interface HeaderProps extends ConnectWalletProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title, onConnect, isConnected, walletAddress }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-text">AI <span>Harvest</span></span>
          </Link>

          <nav className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
            <ul className="nav-list">
              <li className="nav-item">
                <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/farms" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Farms
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/staking" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Staking
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/swap" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Swap
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/ai-assistant" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  AI Assistant
                </Link>
              </li>
            </ul>

            <div className="wallet-connect-mobile">
              <button
                className={`wallet-button ${isConnected ? 'connected' : ''}`}
                onClick={isConnected ? () => {} : onConnect}
              >
                {isConnected && walletAddress
                  ? formatWalletAddress(walletAddress)
                  : 'Connect Wallet'}
              </button>
            </div>

            <button className="close-menu" onClick={() => setIsMenuOpen(false)}>
              <span className="sr-only">Close menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </nav>

          <div className="header-actions">
            <div className="wallet-connect">
              <button
                className={`wallet-button ${isConnected ? 'connected' : ''}`}
                onClick={isConnected ? () => {} : onConnect}
              >
                {isConnected && walletAddress ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
                    </svg>
                    <span>{formatWalletAddress(walletAddress)}</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                      <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
                    </svg>
                    <span>Connect Wallet</span>
                  </>
                )}
              </button>
            </div>

            <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(true)}>
              <span className="sr-only">Open menu</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 