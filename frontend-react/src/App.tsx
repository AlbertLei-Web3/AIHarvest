import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useRoutes } from 'react-router-dom';
import { routes } from './routes';
import { useFarmStore } from './store';
import useWeb3 from './hooks/useWeb3';
import useContracts from './hooks/useContracts';

// Components
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';

// Error handling component
const ErrorBanner: React.FC<{ message: string | null; onDismiss: () => void }> = ({ 
  message, 
  onDismiss 
}) => {
  if (!message) return null;
  
  return (
    <div className="alert alert-danger alert-dismissible fade show" role="alert">
      <div className="d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <span>{message}</span>
      </div>
      <button 
        type="button" 
        className="btn-close" 
        onClick={onDismiss} 
        aria-label="Close"
      ></button>
    </div>
  );
};

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50" style={{ zIndex: 1050 }}>
    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Main app component
const AppRoutes: React.FC = () => {
  const routing = useRoutes(routes);
  return routing;
};

const App: React.FC = () => {
  const { 
    isLoading, 
    errorMessage, 
    setError,
    setLoading
  } = useFarmStore();
  
  const { 
    factoryContract,
    farmContract,
    loadFarmContract,
    getPools,
    getUserInfo,
  } = useContracts();
  
  const { account, isConnected } = useFarmStore();
  
  // Effect to load farm data when connected
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        if (!factoryContract || !isConnected) return;
        
        setLoading(true);
        // Get farms
        const allFarms = await factoryContract.getAllFarms();
        
        if (allFarms.length > 0) {
          // Load the first farm
          loadFarmContract(allFarms[0]);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading farms:', err);
        setError(err.message || 'Failed to load farms');
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [factoryContract, isConnected, loadFarmContract, setError, setLoading]);
  
  // Effect to load pool data when farm contract is loaded
  useEffect(() => {
    const loadPoolsData = async () => {
      try {
        if (!farmContract) return;
        
        setLoading(true);
        const pools = await getPools();
        useFarmStore.getState().setPools(pools);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading pools:', err);
        setError(err.message || 'Failed to load pools');
        setLoading(false);
      }
    };
    
    loadPoolsData();
  }, [farmContract, getPools, setError, setLoading]);
  
  // Effect to load user data when connected and farm contract is loaded
  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!farmContract || !account || !isConnected) return;
        
        setLoading(true);
        const pools = useFarmStore.getState().pools;
        
        for (let i = 0; i < pools.length; i++) {
          const userInfo = await getUserInfo(i, account);
          if (userInfo) {
            useFarmStore.getState().setUserStakeInfo(i, userInfo);
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading user data:', err);
        setError(err.message || 'Failed to load user data');
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [farmContract, account, isConnected, getUserInfo, setError, setLoading]);
  
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header />
        
        {errorMessage && (
          <div className="container mt-3">
            <ErrorBanner 
              message={errorMessage} 
              onDismiss={() => setError(null)} 
            />
          </div>
        )}
        
        <main className="flex-grow-1">
          {isLoading && <LoadingSpinner />}
          <AppRoutes />
        </main>
        
        <Footer />
      </div>
    </Router>
  );
};

export default App;
