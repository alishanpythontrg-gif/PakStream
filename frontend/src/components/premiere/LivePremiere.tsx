import React, { useState, useEffect } from 'react';
import { Premiere } from '../../types/premiere';
import { Video, VideoVariant } from '../../types/video';
import premiereService from '../../services/premiereService';
import VideoPlayer from '../video/VideoPlayer';

interface LivePremiereProps {
  premiere: Premiere;
  onClose?: () => void;
}

const LivePremiere: React.FC<LivePremiereProps> = ({ premiere, onClose }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [viewerCount, setViewerCount] = useState(premiere.totalViewers);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    // Join the premiere
    const joinPremiere = async () => {
      try {
        await premiereService.joinPremiere();
        setIsJoined(true);
      } catch (error) {
        console.error('Failed to join premiere:', error);
      }
    };

    joinPremiere();

    // Update time remaining
    const updateTimeRemaining = () => {
      const remaining = premiereService.getTimeUntilEnd(premiere.endTime);
      setTimeRemaining(remaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [premiere]);

  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Convert premiere video to Video type for VideoPlayer
  const videoForPlayer: Video = {
    _id: premiere.video._id,
    title: premiere.video.title,
    description: premiere.video.description,
    duration: premiere.video.duration,
    resolution: premiere.video.resolution,
    fileSize: 0, // Default value since it's not available in premiere video
    uploadedBy: {
      _id: premiere.createdBy._id,
      username: premiere.createdBy.username,
      email: 'premiere@pakstream.com' // Default email for premiere videos
    },
    originalFile: {
      filename: '',
      path: '',
      size: 0,
      mimetype: 'video/mp4',
      duration: premiere.video.duration
    },
    status: 'ready',
    processingProgress: 100,
    views: 0,
    likes: 0,
    dislikes: 0,
    tags: [],
    category: 'movie', // Use valid category instead of 'premiere'
    isPublic: true,
    isFeatured: false,
    createdAt: premiere.createdAt,
    updatedAt: premiere.updatedAt,
    processedFiles: {
      hls: {
        masterPlaylist: premiere.video.processedFiles.hls.masterPlaylist,
        segments: [], // Empty array since segments are not available at top level
        variants: premiere.video.processedFiles.hls.variants.map(v => ({
          resolution: v.resolution,
          bitrate: v.bitrate,
          playlist: v.playlist,
          segments: v.segments
        })) as VideoVariant[]
      },
      thumbnails: premiere.video.processedFiles.thumbnails,
      poster: premiere.video.processedFiles.poster
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Premiere Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-6 z-10">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-600 font-bold text-sm">LIVE</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{premiere.title}</h1>
                <p className="text-gray-300">{premiere.description}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              {/* Viewer Count */}
              <div className="text-center">
                <div className="text-white font-bold text-lg">{viewerCount}</div>
                <div className="text-gray-400 text-sm">Viewers</div>
              </div>
              
              {/* Time Remaining */}
              <div className="text-center">
                <div className="text-white font-bold text-lg">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <div className="text-gray-400 text-sm">Remaining</div>
              </div>
              
              {/* Close Button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white text-2xl p-2"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="h-full pt-20">
        <VideoPlayer
          video={videoForPlayer}
          autoPlay={true}
          controls={true}
          className="h-full"
        />
      </div>

      {/* Premiere Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm text-gray-300">
                Created by {premiere.createdBy.username}
              </p>
              <p className="text-xs text-gray-400">
                Started {new Date(premiere.startTime).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-white font-bold">{premiere.video.resolution}</div>
                <div className="text-gray-400 text-xs">Quality</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold">
                  {Math.floor(premiere.video.duration / 60)}:{(premiere.video.duration % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-gray-400 text-xs">Duration</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePremiere;
