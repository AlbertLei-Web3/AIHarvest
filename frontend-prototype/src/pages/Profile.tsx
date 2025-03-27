import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useWeb3Store from '../store/web3Store';
import Button from '../components/common/Button';
import ModelCard from '../components/common/ModelCard';
import { AIModel, UserProfile } from '../types';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { connected, address, connect } = useWeb3Store();
  
  const [activeTab, setActiveTab] = useState<'created' | 'purchased'>('created');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [createdModels, setCreatedModels] = useState<AIModel[]>([]);
  const [purchasedModels, setPurchasedModels] = useState<AIModel[]>([]);

  // In a real app, we'd fetch the user profile and models
  useEffect(() => {
    const fetchProfile = async () => {
      if (!connected || !address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Mock profile data
        const mockProfile: UserProfile = {
          address: address,
          username: 'AI Developer',
          bio: 'Building the future of AI on the blockchain.',
          avatarUrl: 'https://via.placeholder.com/150',
          createdModels: ['3', '6'],
          purchasedModels: ['1', '2', '4'],
        };
        
        setProfile(mockProfile);
        
        // Mock created models
        const mockCreatedModels: AIModel[] = [
          {
            id: '3',
            name: 'CodeAssistant',
            description: 'Intelligent code completion and bug fixing for multiple programming languages.',
            version: '1.2.0',
            creator: address,
            price: '0.02',
            category: 'code',
            tags: ['code-generation', 'debugging', 'programming'],
            rating: 4.5,
            downloadsCount: 920,
            createdAt: '2023-03-10T09:15:00Z',
          },
          {
            id: '6',
            name: 'DataAnalyst',
            description: 'Analyze and visualize data with intelligent insights and predictions.',
            version: '1.0.0',
            creator: address,
            price: '0.04',
            category: 'multimodal',
            tags: ['data-analysis', 'visualization', 'prediction'],
            rating: 4.4,
            downloadsCount: 720,
            createdAt: '2023-06-18T13:20:00Z',
          },
        ];
        
        setCreatedModels(mockCreatedModels);
        
        // Mock purchased models
        const mockPurchasedModels: AIModel[] = [
          {
            id: '1',
            name: 'TextGenPro',
            description: 'Advanced text generation model with high coherence and context understanding.',
            version: '1.0.0',
            creator: '0x1234567890abcdef1234567890abcdef12345678',
            price: '0.01',
            category: 'text',
            tags: ['text-generation', 'creative-writing', 'summarization'],
            rating: 4.8,
            downloadsCount: 1200,
            createdAt: '2023-01-15T12:00:00Z',
          },
          {
            id: '2',
            name: 'ImageMaster',
            description: 'Create stunning images from text descriptions with precise control.',
            version: '2.1.0',
            creator: '0x2345678901abcdef2345678901abcdef23456789',
            price: '0.05',
            category: 'image',
            tags: ['image-generation', 'art', 'design'],
            rating: 4.6,
            downloadsCount: 850,
            createdAt: '2023-02-20T14:30:00Z',
          },
          {
            id: '4',
            name: 'VoiceGenius',
            description: 'High-quality voice synthesis and speech recognition capabilities.',
            version: '1.0.0',
            creator: '0x4567890123abcdef4567890123abcdef45678901',
            price: '0.03',
            category: 'audio',
            tags: ['text-to-speech', 'voice-cloning', 'audio'],
            rating: 4.3,
            downloadsCount: 560,
            createdAt: '2023-04-05T16:45:00Z',
          },
        ];
        
        setPurchasedModels(mockPurchasedModels);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [connected, address]);

  if (!connected) {
    return (
      <div className="py-8">
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <div className="mb-6">
            <svg className="w-20 h-20 mx-auto text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Please connect your wallet to view your profile, created models, and purchased models.
          </p>
          <Button 
            variant="primary"
            onClick={connect}
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      {profile && (
        <>
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="md:flex p-6">
              <div className="flex-shrink-0 mb-4 md:mb-0">
                <img 
                  src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-full border-4 border-gray-100"
                />
              </div>
              <div className="md:ml-6 flex-grow">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profile.username || 'Anonymous User'}
                    </h1>
                    <p className="text-gray-500 text-sm mb-2">
                      {address}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => alert('Edit profile functionality coming soon!')}
                  >
                    Edit Profile
                  </Button>
                </div>
                <p className="text-gray-700 mt-2">
                  {profile.bio || 'No bio provided'}
                </p>
                <div className="mt-4 flex space-x-4">
                  <div className="text-center">
                    <span className="block text-lg font-semibold">{createdModels.length}</span>
                    <span className="text-sm text-gray-500">Created</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-lg font-semibold">{purchasedModels.length}</span>
                    <span className="text-sm text-gray-500">Purchased</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    activeTab === 'created'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('created')}
                >
                  Created Models
                </button>
                <button
                  className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                    activeTab === 'purchased'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('purchased')}
                >
                  Purchased Models
                </button>
              </nav>
            </div>
          </div>

          {/* Models Grid */}
          <div>
            {activeTab === 'created' && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Created Models</h2>
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/create')}
                  >
                    Create New Model
                  </Button>
                </div>
                
                {createdModels.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600 mb-4">You haven't created any models yet.</p>
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/create')}
                    >
                      Create Your First Model
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdModels.map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'purchased' && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Purchased Models</h2>
                </div>
                
                {purchasedModels.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <p className="text-gray-600 mb-4">You haven't purchased any models yet.</p>
                    <Button 
                      variant="primary"
                      onClick={() => navigate('/models')}
                    >
                      Browse Models
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchasedModels.map((model) => (
                      <ModelCard key={model.id} model={model} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage; 