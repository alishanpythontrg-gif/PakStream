import React, { useState, useEffect } from 'react';
import { Premiere, CreatePremiereData } from '../../types/premiere';
import { Video } from '../../types/video';
import premiereService from '../../services/premiereService';
import videoService from '../../services/videoService';
import { useAuth } from '../../hooks';

const AdminPremiereDashboard: React.FC = () => {
  const { user } = useAuth();
  const [premieres, setPremieres] = useState<Premiere[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activePremiere, setActivePremiere] = useState<Premiere | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [premieresRes, videosRes, activeRes] = await Promise.all([
        premiereService.getAllPremieres(),
        videoService.getVideos({ limit: 50 }),
        premiereService.getActivePremiere()
      ]);

      setPremieres(premieresRes.data.premieres);
      setVideos(videosRes.data.videos);
      setActivePremiere(activeRes.data.premiere);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePremiere = async (premiereData: CreatePremiereData) => {
    try {
      await premiereService.createPremiere(premiereData);
      setShowCreateModal(false);
      setSelectedVideo(null);
      fetchData();
    } catch (error) {
      console.error('Failed to create premiere:', error);
    }
  };

  const handleEndPremiere = async (premiereId: string) => {
    try {
      await premiereService.endPremiere(premiereId);
      fetchData();
    } catch (error) {
      console.error('Failed to end premiere:', error);
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="py-16 px-4 bg-netflix-black">
        <div className="container mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mx-auto mb-4"></div>
            <p>Loading premiere dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="admin-premieres" className="py-16 px-4 bg-netflix-black">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Premiere Management</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            disabled={activePremiere !== null}
          >
            {activePremiere ? 'Premiere Active' : 'Create Premiere'}
          </button>
        </div>

        {/* Active Premiere */}
        {activePremiere && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  🔴 LIVE: {activePremiere.title}
                </h3>
                <p className="text-red-200 mb-2">{activePremiere.description}</p>
                <p className="text-sm text-red-300">
                  Viewers: {activePremiere.totalViewers} | 
                  Started: {new Date(activePremiere.startTime).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => handleEndPremiere(activePremiere._id)}
                className="btn-secondary"
              >
                End Premiere
              </button>
            </div>
          </div>
        )}

        {/* Premiere List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {premieres.map((premiere) => (
            <div key={premiere._id} className="bg-netflix-gray rounded-lg overflow-hidden">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {premiere.title}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  {premiere.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      premiere.status === 'live' ? 'bg-red-600 text-white' :
                      premiere.status === 'scheduled' ? 'bg-yellow-600 text-white' :
                      'bg-gray-600 text-white'
                    }`}>
                      {premiere.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Start:</span>
                    <span className="text-white">
                      {new Date(premiere.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">End:</span>
                    <span className="text-white">
                      {new Date(premiere.endTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Viewers:</span>
                    <span className="text-white">{premiere.totalViewers}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Premiere Modal */}
        {showCreateModal && (
          <CreatePremiereModal
            videos={videos}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedVideo(null);
            }}
            onSubmit={handleCreatePremiere}
            selectedVideo={selectedVideo}
            onVideoSelect={setSelectedVideo}
          />
        )}
      </div>
    </div>
  );
};

interface CreatePremiereModalProps {
  videos: Video[];
  onClose: () => void;
  onSubmit: (data: CreatePremiereData) => void;
  selectedVideo: Video | null;
  onVideoSelect: (video: Video) => void;
}

const CreatePremiereModal: React.FC<CreatePremiereModalProps> = ({
  videos,
  onClose,
  onSubmit,
  selectedVideo,
  onVideoSelect
}) => {
  const [formData, setFormData] = useState<CreatePremiereData>({
    videoId: '',
    title: '',
    description: '',
    startTime: '',
    duration: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVideo) {
      onSubmit({
        ...formData,
        videoId: selectedVideo._id,
        title: formData.title || selectedVideo.title,
        description: formData.description || selectedVideo.description,
        duration: formData.duration || selectedVideo.duration
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-netflix-gray rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Create Premiere</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Selection */}
          <div>
            <label className="block text-white text-lg font-medium mb-4">
              Select Video for Premiere
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto border border-gray-600 rounded-lg p-4">
              {videos.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 py-8">
                  No videos available. Please upload some videos first.
                </div>
              ) : (
                videos.map((video) => (
                  <div
                    key={video._id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedVideo?._id === video._id
                        ? 'border-netflix-red bg-red-900/20 shadow-lg'
                        : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800/50'
                    }`}
                    onClick={() => onVideoSelect(video)}
                  >
                    <div className="aspect-video bg-gray-700 rounded mb-3 flex items-center justify-center">
                      {video.processedFiles?.poster ? (
                        <img
                          src={videoService.getPosterUrl(video)}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className="text-gray-400 text-4xl">🎬</div>
                      )}
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1 line-clamp-2">{video.title}</h4>
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">{video.description}</p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                      <span>{video.resolution}</span>
                    </div>
                    {selectedVideo?._id === video._id && (
                      <div className="mt-2 text-center">
                        <span className="text-netflix-red text-sm font-medium">✓ Selected</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            {selectedVideo && (
              <div className="mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <p className="text-green-300 text-sm">
                  <strong>Selected:</strong> {selectedVideo.title}
                </p>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Premiere Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              placeholder={selectedVideo?.title || 'Enter premiere title'}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              rows={3}
              placeholder={selectedVideo?.description || 'Enter premiere description'}
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Start Time (Leave empty for immediate start)
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Duration (seconds)
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              placeholder={selectedVideo?.duration?.toString() || 'Enter duration in seconds'}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedVideo}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Premiere
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPremiereDashboard;
