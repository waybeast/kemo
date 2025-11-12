import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, CheckCircle, AlertCircle, Loader2, 
  Wifi, WifiOff, Globe, Shield, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../../utils/api';

const SourceManager = ({ movieId, movieTitle, onSourcesLoaded, onSourceSelect }) => {
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  const [providerStatus, setProviderStatus] = useState({});
  const [retryCount, setRetryCount] = useState(0);
  
  // Use refs to avoid infinite loops
  const onSourcesLoadedRef = React.useRef(onSourcesLoaded);
  const onSourceSelectRef = React.useRef(onSourceSelect);
  
  React.useEffect(() => {
    onSourcesLoadedRef.current = onSourcesLoaded;
    onSourceSelectRef.current = onSourceSelect;
  }, [onSourcesLoaded, onSourceSelect]);

  const loadSources = useCallback(async () => {
    console.log('🔍 SourceManager: Loading sources for movie', movieId);
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(getApiUrl(`/api/streaming/sources/${movieId}`));
      const data = await response.json();
      console.log('✅ SourceManager: Received data', data);
      
      if (data.success && data.sources) {
        // Enhanced Streaming Service returns sources directly
        const allSources = data.sources || [];
        console.log('📺 SourceManager: Found', allSources.length, 'sources');
        
        // Sort by priority (already sorted by Enhanced Streaming Service)
        const sortedSources = allSources.length > 0 ? allSources : sortSourcesByQuality(allSources);
        setSources(sortedSources);
        
        // Auto-select best source
        if (sortedSources.length > 0) {
          const bestSource = sortedSources[0];
          console.log('🎯 SourceManager: Auto-selecting source', bestSource.provider, bestSource.url);
          setSelectedSource(bestSource);
          onSourceSelectRef.current?.(bestSource);
        }
        
        // Update provider status from metadata
        if (data.metadata?.providerBreakdown) {
          const status = {};
          Object.entries(data.metadata.providerBreakdown).forEach(([provider, count]) => {
            status[provider] = {
              count,
              qualities: new Set(),
              types: new Set()
            };
          });
          
          // Fill in qualities and types from sources
          sortedSources.forEach(source => {
            if (status[source.provider]) {
              status[source.provider].qualities.add(source.quality);
              status[source.provider].types.add(source.type);
            }
          });
          
          setProviderStatus(status);
        }
        
        console.log('📤 SourceManager: Calling onSourcesLoaded with', sortedSources.length, 'sources');
        onSourcesLoadedRef.current?.(sortedSources);
        
        if (sortedSources.length > 0) {
          toast.success(`Ready to stream`);
        } else {
          toast.error('No streaming sources available for this movie');
        }
      } else {
        throw new Error(data.error || 'Failed to load sources');
      }
    } catch (error) {
      console.error('Error loading sources:', error);
      setError(error.message);
      toast.error('Failed to load streaming sources');
    } finally {
      setIsLoading(false);
    }
  }, [movieId]); // Removed onSourceSelect and onSourcesLoaded from dependencies

  useEffect(() => {
    if (movieId) {
      loadSources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]); // Only reload when movieId changes

  const sortSourcesByQuality = (sources) => {
    const qualityOrder = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
    const typeOrder = { 'direct': 3, 'hls': 2, 'embed': 1 };
    
    return sources.sort((a, b) => {
      // First sort by type (direct > hls > embed)
      const typeDiff = (typeOrder[b.type] || 0) - (typeOrder[a.type] || 0);
      if (typeDiff !== 0) return typeDiff;
      
      // Then sort by quality
      const qualityDiff = (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0);
      if (qualityDiff !== 0) return qualityDiff;
      
      // Finally sort by provider reliability
      const providerOrder = { 'vidsrc': 3, 'embedSu': 2, 'sflix': 1 };
      return (providerOrder[b.provider] || 0) - (providerOrder[a.provider] || 0);
    });
  };

  const updateProviderStatus = (sources) => {
    const status = {};
    
    Object.keys(sources).forEach(type => {
      if (sources[type]?.data) {
        sources[type].data.forEach(source => {
          if (!status[source.provider]) {
            status[source.provider] = {
              count: 0,
              qualities: new Set(),
              types: new Set()
            };
          }
          status[source.provider].count++;
          status[source.provider].qualities.add(source.quality);
          status[source.provider].types.add(source.type);
        });
      }
    });
    
    setProviderStatus(status);
  };

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    onSourceSelect?.(source);
    toast.success(`Selected ${source.provider} (${source.quality})`);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadSources();
  };

  const getProviderIcon = (provider) => {
    const icons = {
      vidsrc: <Globe className="w-4 h-4" />,
      embedSu: <Shield className="w-4 h-4" />,
      sflix: <Zap className="w-4 h-4" />,
      superEmbed: <Wifi className="w-4 h-4" />,
      vidsrcPk: <Globe className="w-4 h-4" />,
      watchSeries: <Wifi className="w-4 h-4" />
    };
    return icons[provider] || <Globe className="w-4 h-4" />;
  };

  const getQualityColor = (quality) => {
    const colors = {
      '1080p': 'text-green-400',
      '720p': 'text-blue-400',
      '480p': 'text-yellow-400',
      '360p': 'text-gray-400'
    };
    return colors[quality] || 'text-gray-400';
  };

  const getTypeColor = (type) => {
    const colors = {
      'direct': 'text-green-400',
      'hls': 'text-blue-400',
      'embed': 'text-yellow-400'
    };
    return colors[type] || 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-white">Loading streaming sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Sources</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry ({retryCount})</span>
          </button>
        </div>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <WifiOff className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-semibold text-white mb-2">No Sources Available</h3>
          <p className="text-gray-400 mb-4">No streaming sources found for this movie</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Sources</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Provider Status */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Available Providers</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(providerStatus).map(([provider, info]) => (
            <div key={provider} className="flex items-center space-x-2 p-2 bg-gray-800 rounded">
              {getProviderIcon(provider)}
              <div className="flex-1">
                <div className="text-white text-sm font-medium capitalize">{provider}</div>
                <div className="text-gray-400 text-xs">
                  {info.count} sources • {Array.from(info.qualities).join(', ')}
                </div>
              </div>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Source List */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Streaming Sources ({sources.length})</h3>
          <button
            onClick={handleRetry}
            className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {sources.map((source, index) => (
              <motion.button
                key={`${source.provider}-${source.quality}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleSourceSelect(source)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedSource?.url === source.url
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getProviderIcon(source.provider)}
                    <div>
                      <div className="font-medium capitalize">{source.provider}</div>
                      <div className="text-sm opacity-75">
                        <span className={getQualityColor(source.quality)}>{source.quality}</span>
                        {' • '}
                        <span className={getTypeColor(source.type)}>{source.type}</span>
                        {source.language && ` • ${source.language}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedSource?.url === source.url && (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                    <div className="text-xs opacity-75">
                      {source.type === 'direct' && 'Direct'}
                      {source.type === 'hls' && 'HLS'}
                      {source.type === 'embed' && 'Embed'}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Source Info */}
      {selectedSource && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            <div>
              <h4 className="text-white font-semibold">Currently Selected</h4>
              <p className="text-blue-300">
                {selectedSource.provider} • {selectedSource.quality} • {selectedSource.type}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SourceManager; 