import React, { useState } from 'react';
import Button from '../components/common/Button';
import useWeb3Store from '../store/web3Store';

const Create: React.FC = () => {
  const { connected } = useWeb3Store();
  const [isUnderConstruction, setIsUnderConstruction] = useState(true);

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Create AI Model</h1>
        <p className="text-lg text-gray-600">
          Publish your AI models to the marketplace and earn rewards
        </p>
      </div>

      {isUnderConstruction ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Coming Soon</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We're currently building this feature. Soon you'll be able to create and publish your own AI models on the blockchain.
          </p>
          <Button 
            variant="primary"
            onClick={() => setIsUnderConstruction(false)}
          >
            Show Preview
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Model Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a name for your model"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your model's capabilities and use cases"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="audio">Audio</option>
                  <option value="code">Code</option>
                  <option value="multimodal">Multimodal</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (ETH)
                </label>
                <input
                  type="number"
                  id="price"
                  min="0"
                  step="0.001"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.01"
                />
                <p className="mt-1 text-xs text-gray-500">Set to 0 for free models</p>
              </div>
            </div>
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Model File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Model files, weights, or archives up to 10MB
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                variant="primary"
                fullWidth
                type="button"
                onClick={() => alert('This is a preview. Publishing functionality coming soon!')}
                disabled={!connected}
              >
                {connected ? 'Publish Model' : 'Connect Wallet to Publish'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Create; 