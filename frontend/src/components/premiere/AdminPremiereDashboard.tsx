import React, { useState, useEffect, useCallback } from 'react';
import { Premiere, CreatePremiereData } from '../../types/premiere';
import { Video } from '../../types/video';
import premiereService from '../../services/premiereService';
import videoService from '../../services/videoService';
import socketService from '../../services/socketService';
import { useAuth } from '../../hooks';

const AdminPremiereDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [premieres, setPremieres] = useState<Premiere[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [activePremiere, setActivePremiere] = useState<Premiere | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setupSocketListeners = useCallback(() => {
    socketService.onPremiereStarted((data) => {
      console.log('Premiere started via socket:', data);
      setActivePremiere(data.premiere);
      fetchData(); // Refresh the list
    });

    socketService.onPremiereEnded((data) => {
      console.log('Premiere ended via socket:', data);
      setActivePremiere(null);
      fetchData(); // Refresh the list
    });

    socketService.onError((error) => {
      console.error('Socket error in admin dashboard:', error);
      setError(error.message || 'Socket connection error');
    });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data for admin premiere dashboard...');
      console.log('User:', user);
      console.log('Token:', token);
      console.log('LocalStorage token:', localStorage.getItem('token'));
      
      // Test video service directly
      console.log('Testing video service...');
      const videosRes = await videoService.getVideos({ limit: 50 });
      console.log('Videos response:', videosRes);
      
      // Filter videos to only include those that are ready and have HLS files
      const readyVideos = videosRes.data.videos.filter(video => 
        video.status === 'ready' && 
        video.processedFiles && 
        video.processedFiles.hls && 
        video.processedFiles.hls.masterPlaylist &&
        video.processedFiles.hls.variants &&
        video.processedFiles.hls.variants.length > 0
      );
      
      console.log(`Filtered ${readyVideos.length} ready videos out of ${videosRes.data.videos.length} total`);
      setVideos(readyVideos);
      
      // Test premiere service
      console.log('Testing premiere service...');
      const [premieresRes, activeRes] = await Promise.all([
        premiereService.getAllPremieres(),
        premiereService.getActivePremiere()
      ]);

      console.log('Premieres response:', premieresRes);
      console.log('Active premiere response:', activeRes);

      setPremieres(premieresRes.data.premieres);
      setActivePremiere(activeRes.data.premiere);
      
      console.log('Videos set:', videosRes.data.videos);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
      setupSocketListeners();
    }
  }, [user, fetchData, setupSocketListeners]);

  const handleCreatePremiere = async (premiereData: CreatePremiereData) => {
    try {
      console.log('Creating premiere with data:', premiereData);
      console.log('Current token:', localStorage.getItem('token'));
      console.log('User role:', user?.role);
      
      if (!user || user.role !== 'admin') {
        alert('You must be logged in as an admin to create premieres');
        return;
      }
      
      const response = await premiereService.createPremiere(premiereData);
      console.log('Premiere created successfully:', response);
      setShowCreateModal(false);
      fetchData();
      alert('Premiere created successfully!');
    } catch (error) {
      console.error('Failed to create premiere:', error);
      alert('Failed to create premiere: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleStartPremiere = async (premiereId: string) => {
    try {
      console.log('Starting premiere:', premiereId);
      socketService.startPremiere(premiereId);
      alert('Premiere started!');
    } catch (error) {
      console.error('Failed to start premiere:', error);
      alert('Failed to start premiere: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleEndPremiere = async (premiereId: string) => {
    try {
      console.log('Ending premiere:', premiereId);
      socketService.endPremiere(premiereId);
      alert('Premiere ended!');
    } catch (error) {
      console.error('Failed to end premiere:', error);
      alert('Failed to end premiere: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDeletePremiere = async (premiereId: string) => {
    if (window.confirm('Are you sure you want to delete this premiere? This action cannot be undone.')) {
      try {
        console.log('Deleting premiere:', premiereId);
        await premiereService.deletePremiere(premiereId);
        alert('Premiere deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Failed to delete premiere:', error);
        alert('Failed to delete premiere: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  // Helper function to get poster URL for premiere video
  const getPremierePosterUrl = (premiere: Premiere): string => {
    if (!premiere.video?.processedFiles?.poster) {
      return '';
    }
    return `${process.env.REACT_APP_API_URL?.replace('/api', '')}/videos/${premiere.video?._id}/hls/${premiere.video?.processedFiles.poster}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Premiere Dashboard</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-netflix-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create Premiere
          </button>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Debug Info:</h3>
          <p>User: {user ? `${user.username} (${user.role})` : 'Not logged in'}</p>
          <p>Token: {token ? 'Present' : 'Missing'}</p>
          <p>Socket Connected: {socketService.isSocketConnected() ? 'Yes' : 'No'}</p>
          <p>LocalStorage Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p>Videos count: {videos.length}</p>
          <p>Premieres count: {premieres.length}</p>
          {error && <p className="text-red-400">Error: {error}</p>}
          <button 
            onClick={fetchData}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Refresh Data
          </button>
        </div>

        {/* Active Premiere */}
        {activePremiere && (
          <div className="mb-8 p-6 bg-gradient-to-r from-red-900/30 to-red-700/30 border border-red-500 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">LIVE PREMIERE</h2>
                <h3 className="text-xl font-semibold">{activePremiere.title}</h3>
                <p className="text-gray-300">{activePremiere.description}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Started: {new Date(activePremiere.startTime).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEndPremiere(activePremiere._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  End Premiere
                </button>
                <button
                  onClick={() => handleDeletePremiere(activePremiere._id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Premiere List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">All Premieres</h2>
          {premieres.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-xl">No premieres created yet</p>
              <p className="text-sm">Create your first premiere to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premieres.filter(premiere => premiere.video && premiere.video.processedFiles).map((premiere) => (
                <div
                  key={premiere._id}
                  className="bg-netflix-gray rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
                >
                  <div className="aspect-video bg-gray-700 flex items-center justify-center">
                    {premiere.video?.processedFiles?.poster ? (
                      <img
                        src={getPremierePosterUrl(premiere)}
                        alt={premiere.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🎬</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{premiere.title}</h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{premiere.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <span>
                        {new Date(premiere.startTime).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        premiere.status === 'live' 
                          ? 'bg-red-600 text-white' 
                          : premiere.status === 'scheduled'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-600 text-white'
                      }`}>
                        {premiere.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {premiere.status === 'scheduled' && (
                        <button
                          onClick={() => handleStartPremiere(premiere._id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {premiere.status === 'live' && (
                        <button
                          onClick={() => handleEndPremiere(premiere._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                        >
                          End
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePremiere(premiere._id)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Premiere Modal */}
        {showCreateModal && (
          <CreatePremiereModal
            videos={videos}
            onSubmit={handleCreatePremiere}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
};

interface CreatePremiereModalProps {
  videos: Video[];
  onSubmit: (data: CreatePremiereData) => void;
  onClose: () => void;
}

const CreatePremiereModal: React.FC<CreatePremiereModalProps> = ({
  videos,
  onSubmit,
  onClose
}) => {
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: ''
  });

  console.log('CreatePremiereModal - videos received:', videos);

  const handleVideoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const videoId = e.target.value;
    setSelectedVideoId(videoId);
    
    // Auto-fill title and description if video is selected
    if (videoId) {
      const selectedVideo = videos.find(v => v._id === videoId);
      if (selectedVideo) {
        setFormData(prev => ({
          ...prev,
          title: prev.title || selectedVideo.title,
          description: prev.description || selectedVideo.description
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', { selectedVideoId, formData });
    
    if (!selectedVideoId) {
      alert('Please select a video');
      return;
    }

    if (!formData.startTime) {
      alert('Please select a start time');
      return;
    }

    const selectedVideo = videos.find(v => v._id === selectedVideoId);
    if (!selectedVideo) {
      alert('Selected video not found');
      return;
    }

    const premiereData: CreatePremiereData = {
      videoId: selectedVideoId,
      title: formData.title || selectedVideo.title,
      description: formData.description || selectedVideo.description,
      startTime: formData.startTime
    };

    console.log('Submitting premiere data:', premiereData);
    onSubmit(premiereData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-netflix-gray rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
          {/* Video Selection - Dropdown */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Select Video for Premiere
            </label>
            <select
              value={selectedVideoId}
              onChange={handleVideoChange}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red border border-gray-600"
              required
            >
              <option value="">Choose a video...</option>
              {videos.map((video) => (
                <option key={video._id} value={video._id}>
                  {video.title} ({video.resolution}) - {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                </option>
              ))}
            </select>
            <div className="mt-1 text-sm text-gray-400">
              {videos.length} ready videos available (showing only fully processed videos)
            </div>
            {videos.length === 0 && (
              <div className="mt-2 p-3 bg-yellow-900/30 border border-yellow-500 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ⚠️ No videos are currently ready for premiere. Please upload and process videos first.
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
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red border border-gray-600"
              placeholder="Enter premiere title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Premiere Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red h-24 resize-none border border-gray-600"
              placeholder="Enter premiere description"
              required
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red border border-gray-600"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
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
