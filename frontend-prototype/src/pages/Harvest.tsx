import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AIModel, HarvestResponse } from '../types';
import Button from '../components/common/Button';
import useWeb3Store from '../store/web3Store';

const Harvest: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useWeb3Store();
  
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [harvestResult, setHarvestResult] = useState<HarvestResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Parse model ID from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modelId = params.get('modelId');
    
    if (modelId) {
      // In a real app, we would fetch the specific model
      // For now, we'll use mock data
      const mockModel: AIModel = {
        id: modelId,
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
      };
      
      setSelectedModel(mockModel);
    }
  }, [location.search]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        // In a real app, we would fetch from API
        // For now, we'll use mock data
        
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

  const handleHarvest = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      // In a real app, this would call a smart contract and API
      // For now, we'll just simulate a response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult: HarvestResponse = {
        id: `harvest-${Date.now()}`,
        modelId: selectedModel.id,
        prompt: prompt,
        result: generateMockResponse(prompt, selectedModel.category),
        createdAt: new Date().toISOString(),
        status: 'completed',
      };
      
      setHarvestResult(mockResult);
      setIsProcessing(false);
    } catch (err) {
      console.error('Error harvesting:', err);
      setError('Failed to harvest. Please try again later.');
      setIsProcessing(false);
    }
  };

  const generateMockResponse = (prompt: string, category: string): string => {
    if (category === 'text') {
      return `Here is a response to your prompt: "${prompt}"\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisi vel consectetur euismod, nisl nisi consectetur nisl, euismod nisl nisi vel consectetur. Nullam euismod, nisi vel consectetur euismod, nisl nisi consectetur nisl, euismod nisl nisi vel consectetur.\n\nPellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper.`;
    } else if (category === 'image') {
      return 'https://via.placeholder.com/800x600?text=Generated+Image';
    } else if (category === 'code') {
      return `// Here's some generated code based on your prompt: "${prompt}"\n\nfunction processData(input) {\n  const result = [];\n  const lines = input.trim().split('\\n');\n  \n  for (const line of lines) {\n    if (line.trim().length > 0) {\n      const processed = line.trim().toLowerCase();\n      result.push(processed);\n    }\n  }\n  \n  return result.join('\\n');\n}\n\nmodule.exports = { processData };`;
    } else {
      return `Response to your prompt: "${prompt}" using ${category} model capabilities.`;
    }
  };

  const handleSelectModel = (model: AIModel) => {
    setSelectedModel(model);
    // Reset results when switching models
    setHarvestResult(null);
  };

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Harvest AI Power</h1>
        <p className="text-lg text-gray-600">
          Select a model and enter a prompt to harness the power of AI models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Model Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Model</h2>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {models.map((model) => (
                  <div 
                    key={model.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedModel?.id === model.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleSelectModel(model)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{model.name}</h3>
                        <p className="text-sm text-gray-500">{model.category}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {model.price === '0' ? 'Free' : `${model.price} ETH`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedModel && (
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Selected Model</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-2">{selectedModel.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{selectedModel.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{selectedModel.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Version:</span>
                    <span className="ml-2 font-medium">{selectedModel.version}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-2 font-medium">{selectedModel.rating?.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Uses:</span>
                    <span className="ml-2 font-medium">{selectedModel.downloadsCount}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt and Results */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Enter Prompt</h2>
            <div className="mb-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your prompt here..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            
            {error && (
              <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                <p>{error}</p>
              </div>
            )}
            
            <Button
              variant="primary"
              fullWidth
              onClick={handleHarvest}
              disabled={!selectedModel || !prompt.trim() || isProcessing}
              isLoading={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Harvest'}
            </Button>
          </div>

          {harvestResult && (
            <div className="bg-white p-5 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Result</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-500 mb-2">Prompt:</p>
                <div className="p-3 bg-white border border-gray-200 rounded-md">
                  <p className="whitespace-pre-line">{harvestResult.prompt}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Response:</p>
                <div className="p-3 bg-white border border-gray-200 rounded-md">
                  {selectedModel?.category === 'image' ? (
                    <img 
                      src={harvestResult.result} 
                      alt="Generated image" 
                      className="max-w-full h-auto mx-auto"
                    />
                  ) : selectedModel?.category === 'code' ? (
                    <pre className="whitespace-pre-wrap font-mono text-sm overflow-x-auto">
                      {harvestResult.result}
                    </pre>
                  ) : (
                    <p className="whitespace-pre-line">{harvestResult.result}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setHarvestResult(null);
                    setPrompt('');
                  }}
                >
                  New Prompt
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // In a real app, this would save to blockchain/IPFS
                    alert('Result saved successfully!');
                  }}
                >
                  Save Result
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Harvest; 