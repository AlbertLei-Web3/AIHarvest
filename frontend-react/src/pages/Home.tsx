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
      
      {/* Trading Pairs Section - With text and card positions swapped */}
      <section className="trading-pairs-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <h2 className="section-title">Available Trading Pairs</h2>
          <div className="trading-pairs-content">
            {/* Card now appears first in the DOM but will display on the left due to flex-direction: row-reverse in CSS */}
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
            <div className="trading-pairs-info">
              <p>
                AI Harvest currently supports trading between AIH and USDC tokens on the Sepolia testnet.
                Our SimpleSwapRouter provides a straightforward way to exchange these tokens with minimal fees.
              </p>
              <p>
                By using the AIH-USDC trading pair, you can easily convert between tokens for various use cases
                within the AI Harvest ecosystem.
              </p>
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
      
      {/* CTA Section with Better Spacing */}
      <section className="cta-section">
        <div className="gradient-background">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Swapping?</h2>
            <p>Experience the simplicity and efficiency of our SimpleSwapRouter for fast, secure token exchanges.</p>
            <div className="cta-buttons">
              <Link to="/swap" className="button primary-button">
                Go to Swap
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Simple Footer with just logo and social links */}
      <footer className="simple-footer">
        <div className="footer-content">
          <div className="footer-branding">
            <h3 className="gradient-text">AI Harvest</h3>
            <p>A modern DeFi platform for true token swapping and liquidity innovation.</p>
          </div>
          
          <div className="social-links-row">
            <a href="#" aria-label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </a>
            <a href="#" aria-label="Discord">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0-6-5-8-9-8s-9 2-9 8c0 4 2 7 4 8s5-2 5-2 3 3 5 2 4-4 4-8z"></path>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="15" cy="10" r="1"></circle>
              </svg>
            </a>
            <a href="#" aria-label="Github">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 