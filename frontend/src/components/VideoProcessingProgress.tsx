import React, { useState, useEffect } from 'react';
import socketService from '../services/socketService';

interface ProcessingProgress {
  videoId: string;
  progress: number;
  message: string;
  timestamp: string;
}

interface VideoProcessingProgressProps {
  videoId: string | null;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

const VideoProcessingProgress: React.FC<VideoProcessingProgressProps> = ({
  videoId,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setIsVisible(false);
      setProgress(null);
      return;
    }

    setIsVisible(true);
    setProgress({
      videoId,
      progress: 0,
      message: 'Starting video processing...',
      timestamp: new Date().toISOString()
    });

    // Listen for progress updates
    const handleProgress = (data: ProcessingProgress) => {
      if (data.videoId === videoId) {
        setProgress(data);
        
        if (data.progress >= 100) {
          setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
          }, 2000);
        } else if (data.progress < 0) {
          setIsVisible(false);
          onError?.(data.message);
        }
      }
    };

    // Add event listener using socketService
    socketService.on('videoProcessingProgress', handleProgress);

    return () => {
      // Remove event listener
      socketService.off('videoProcessingProgress', handleProgress);
    };
  }, [videoId, onComplete, onError]);

  if (!isVisible || !progress) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎬</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Video</h3>
          <p className="text-gray-600">{progress.message}</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress.progress))}%` }}
            />
          </div>
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">
            This may take a few minutes depending on video size...
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoProcessingProgress;
