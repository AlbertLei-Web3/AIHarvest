import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-6">Page Not Found</h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
          Sorry, we couldn't find the page you're looking for. The page might have been moved or doesn't exist.
        </p>
        <Link to="/">
          <Button variant="primary">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 