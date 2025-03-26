import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Decentralized Yield Farming</h1>
            <p className="hero-description">
              Maximize your crypto assets with AI-powered yield farming strategies. 
              Stake, earn and compound rewards automatically with our intelligent DeFi platform.
            </p>
            
            <div className="hero-stats">
              <div className="stat-card">
                <h3>Total Value Locked</h3>
                <p className="stat-value">$10.5M</p>
                <div className="stat-trend up">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>7.2%</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>Total Farms</h3>
                <p className="stat-value">12</p>
                <div className="stat-trend up">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>3 new</span>
                </div>
              </div>
              <div className="stat-card">
                <h3>Average APR</h3>
                <p className="stat-value">24.6%</p>
                <div className="stat-trend up">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  <span>2.1%</span>
                </div>
              </div>
            </div>
            
            <div className="hero-cta">
              <Link to="/farms" className="button primary-button">
                Start Farming
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"></path>
                  <path d="M12 5l7 7-7 7"></path>
                </svg>
              </Link>
              <Link to="/swap" className="button secondary-button">
                Swap Tokens
              </Link>
            </div>
          </div>
          
          <div className="hero-image">
            <img src="/images/hero-illustration.svg" alt="AI-powered Yield Farming" />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose AI Harvest?</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3>Optimized Yields</h3>
              <p>Our AI-powered strategies continuously analyze market conditions to maximize your returns.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3>Multiple Pools</h3>
              <p>Diversify your assets across various farming pools with different risk-reward profiles.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <h3>Security First</h3>
              <p>Our smart contracts are audited by leading security firms to ensure the safety of your funds.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3>Auto-Compounding</h3>
              <p>Automatically reinvest your rewards to benefit from the power of compound interest.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Top Farms Section */}
      <section className="top-farms-section">
        <div className="container">
          <h2 className="section-title">Top Performing Farms</h2>
          
          <div className="farms-grid">
            <div className="farm-preview-card">
              <div className="farm-header">
                <div className="farm-tokens">
                  <div className="token-icon">ETH</div>
                  <div className="token-icon">USDC</div>
                </div>
                <h3>ETH-USDC</h3>
              </div>
              <div className="farm-stats">
                <div className="farm-stat">
                  <span className="stat-label">APR</span>
                  <span className="stat-value">32.5%</span>
                </div>
                <div className="farm-stat">
                  <span className="stat-label">TVL</span>
                  <span className="stat-value">$2.8M</span>
                </div>
              </div>
              <Link to="/farms" className="button farm-button">View Farm</Link>
            </div>
            
            <div className="farm-preview-card">
              <div className="farm-header">
                <div className="farm-tokens">
                  <div className="token-icon">BTC</div>
                  <div className="token-icon">ETH</div>
                </div>
                <h3>BTC-ETH</h3>
              </div>
              <div className="farm-stats">
                <div className="farm-stat">
                  <span className="stat-label">APR</span>
                  <span className="stat-value">28.7%</span>
                </div>
                <div className="farm-stat">
                  <span className="stat-label">TVL</span>
                  <span className="stat-value">$1.9M</span>
                </div>
              </div>
              <Link to="/farms" className="button farm-button">View Farm</Link>
            </div>
            
            <div className="farm-preview-card">
              <div className="farm-header">
                <div className="farm-tokens">
                  <div className="token-icon">DAI</div>
                  <div className="token-icon">USDT</div>
                </div>
                <h3>DAI-USDT</h3>
              </div>
              <div className="farm-stats">
                <div className="farm-stat">
                  <span className="stat-label">APR</span>
                  <span className="stat-value">18.2%</span>
                </div>
                <div className="farm-stat">
                  <span className="stat-label">TVL</span>
                  <span className="stat-value">$3.4M</span>
                </div>
              </div>
              <Link to="/farms" className="button farm-button">View Farm</Link>
            </div>
          </div>
          
          <div className="view-all-container">
            <Link to="/farms" className="view-all-link">
              View All Farms
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
        </div>
      </section>
      
      {/* AI Assistant Showcase */}
      <section className="ai-assistant-section">
        <div className="container">
          <div className="ai-assistant-content">
            <h2 className="section-title">AI-Powered Yield Strategies</h2>
            <p className="section-description">
              Our advanced AI assistant analyzes market trends, gas prices, and protocol risks
              to recommend the most profitable farming strategies for your portfolio.
            </p>
            
            <ul className="ai-features-list">
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Personalized farming recommendations</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Risk assessment and mitigation</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Optimal entry and exit timing</span>
              </li>
              <li>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Gas optimization strategies</span>
              </li>
            </ul>
            
            <Link to="/ai-assistant" className="button primary-button">
              Try AI Assistant
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          <div className="ai-assistant-preview">
            <img src="/images/ai-assistant-preview.png" alt="AI Assistant Preview" />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Earning?</h2>
          <p>Join thousands of farmers already growing their crypto assets with AI Harvest.</p>
          <div className="cta-buttons">
            <Link to="/farms" className="button primary-button">
              Explore Farms
            </Link>
            <a href="https://docs.aiharvest.com" target="_blank" rel="noopener noreferrer" className="button secondary-button">
              Read Documentation
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 