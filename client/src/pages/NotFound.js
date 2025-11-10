import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-primary-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold text-white">404</span>
            </div>
          </motion.div>

          {/* Error Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl font-bold text-white mb-4">
              Page Not Found
            </h1>
            <p className="text-lg text-dark-300 mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <Link
              to="/"
              className="btn btn-primary btn-lg w-full flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            
            <Link
              to="/search"
              className="btn btn-outline btn-lg w-full flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Search Movies
            </Link>
          </motion.div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <button
              onClick={() => window.history.back()}
              className="text-dark-400 hover:text-white transition-colors flex items-center justify-center mx-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound; 