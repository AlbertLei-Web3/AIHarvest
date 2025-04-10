import React, { useEffect, useState } from 'react';
import useWeb3 from '../hooks/useWeb3';
import '../styles/Farms.css';

// 简化版Farm卡片组件（完全静态）
const SimpleFarmCard = () => {
  const farmAddress = process.env.REACT_APP_FARM_ADDRESS || '';
  const tokenAddress = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '';

  return (
    <div className="farm-card">
      <div className="apr-badge">
        APR: 100%
      </div>
      
      <div className="farm-card-content">
        <h3 className="farm-title">
          AIH Farm
        </h3>
        
        <div className="farm-info">
          <div className="info-row">
            <span className="info-label">Farm Address</span>
            <span className="info-value">
              {farmAddress ? `${farmAddress.substring(0, 6)}...${farmAddress.substring(farmAddress.length - 4)}` : 'Not set'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Token Address</span>
            <span className="info-value">
              {tokenAddress ? `${tokenAddress.substring(0, 6)}...${tokenAddress.substring(tokenAddress.length - 4)}` : 'Not set'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Status</span>
            <span className="info-value">Demo Farm</span>
          </div>
        </div>
        
        <div className="farm-actions">
          <button className="button primary-button" onClick={() => alert("This is a demo farm. Real interactions coming soon!")}>
            Stake
          </button>
          <button className="button disabled-button" disabled>
            Harvest
          </button>
        </div>
      </div>
    </div>
  );
};

const Farms: React.FC = () => {
  const { isConnected, account, chainId } = useWeb3();
  const [isLoading, setIsLoading] = useState(true);
  
  // 简单加载效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const farmAddress = process.env.REACT_APP_FARM_ADDRESS || '';
  const tokenAddress = process.env.REACT_APP_AIH_TOKEN_ADDRESS || '';
  
  // 记录访问信息，但不尝试调用合约
  useEffect(() => {
    console.log("Farms页面已加载");
    console.log('环境变量 Farm地址:', process.env.REACT_APP_FARM_ADDRESS);
    console.log('环境变量 Token地址:', process.env.REACT_APP_AIH_TOKEN_ADDRESS);
    console.log('当前网络ID:', chainId);
    console.log('钱包连接状态:', isConnected ? '已连接' : '未连接');
    if (account) {
      console.log('钱包地址:', account);
    }
  }, [isConnected, account, chainId]);

  return (
    <div className="farms-page">
      <div className="gradient-background">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
      </div>
      
      <div className="farms-header">
        <div className="header-content">
          <h1>Yield Farms</h1>
          <p>Stake tokens to earn AIH rewards with AI-powered strategies</p>
        </div>
        
        {/* 静态合约信息显示 */}
        <div className="contract-info-box">
          <h3>Contract Information</h3>
          <div className="contract-info-grid">
            <div className="info-row">
              <span className="label">Farm:</span>
              <span className="value" title={farmAddress}>
                {farmAddress ? `${farmAddress.substring(0, 6)}...${farmAddress.substring(farmAddress.length - 4)}` : 'Not configured'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Token:</span>
              <span className="value" title={tokenAddress}>
                {tokenAddress ? `${tokenAddress.substring(0, 6)}...${tokenAddress.substring(tokenAddress.length - 4)}` : 'Not configured'}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Network:</span>
              <span className="value">
                {chainId === 11155111 ? 'Sepolia Testnet' : chainId === 31337 ? 'Hardhat Local' : `Unknown (${chainId})`}
              </span>
            </div>
            <div className="info-row">
              <span className="label">Status:</span>
              <span className="value">
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 加载状态 */}
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Loading demo farm...</p>
        </div>
      ) : (
        <div className="no-farms-message">
          <div className="demo-farm-container">
            <h2>Demo Farm</h2>
            <p>We're currently working on integrating the SimpleFarm contract properly. For now, here's a preview of how the farm will look.</p>
            
            <div className="farms-grid">
              <SimpleFarmCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farms; 