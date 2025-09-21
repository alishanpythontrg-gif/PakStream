import React, { useState, useEffect } from 'react';
import { Premiere } from '../../types/premiere';
import premiereService from '../../services/premiereService';

interface ScheduledPremiereProps {
  premiere: Premiere;
  onClose?: () => void;
}

const ScheduledPremiere: React.FC<ScheduledPremiereProps> = ({ premiere, onClose }) => {
  const [timeUntilStart, setTimeUntilStart] = useState(0);

  useEffect(() => {
    const updateTimeUntilStart = () => {
      const remaining = premiereService.getTimeUntilStart(premiere.startTime);
      setTimeUntilStart(remaining);
    };

    updateTimeUntilStart();
    const interval = setInterval(updateTimeUntilStart, 1000);

    return () => clearInterval(interval);
  }, [premiere.startTime]);

  const formatTimeUntilStart = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Helper function to get poster URL for premiere video
  const getPremierePosterUrl = (premiere: Premiere): string => {
    if (!premiere.video.processedFiles?.poster) {
      return '';
    }
    return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/videos/${premiere.video._id}/hls/${premiere.video.processedFiles.poster}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="bg-netflix-gray rounded-lg p-8 max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Upcoming Premiere</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
            {premiere.video.processedFiles?.poster ? (
              <img
                src={getPremierePosterUrl(premiere)}
                alt={premiere.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                🎬
              </div>
            )}
          </div>

          {/* Premiere Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{premiere.title}</h2>
              <p className="text-gray-300 text-lg">{premiere.description}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Premiere Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start Time:</span>
                    <span className="text-white">{new Date(premiere.startTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">
                      {Math.floor(premiere.video.duration / 60)}:{(premiere.video.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quality:</span>
                    <span className="text-white">{premiere.video.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created by:</span>
                    <span className="text-white">{premiere.createdBy.username}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-700/30 border border-yellow-500 rounded-lg p-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Premiere Starts In</h3>
                  <div className="text-3xl font-mono text-white">
                    {formatTimeUntilStart(timeUntilStart)}
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  This premiere will start automatically when the time comes.
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  You'll be notified when it begins!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPremiere;
