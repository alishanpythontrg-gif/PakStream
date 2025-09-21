import React, { useState, useEffect } from 'react';
import { Video } from '../../types/video';
import videoService from '../../services/videoService';
import VideoPlayer from './VideoPlayer';

interface VideoGridProps {
  videos: Video[];
  loading?: boolean;
  onVideoClick?: (video: Video) => void;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  loading = false, 
  onVideoClick,
  showUploadButton = false,
  onUploadClick
}) => {
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-600';
      case 'processing': return 'bg-yellow-600';
      case 'uploading': return 'bg-blue-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-700 rounded-lg h-40 mb-2"></div>
            <div className="bg-gray-700 rounded h-4 mb-1"></div>
            <div className="bg-gray-700 rounded h-3 w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showUploadButton && onUploadClick && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">My Videos</h2>
          <button
            onClick={onUploadClick}
            className="btn-primary"
          >
            Upload Video
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {videos.map((video) => (
          <div
            key={video._id}
            className="video-thumbnail group cursor-pointer"
            onMouseEnter={() => setHoveredVideo(video._id)}
            onMouseLeave={() => setHoveredVideo(null)}
            onClick={() => onVideoClick?.(video)}
          >
            <div className="relative">
              {/* Thumbnail/Poster */}
              <div className="relative h-40 bg-gray-800 rounded-lg overflow-hidden">
                {video.status === 'ready' && videoService.getPosterUrl(video) ? (
                  <img
                    src={videoService.getPosterUrl(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="text-2xl mb-2">
                        {video.status === 'processing' ? '⏳' : 
                         video.status === 'error' ? '❌' : '📹'}
                      </div>
                      <div className="text-sm">
                        {video.status === 'processing' ? 'Processing...' :
                         video.status === 'error' ? 'Error' : 'No Preview'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {video.status === 'ready' ? (
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="text-white text-center">
                        <div className="text-2xl mb-1">
                          {video.status === 'processing' ? '⏳' : '❌'}
                        </div>
                        <div className="text-xs">
                          {video.status === 'processing' ? 'Processing...' : 'Error'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs text-white ${getStatusColor(video.status)}`}>
                    {video.status.toUpperCase()}
                  </span>
                </div>

                {/* Duration */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Processing Progress */}
                {video.status === 'processing' && video.processingProgress !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-700 h-1">
                    <div
                      className="bg-netflix-red h-1 transition-all duration-300"
                      style={{ width: `${video.processingProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate" title={video.title}>
                  {video.title}
                </h3>
                <p className="text-xs text-gray-400 truncate" title={video.description}>
                  {video.description}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {video.views} views
                  </span>
                  <span className="text-xs text-gray-500">
                    {video.category}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📹</div>
          <h3 className="text-xl font-semibold text-white mb-2">No videos found</h3>
          <p className="text-gray-400">
            {showUploadButton ? 'Upload your first video to get started!' : 'Check back later for new content.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
