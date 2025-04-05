import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useContracts from '../hooks/useContracts';
import { ethers } from 'ethers';
import useAccount from '../hooks/useAccount';
import swapIllustration from '../assets/swap-illustration.svg';

const Home: React.FC = () => {
  const { account, isConnected } = useAccount();
  const { simpleSwapRouterContract, getTokenBalance } = useContracts();
  const [swapStats, setSwapStats] = useState({
    totalVolume: '0',
    liquidityPoolSize: '0',
    tradingPairs: '1', // Currently only AIH-USDC
    averageFee: '0'
  });
  
  useEffect(() => {
    const fetchRouterStats = async () => {
      if (simpleSwapRouterContract) {
        try {
          // Get fee information
          const lpFee = await simpleSwapRouterContract.lpFee();
          const protocolFee = await simpleSwapRouterContract.protocolFee();
          const totalFee = lpFee.add(protocolFee);
          
          // Get AIH-USDC liquidity data
          const aihAddress = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '';
          const usdcAddress = process.env.REACT_APP_USDC_TOKEN_ADDRESS || '';
          
          if (aihAddress && usdcAddress) {
            // Get liquidity pool size from both token balances in the contract
            if (simpleSwapRouterContract.address) {
              const aihBalance = await getTokenBalance(aihAddress, simpleSwapRouterContract.address);
              const usdcBalance = await getTokenBalance(usdcAddress, simpleSwapRouterContract.address);
              
              // Format the data for display
              setSwapStats({
                totalVolume: ethers.utils.formatEther(aihBalance.mul(2) || '0'),
                liquidityPoolSize: ethers.utils.formatEther(aihBalance.add(usdcBalance) || '0'),
                tradingPairs: '1',
                averageFee: (totalFee.toNumber() / 100).toString()
              });
            }
          }
        } catch (error) {
          console.error('Error fetching router stats:', error);
        }
      }
    };
    
    if (isConnected) {
      fetchRouterStats();
    }
  }, [simpleSwapRouterContract, getTokenBalance, isConnected]);
  
  return (
    <div className="home-page">
      {/* Hero Section with Gradient Background */}
      <section className="hero-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        
        <div className="container">
          <div className="hero-content">
            <h1>AI Harvest Swap</h1>
            <p className="hero-description">
              Fast, secure token swapping with SimpleSwapRouter. 
              Trade AIH and USDC with low fees and high liquidity.
            </p>
            
            <div className="hero-cta">
              <Link to="/swap" className="button primary-button">
                Start Swapping
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
              <Link to="/swap" className="button secondary-button">
                View Exchange Rates
              </Link>
            </div>
          </div>
          
          <div className="hero-image">
            <img src={swapIllustration} alt="AI Harvest Token Swap" />
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="stats-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Volume</h3>
              <p className="stat-value">{Number(swapStats.totalVolume).toLocaleString()} AIH</p>
            </div>
            <div className="stat-card">
              <h3>Active Liquidity</h3>
              <p className="stat-value">{Number(swapStats.liquidityPoolSize).toLocaleString()} Tokens</p>
            </div>
            <div className="stat-card">
              <h3>Trading Pairs</h3>
              <p className="stat-value">{swapStats.tradingPairs}</p>
            </div>
            <div className="stat-card">
              <h3>Average Fee</h3>
              <p className="stat-value">{swapStats.averageFee}%</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trading Pairs Section - Moved above features */}
      <section className="trading-pairs-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <div className="section-content">
            <h2 className="section-title">Available Trading Pairs</h2>
          </div>
          <div className="trading-pair-card">
            <div className="token-icons">
              <div className="token-icon">AIH</div>
              <div className="token-icon">USDC</div>
            </div>
            <h3>AIH-USDC</h3>
            <p className="pair-description">
              Trade between AI Harvest Token and USDC with competitive rates
            </p>
            <div className="pair-buttons">
              <Link to="/swap" className="button small-button primary-button">
                Swap
              </Link>
              <Link to="/swap" className="button small-button secondary-button">
                Add Liquidity
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <h2 className="section-title">SimpleSwapRouter Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </div>
              <h3>Simple Interface</h3>
              <p>Intuitive swap interface designed for both beginners and experienced traders.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3>Security First</h3>
              <p>Non-upgradeable design simplifies the codebase and reduces attack surface.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              </div>
              <h3>Fast Swaps</h3>
              <p>Optimized contract code ensures quick and efficient token swaps with minimal gas.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                  <line x1="12" y1="16" x2="12" y2="8"></line>
                </svg>
              </div>
              <h3>Add Liquidity</h3>
              <p>Provide liquidity to earn fees from trades in the AIH-USDC trading pair.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Getting Started Guide */}
      <section className="getting-started-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <h2 className="section-title">Getting Started</h2>
          
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Connect Your Wallet</h3>
              <p>Connect your MetaMask or other Ethereum wallet to get started.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Get AIH and USDC</h3>
              <p>Acquire AIH and USDC tokens on the Sepolia testnet.</p>
            </div>
            
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Start Trading</h3>
              <p>Use the Swap interface to exchange between AIH and USDC.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <h2>Ready to Start Swapping?</h2>
          <p>Experience the simplicity and efficiency of our SimpleSwapRouter.</p>
          <div className="cta-buttons">
            <Link to="/swap" className="button primary-button">
              Go to Swap
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 