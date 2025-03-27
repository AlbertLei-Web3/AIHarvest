import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useWeb3Store from './store/web3Store';
import Layout from './components/layout/Layout';

// Import pages (will create these next)
const Home = React.lazy(() => import('./pages/Home'));
const Models = React.lazy(() => import('./pages/Models'));
const ModelDetails = React.lazy(() => import('./pages/ModelDetails'));
const Harvest = React.lazy(() => import('./pages/Harvest'));
const Create = React.lazy(() => import('./pages/Create'));
const Profile = React.lazy(() => import('./pages/Profile'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

function App() {
  const { connect } = useWeb3Store();

  // Try to connect to wallet on app load if user was previously connected
  useEffect(() => {
    const connectWallet = async () => {
      if (localStorage.getItem('wallet_connected') === 'true') {
        try {
          await connect();
        } catch (error) {
          console.error('Failed to auto-connect wallet');
        }
      }
    };

    connectWallet();
  }, [connect]);

  return (
    <Router>
      <Layout>
        <React.Suspense fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/models" element={<Models />} />
            <Route path="/models/:id" element={<ModelDetails />} />
            <Route path="/harvest" element={<Harvest />} />
            <Route path="/create" element={<Create />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </Layout>
    </Router>
  );
}

export default App;
