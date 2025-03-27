import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AIModel } from '../../types';
import Card, { CardContent, CardImage, CardTitle, CardFooter } from './Card';
import Button from './Button';

interface ModelCardProps {
  model: AIModel;
  className?: string;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, className = '' }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/models/${model.id}`);
  };
  
  const handleHarvest = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/harvest?modelId=${model.id}`);
  };

  return (
    <Card hoverable className={`h-full flex flex-col ${className}`} onClick={handleClick}>
      <CardImage 
        src={model.imageUrl || 'https://via.placeholder.com/300x200?text=AI+Model'} 
        alt={model.name} 
        className="h-48"
      />
      <CardContent className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <CardTitle>{model.name}</CardTitle>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {model.category}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2 line-clamp-3">
          {model.description}
        </p>
        <div className="flex justify-between items-center mt-3">
          <div>
            <p className="text-sm text-gray-500">By: {model.creator.slice(0, 6)}...{model.creator.slice(-4)}</p>
            {model.rating && (
              <div className="flex items-center mt-1">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1 text-sm text-gray-500">{model.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">{model.price === '0' ? 'Free' : `${model.price} ETH`}</p>
            {model.downloadsCount && (
              <p className="text-xs text-gray-500 mt-1">{model.downloadsCount} uses</p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-white border-t border-gray-100">
        <Button 
          variant="primary" 
          fullWidth 
          onClick={(e) => handleHarvest(e)}
          size="sm"
        >
          Harvest
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ModelCard; 