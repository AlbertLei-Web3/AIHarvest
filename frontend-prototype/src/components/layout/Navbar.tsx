import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useWeb3Store from '../../store/web3Store';
import Button from '../common/Button';

const Navbar: React.FC = () => {
  const { connected, address, connect, disconnect } = useWeb3Store();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const shortenAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                AI Harvest
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/models"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-gray-300"
              >
                Models
              </Link>
              <Link
                to="/harvest"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-gray-300"
              >
                Harvest
              </Link>
              <Link
                to="/create"
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-gray-300"
              >
                Create
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {connected ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/profile"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  {shortenAddress(address)}
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={disconnect}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={connect}
              >
                Connect Wallet
              </Button>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              to="/models"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Models
            </Link>
            <Link
              to="/harvest"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Harvest
            </Link>
            <Link
              to="/create"
              className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              onClick={() => setIsMenuOpen(false)}
            >
              Create
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {connected ? (
                <div className="flex flex-col space-y-2 w-full">
                  <Link
                    to="/profile"
                    className="block text-base font-medium text-gray-700 hover:text-gray-900"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {shortenAddress(address)}
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      disconnect();
                      setIsMenuOpen(false);
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={async () => {
                    await connect();
                    setIsMenuOpen(false);
                  }}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 