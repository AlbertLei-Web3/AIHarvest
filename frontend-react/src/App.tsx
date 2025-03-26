import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useWeb3 from './hooks/useWeb3';
import useContracts from './hooks/useContracts';
import { PoolInfo, UserInfo } from './types';

// Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import Farms from './pages/Farms';
import Staking from './pages/Staking';
import Swap from './pages/Swap';
import AIAssistant from './pages/AIAssistant';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  const { account, connect, isConnected } = useWeb3();
  const { 
    factoryContract, 
    farmContract, 
    loadFarmContract,
    getPools,
    getUserInfo,
    deposit,
    withdraw,
    compound,
    isLoading,
    error 
  } = useContracts();
  
  const [farms, setFarms] = useState<PoolInfo[]>([]);
  const [userFarms, setUserFarms] = useState<Record<number, UserInfo>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Effect to load farm data
  useEffect(() => {
    const loadFarms = async () => {
      try {
        // Check if factory contract is loaded
        if (!factoryContract) return;
        
        // Get all farms from factory
        const allFarms = await factoryContract.getAllFarms();
        
        if (allFarms.length > 0) {
          // Load the first farm for simplicity
          loadFarmContract(allFarms[0]);
        }
      } catch (err: any) {
        console.error('Error loading farms:', err);
        setErrorMessage(err.message || 'Failed to load farms');
      }
    };
    
    loadFarms();
  }, [factoryContract, loadFarmContract]);
  
  // Effect to load pool data
  useEffect(() => {
    const loadPoolData = async () => {
      if (!farmContract) return;
      
      try {
        setLoading(true);
        const poolData = await getPools();
        setFarms(poolData);
      } catch (err: any) {
        console.error('Error loading pool data:', err);
        setErrorMessage(err.message || 'Failed to load pool data');
      } finally {
        setLoading(false);
      }
    };
    
    loadPoolData();
  }, [farmContract, getPools]);
  
  // Effect to load user data when connected
  useEffect(() => {
    const loadUserData = async () => {
      if (!farmContract || !account || !isConnected) return;
      
      try {
        setLoading(true);
        const userFarmData: Record<number, UserInfo> = {};
        
        for (let i = 0; i < farms.length; i++) {
          const userInfo = await getUserInfo(i, account);
          if (userInfo) {
            userFarmData[i] = userInfo;
          }
        }
        
        setUserFarms(userFarmData);
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setErrorMessage(err.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [farmContract, account, isConnected, farms.length, getUserInfo]);
  
  // Handle deposit
  const handleDeposit = async (pid: number, amount: string) => {
    try {
      setLoading(true);
      const tx = await deposit(pid, amount);
      if (tx) {
        await tx.wait();
        // Refresh data
        const poolData = await getPools();
        setFarms(poolData);
        if (account) {
          const userInfo = await getUserInfo(pid, account);
          if (userInfo) {
            setUserFarms(prev => ({ ...prev, [pid]: userInfo }));
          }
        }
      }
    } catch (err: any) {
      console.error('Error depositing:', err);
      setErrorMessage(err.message || 'Failed to deposit');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle withdraw
  const handleWithdraw = async (pid: number, amount: string) => {
    try {
      setLoading(true);
      const tx = await withdraw(pid, amount);
      if (tx) {
        await tx.wait();
        // Refresh data
        const poolData = await getPools();
        setFarms(poolData);
        if (account) {
          const userInfo = await getUserInfo(pid, account);
          if (userInfo) {
            setUserFarms(prev => ({ ...prev, [pid]: userInfo }));
          }
        }
      }
    } catch (err: any) {
      console.error('Error withdrawing:', err);
      setErrorMessage(err.message || 'Failed to withdraw');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle compound
  const handleCompound = async (pid: number) => {
    try {
      setLoading(true);
      const tx = await compound(pid);
      if (tx) {
        await tx.wait();
        // Refresh data
        const poolData = await getPools();
        setFarms(poolData);
        if (account) {
          const userInfo = await getUserInfo(pid, account);
          if (userInfo) {
            setUserFarms(prev => ({ ...prev, [pid]: userInfo }));
          }
        }
      }
    } catch (err: any) {
      console.error('Error compounding:', err);
      setErrorMessage(err.message || 'Failed to compound');
    } finally {
      setLoading(false);
    }
  };
  
  // Clear error message
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);
  
  return (
    <Router>
      <div className="app">
        <Header 
          title="AI Harvest"
          onConnect={connect}
          isConnected={isConnected}
          walletAddress={account}
        />
        
        {errorMessage && (
          <div className="error-banner">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)}>Dismiss</button>
          </div>
        )}
        
        <main className="main-content">
          {loading && (
            <div className="loading-overlay">
              <div className="loader"></div>
              <p>Loading...</p>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;
