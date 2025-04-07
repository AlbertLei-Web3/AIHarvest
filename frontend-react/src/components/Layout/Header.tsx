import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAccount from '../../hooks/useAccount';
import './Header.css';

// 更新于2023-10-22 16:15:30 - 重新设计标题栏，将标题和导航放在左侧，钱包按钮放在右侧
// Updated on 2023-10-22 16:15:30 - Redesigned header with title and navigation on the left, wallet button on the right

const Header: React.FC = () => {
  const location = useLocation();
  const { account, connectWallet, disconnectWallet, isConnected } = useAccount();
  
  // Function to determine if a link is active
  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };
  
  // Format account address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        <div className="left-section">
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
                  className={`nav-link ${isActiveLink('/') ? 'active' : ''}`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/farms" 
                  className={`nav-link ${isActiveLink('/farms') ? 'active' : ''}`}
                >
                  Farms
                </Link>
              </li>
              <li>
                <Link 
                  to="/staking" 
                  className={`nav-link ${isActiveLink('/staking') ? 'active' : ''}`}
                >
                  Staking
                </Link>
              </li>
              <li>
                <Link 
                  to="/swap" 
                  className={`nav-link ${isActiveLink('/swap') ? 'active' : ''}`}
                >
                  Swap
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="wallet-area">
          {isConnected && account ? (
            <div className="wallet-connected">
              <div className="wallet-address" title={account}>
                {formatAddress(account)}
              </div>
              <button 
                className="button disconnect-button" 
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              className="button connect-button" 
              onClick={connectWallet}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                <line x1="6" y1="12" x2="18" y2="12"></line>
              </svg>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 