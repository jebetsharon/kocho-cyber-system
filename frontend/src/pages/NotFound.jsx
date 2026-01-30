import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-500">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
          <p className="text-gray-600 mt-4">
            Sorry, we couldn't find the page you're looking for. The page might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>
        
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-sm"
        >
          <HomeIcon className="h-5 w-5 mr-2" />
          Go Back Home
        </Link>

        <div className="mt-12 text-sm text-gray-500">
          <p>Kocho Printers and Cyber Ltd</p>
          <p>Eldoret Town, Saito Building</p>
          <p>Alot Oloo Street, Room B10</p>
          <p className="mt-2">📧 kochoprinters@gmail.com | 📱 0724444979</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;