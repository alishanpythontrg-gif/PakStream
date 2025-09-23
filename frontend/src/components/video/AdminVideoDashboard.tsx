import React, { useState, useEffect } from 'react';
import { Video } from '../../types/video';
import videoService from '../../services/videoService';
import VideoGrid from './VideoGrid';
import VideoUploadModal from './VideoUploadModal';
import ProtectedRoute from '../ProtectedRoute';

const AdminVideoDashboard: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState({
    status: '',
    category: '',
    search: ''
  });

  useEffect(() => {
    fetchVideos();
  }, [filter]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVideos({
        ...filter,
        limit: 50
      });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchVideos();
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    try {
      setDeleting(true);
      await videoService.deleteVideo(videoToDelete._id);
      
      // Remove video from local state
      setVideos(prev => prev.filter(v => v._id !== videoToDelete._id));
      
      setShowDeleteModal(false);
      setVideoToDelete(null);
      
      // Show success message (you could add a toast notification here)
      console.log('Video deleted successfully by administrator');
    } catch (error) {
      console.error('Failed to delete video:', error);
      // Show error message (you could add a toast notification here)
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setVideoToDelete(null);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStats = () => {
    const total = videos.length;
    const ready = videos.filter(v => v.status === 'ready').length;
    const processing = videos.filter(v => v.status === 'processing').length;
    const error = videos.filter(v => v.status === 'error').length;
    const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

    return { total, ready, processing, error, totalViews };
  };

  const stats = getStats();

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-netflix-black pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Video Management</h1>
              <p className="text-gray-400">Administrators can manage and delete all videos</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-primary"
            >
              Upload Video
            </button>
          </div>

          {/* Admin Notice */}
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-400 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-yellow-400 font-semibold">Administrator Only</h3>
                <p className="text-yellow-200 text-sm">
                  Only users with administrator role can delete videos. Regular users cannot delete any videos, including their own.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-netflix-gray p-4 rounded-lg">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Videos</div>
            </div>
            <div className="bg-netflix-gray p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{stats.ready}</div>
              <div className="text-sm text-gray-400">Ready</div>
            </div>
            <div className="bg-netflix-gray p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{stats.processing}</div>
              <div className="text-sm text-gray-400">Processing</div>
            </div>
            <div className="bg-netflix-gray p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-400">{stats.error}</div>
              <div className="text-sm text-gray-400">Errors</div>
            </div>
            <div className="bg-netflix-gray p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">{stats.totalViews}</div>
              <div className="text-sm text-gray-400">Total Views</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-netflix-gray p-4 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filter.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  <option value="">All Status</option>
                  <option value="ready">Ready</option>
                  <option value="processing">Processing</option>
                  <option value="uploading">Uploading</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={filter.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                >
                  <option value="">All Categories</option>
                  <option value="movie">Movie</option>
                  <option value="tv-show">TV Show</option>
                  <option value="documentary">Documentary</option>
                  <option value="short-film">Short Film</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filter.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search videos..."
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                />
              </div>
            </div>
          </div>

          {/* Video Grid */}
          <VideoGrid
            videos={videos}
            loading={loading}
            onVideoClick={handleVideoClick}
            onDeleteClick={handleDeleteClick}
            showDeleteButton={true}
          />

          {/* Video Detail Modal */}
          {selectedVideo && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-netflix-gray rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedVideo.title}</h2>
                  <button
                    onClick={handleCloseVideo}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Video Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-400">Status:</span> <span className="text-white">{selectedVideo.status}</span></div>
                      <div><span className="text-gray-400">Category:</span> <span className="text-white">{selectedVideo.category}</span></div>
                      <div><span className="text-gray-400">Duration:</span> <span className="text-white">{selectedVideo.duration}s</span></div>
                      <div><span className="text-gray-400">Resolution:</span> <span className="text-white">{selectedVideo.resolution}</span></div>
                      <div><span className="text-gray-400">Views:</span> <span className="text-white">{selectedVideo.views}</span></div>
                      <div><span className="text-gray-400">Uploaded by:</span> <span className="text-white">{selectedVideo.uploadedBy.username}</span></div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-300 text-sm">{selectedVideo.description}</p>
                    
                    {selectedVideo.tags.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-white mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedVideo.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <h3 className="text-lg font-semibold text-white mb-4">Administrator Actions</h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        handleDeleteClick(selectedVideo);
                        handleCloseVideo();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      🗑️ Delete Video (Admin Only)
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Only administrators can delete videos. Regular users cannot delete any videos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && videoToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-netflix-gray rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center mb-4">
                  <div className="text-red-500 text-4xl mr-4">⚠️</div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Admin Delete Video</h2>
                    <p className="text-gray-400">Administrator action - cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-white mb-2">
                    Are you sure you want to delete this video as an administrator?
                  </p>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <h3 className="text-white font-semibold">{videoToDelete.title}</h3>
                    <p className="text-gray-300 text-sm">{videoToDelete.description}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Uploaded by: {videoToDelete.uploadedBy.username}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete as Admin'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upload Modal */}
          <VideoUploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminVideoDashboard;
