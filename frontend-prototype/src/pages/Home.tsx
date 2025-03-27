import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const Home: React.FC = () => {
  return (
    <div className="py-10">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl mb-4">
          <span className="block">Decentralized AI Marketplace</span>
          <span className="block text-blue-600">with On-chain Rewards</span>
        </h1>
        <p className="max-w-lg mx-auto text-xl text-gray-500 mb-8">
          Discover, use, and create AI models while earning rewards through blockchain technology.
        </p>
        <div className="flex justify-center space-x-4">
          <Link to="/models">
            <Button variant="primary" size="lg">Explore Models</Button>
          </Link>
          <Link to="/create">
            <Button variant="outline" size="lg">Create Model</Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white rounded-lg shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-12">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-bold tracking-tight text-gray-900 sm:text-4xl">
              A better way to interact with AI
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Feature 1 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-500 text-white mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Decentralized Models</h3>
                <p className="text-base text-gray-500 text-center">
                  Access AI models stored on decentralized networks for enhanced security and availability.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-500 text-white mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">On-chain Rewards</h3>
                <p className="text-base text-gray-500 text-center">
                  Earn tokens when others use your models or when you contribute to the ecosystem.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-md bg-blue-500 text-white mb-4">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Secure Execution</h3>
                <p className="text-base text-gray-500 text-center">
                  Run AI models with privacy-preserving techniques to keep your data safe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="mt-2 text-lg text-gray-600">Simple steps to get started with AI Harvest</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-500 mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Connect Wallet</h3>
              <p className="text-gray-600">
                Link your Ethereum wallet to access the platform and manage your rewards.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-500 mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Explore or Create</h3>
              <p className="text-gray-600">
                Browse existing AI models or create and share your own with the community.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-500 mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Harvest AI Power</h3>
              <p className="text-gray-600">
                Use AI models and earn rewards based on your contributions to the network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 