import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAccount from '../../hooks/useAccount';
import './Header.css';

const Header: React.FC = () => {
  const { account, isConnected, connectWallet, disconnectWallet } = useAccount();
  const location = useLocation();
  
  return (
    <header className="site-header">
      <div className="container">
        <div className="header-content">
          <div className="logo-area">
            <Link to="/" className="site-logo">
              <span className="gradient-text">AI Harvest</span>
            </Link>
          </div>
          
          <nav className="main-nav">
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/farms" 
                  className={`nav-link ${location.pathname === '/farms' ? 'active' : ''}`}
                >
                  Farms
                </Link>
              </li>
              <li>
                <Link 
                  to="/staking" 
                  className={`nav-link ${location.pathname === '/staking' ? 'active' : ''}`}
                >
                  Staking
                </Link>
              </li>
              <li>
                <Link 
                  to="/swap" 
                  className={`nav-link ${location.pathname === '/swap' ? 'active' : ''}`}
                >
                  Swap
                </Link>
              </li>
            </ul>
          </nav>
          
          <div className="wallet-area">
            {isConnected ? (
              <div className="wallet-connected">
                <span className="wallet-address">
                  {account ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : ''}
                </span>
                <button onClick={disconnectWallet} className="button disconnect-button">
                  Disconnect
                </button>
              </div>
            ) : (
              <button onClick={connectWallet} className="button connect-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 12h.01"></path>
                  <path d="M13 12h.01"></path>
                  <path d="M10 12h.01"></path>
                </svg>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 