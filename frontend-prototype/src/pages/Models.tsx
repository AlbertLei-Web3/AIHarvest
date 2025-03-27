import React, { useState, useEffect } from 'react';
import { AIModel } from '../types';
import ModelCard from '../components/common/ModelCard';
import { modelsApi } from '../services/api';

const Models: React.FC = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock categories for now
  const categories = ['all', 'text', 'image', 'audio', 'code', 'multimodal'];

  // Fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch from API
        // For now, we'll use mock data
        // const response = await modelsApi.getAll();
        // setModels(response);
        
        // Mock data
        const mockModels: AIModel[] = [
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
            id: '3',
            name: 'CodeAssistant',
            description: 'Intelligent code completion and bug fixing for multiple programming languages.',
            version: '1.2.0',
            creator: '0x3456789012abcdef3456789012abcdef34567890',
            price: '0.02',
            category: 'code',
            tags: ['code-generation', 'debugging', 'programming'],
            rating: 4.5,
            downloadsCount: 920,
            createdAt: '2023-03-10T09:15:00Z',
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
          {
            id: '5',
            name: 'MultiTaskAI',
            description: 'A versatile model that can handle text, image, and basic reasoning tasks.',
            version: '1.5.0',
            creator: '0x5678901234abcdef5678901234abcdef56789012',
            price: '0',
            category: 'multimodal',
            tags: ['text', 'image', 'reasoning', 'free'],
            rating: 4.7,
            downloadsCount: 1500,
            createdAt: '2023-05-22T11:30:00Z',
          },
          {
            id: '6',
            name: 'DataAnalyst',
            description: 'Analyze and visualize data with intelligent insights and predictions.',
            version: '1.0.0',
            creator: '0x6789012345abcdef6789012345abcdef67890123',
            price: '0.04',
            category: 'multimodal',
            tags: ['data-analysis', 'visualization', 'prediction'],
            rating: 4.4,
            downloadsCount: 720,
            createdAt: '2023-06-18T13:20:00Z',
          },
        ];
        
        setModels(mockModels);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch models. Please try again later.');
        setLoading(false);
        console.error('Error fetching models:', err);
      }
    };

    fetchModels();
  }, []);

  // Filter models based on search query and category
  const filteredModels = models.filter((model) => {
    const matchesQuery = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || model.category === selectedCategory;
    
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Models Marketplace</h1>
        <p className="text-lg text-gray-600">
          Discover and use a variety of AI models from our decentralized marketplace
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search models..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Models grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600">No models found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Models; 