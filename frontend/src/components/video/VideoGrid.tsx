import React from 'react';
import { Video } from '../../types/video';
import videoService from '../../services/videoService';

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  onVideoClick: (video: Video) => void;
  onDeleteClick?: (video: Video) => void;
  showDeleteButton?: boolean;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  loading, 
  onVideoClick, 
  onDeleteClick,
  showDeleteButton = false 
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'uploading':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-card rounded-lg overflow-hidden animate-pulse">
            <div className="aspect-video bg-secondary"></div>
            <div className="p-4">
              <div className="h-4 bg-secondary rounded mb-2"></div>
              <div className="h-3 bg-secondary rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-text-secondary text-lg mb-4">No videos found</div>
        <p className="text-text-secondary opacity-70">Try adjusting your filters or upload a new video</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div key={video._id} className="bg-card rounded-lg overflow-hidden group hover:scale-105 hover:bg-card-hover transition-all">
          <div className="relative aspect-video bg-black">
            {video.processedFiles?.poster ? (
              <img
                src={videoService.getPosterUrl(video)}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-text-secondary text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <div className="text-sm">No thumbnail</div>
                </div>
              </div>
            )}
            
            {/* Status Badge */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(video.status)} bg-black bg-opacity-75`}>
                {video.status.toUpperCase()}
              </span>
            </div>

            {/* Duration Badge */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 rounded text-xs font-semibold text-text-primary bg-black bg-opacity-75">
                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-30">
              <button
                onClick={() => onVideoClick(video)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-text-primary p-3 rounded-full transition-colors"
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>

            {/* Delete Button (Admin only) */}
            {showDeleteButton && onDeleteClick && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick(video);
                  }}
                  className="bg-accent hover:opacity-90 text-text-primary p-2 rounded-full transition-colors"
                  title="Delete video"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="text-text-primary font-semibold mb-2 line-clamp-2">{video.title}</h3>
            <p className="text-text-secondary text-sm mb-3 line-clamp-2">{video.description}</p>
            
            <div className="flex items-center justify-between text-sm text-text-secondary">
              <span className="capitalize">{video.category}</span>
              <span>{video.views} views</span>
            </div>

            <div className="mt-2 text-xs text-text-secondary opacity-70">
              <div>Size: {formatFileSize(video.fileSize)}</div>
              <div>Resolution: {video.resolution}</div>
              <div>Uploaded by: {video.uploadedBy.username}</div>
            </div>

            {video.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {video.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary text-text-secondary text-xs rounded">
                    {tag}
                  </span>
                ))}
                {video.tags.length > 3 && (
                  <span className="px-2 py-1 bg-secondary text-text-secondary text-xs rounded">
                    +{video.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;
