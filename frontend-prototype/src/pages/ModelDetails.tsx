import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AIModel } from '../types';
import Button from '../components/common/Button';
import useWeb3Store from '../store/web3Store';

const ModelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connected, address } = useWeb3Store();
  
  const [model, setModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch from API
        // For now, we'll use mock data
        
        // Mock data based on id
        const mockModel: AIModel = {
          id: id || '1',
          name: 'TextGenPro',
          description: 'Advanced text generation model with high coherence and context understanding. This model has been trained on a diverse corpus of text data, enabling it to generate coherent and contextually relevant text across various domains including creative writing, business communication, and technical documentation. It excels at maintaining the style, tone, and flow of the provided prompt, making it ideal for content creation, story writing, and dialogue generation.',
          version: '1.0.0',
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          price: '0.01',
          imageUrl: 'https://via.placeholder.com/600x400?text=AI+Model',
          category: 'text',
          tags: ['text-generation', 'creative-writing', 'summarization'],
          rating: 4.8,
          downloadsCount: 1200,
          createdAt: '2023-01-15T12:00:00Z',
        };
        
        setModel(mockModel);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch model details. Please try again later.');
        setLoading(false);
        console.error('Error fetching model:', err);
      }
    };

    if (id) {
      fetchModel();
    } else {
      setError('Model ID is missing');
      setLoading(false);
    }
  }, [id]);

  const handlePurchase = async () => {
    if (!connected) {
      // Redirect to connect wallet or show modal
      alert('Please connect your wallet first');
      return;
    }

    if (!model) return;

    try {
      setPurchaseStatus('processing');
      
      // In a real app, this would call a smart contract
      // For now, we'll just simulate a successful purchase
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPurchaseStatus('success');
    } catch (err) {
      console.error('Error purchasing model:', err);
      setPurchaseStatus('error');
    }
  };

  const handleHarvest = () => {
    if (model) {
      navigate(`/harvest?modelId=${model.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <p>{error || 'Model not found'}</p>
      </div>
    );
  }

  const formattedDate = new Date(model.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Check if user is model creator
  const isCreator = connected && address && address.toLowerCase() === model.creator.toLowerCase();

  return (
    <div className="py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header with image */}
        <div className="relative h-64 md:h-80 bg-gray-300">
          <img 
            src={model.imageUrl || 'https://via.placeholder.com/1200x400?text=AI+Model'} 
            alt={model.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-6 w-full">
              <div className="flex justify-between items-end">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                    {model.category}
                  </span>
                  <h1 className="text-3xl font-bold text-white">{model.name}</h1>
                </div>
                <div className="text-white text-right">
                  <div className="text-2xl font-bold">
                    {model.price === '0' ? 'Free' : `${model.price} ETH`}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">About this model</h2>
            <p className="text-gray-700 whitespace-pre-line">{model.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dl className="divide-y divide-gray-200">
                  <div className="py-3 flex justify-between">
                    <dt className="text-gray-500">Version</dt>
                    <dd className="text-gray-900 font-medium">{model.version}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-gray-500">Created by</dt>
                    <dd className="text-gray-900 font-medium">
                      {model.creator.slice(0, 6)}...{model.creator.slice(-4)}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-gray-500">Created on</dt>
                    <dd className="text-gray-900 font-medium">{formattedDate}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-gray-500">Downloads</dt>
                    <dd className="text-gray-900 font-medium">{model.downloadsCount}</dd>
                  </div>
                  <div className="py-3 flex justify-between">
                    <dt className="text-gray-500">Rating</dt>
                    <dd className="text-gray-900 font-medium flex items-center">
                      <svg className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      {model.rating?.toFixed(1)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {model.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <div className="space-y-4">
                  {!isCreator && model.price !== '0' && purchaseStatus !== 'success' && (
                    <Button 
                      variant="primary" 
                      fullWidth 
                      onClick={handlePurchase}
                      isLoading={purchaseStatus === 'processing'}
                      disabled={purchaseStatus === 'processing'}
                    >
                      {purchaseStatus === 'error' ? 'Try Again' : 'Purchase Model'}
                    </Button>
                  )}
                  
                  <Button 
                    variant={model.price === '0' || purchaseStatus === 'success' || isCreator ? 'primary' : 'outline'} 
                    fullWidth 
                    onClick={handleHarvest}
                    disabled={model.price !== '0' && purchaseStatus !== 'success' && !isCreator}
                  >
                    Harvest with this Model
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDetails; 