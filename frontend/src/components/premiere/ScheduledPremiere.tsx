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
  }, [premiere]);

  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50">
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-white max-w-2xl mx-auto p-8">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          )}

          {/* Premiere Info */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{premiere.title}</h1>
            <p className="text-xl text-gray-300 mb-6">{premiere.description}</p>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
              <div>
                <div className="font-semibold">Duration</div>
                <div>{Math.floor(premiere.video.duration / 60)}:{(premiere.video.duration % 60).toString().padStart(2, '0')}</div>
              </div>
              <div>
                <div className="font-semibold">Quality</div>
                <div>{premiere.video.resolution}</div>
              </div>
              <div>
                <div className="font-semibold">Created by</div>
                <div>{premiere.createdBy.username}</div>
              </div>
            </div>
          </div>

          {/* Countdown */}
          <div className="mb-8">
            <div className="text-6xl font-bold mb-4 text-netflix-red">
              {formatTimeRemaining(timeUntilStart)}
            </div>
            <p className="text-lg text-gray-300">
              {timeUntilStart > 0 ? 'Premiere starts in' : 'Premiere starting now...'}
            </p>
          </div>

          {/* Video Thumbnail */}
          <div className="mb-8">
            <div className="relative inline-block">
              <img
                src={premiereService.getPosterUrl(premiere.video)}
                alt={premiere.video.title}
                className="w-64 h-36 object-cover rounded-lg shadow-2xl"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="w-16 h-16 bg-netflix-red rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Start Time */}
          <div className="text-gray-400">
            <p>Premiere starts at</p>
            <p className="text-xl font-semibold text-white">
              {new Date(premiere.startTime).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledPremiere;
