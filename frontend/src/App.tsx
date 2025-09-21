import React, { useState, useEffect } from 'react';
import { AuthProvider } from './hooks';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import VideoGrid from './components/video/VideoGrid';
import VideoPlayer from './components/video/VideoPlayer';
import AdminVideoDashboard from './components/video/AdminVideoDashboard';
import AdminPremiereDashboard from './components/premiere/AdminPremiereDashboard';
import LivePremiere from './components/premiere/LivePremiere';
import ScheduledPremiere from './components/premiere/ScheduledPremiere';
import videoService from './services/videoService';
import premiereService from './services/premiereService';
import { Video } from './types/video';
import { Premiere } from './types/premiere';
import './index.css';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [activePremiere, setActivePremiere] = useState<Premiere | null>(null);
  const [showPremiere, setShowPremiere] = useState(false);

  useEffect(() => {
    fetchVideos();
    checkActivePremiere();
    
    // Check for active premiere every 30 seconds
    const interval = setInterval(checkActivePremiere, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await videoService.getVideos({ limit: 12 });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActivePremiere = async () => {
    try {
      const response = await premiereService.getActivePremiere();
      if (response.data.premiere) {
        setActivePremiere(response.data.premiere);
        setShowPremiere(true);
      } else {
        setActivePremiere(null);
        setShowPremiere(false);
      }
    } catch (error) {
      console.error('Failed to check active premiere:', error);
    }
  };

  const handleVideoClick = (video: Video) => {
    // Don't show video player if there's an active premiere
    if (activePremiere) {
      return;
    }
    
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
    setShowVideoPlayer(false);
  };

  const handleClosePremiere = () => {
    setShowPremiere(false);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-netflix-black">
        <Navbar />
        <main className="pt-16">
          <HeroSection />
          
          {/* Featured Videos Section */}
          <section className="py-16 px-4 bg-netflix-black">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-white">Featured Videos</h2>
              <VideoGrid
                videos={videos}
                loading={loading}
                onVideoClick={handleVideoClick}
              />
            </div>
          </section>

          {/* Admin Video Dashboard - Only visible to admins */}
          <AdminVideoDashboard />
          
          {/* Admin Premiere Dashboard - Only visible to admins */}
          <AdminPremiereDashboard />
        </main>

        {/* Live Premiere Overlay */}
        {showPremiere && activePremiere && premiereService.isPremiereLive(activePremiere) && (
          <LivePremiere
            premiere={activePremiere}
            onClose={handleClosePremiere}
          />
        )}

        {/* Scheduled Premiere Overlay */}
        {showPremiere && activePremiere && premiereService.isPremiereScheduled(activePremiere) && (
          <ScheduledPremiere
            premiere={activePremiere}
            onClose={handleClosePremiere}
          />
        )}

        {/* Inline Video Player */}
        {showVideoPlayer && selectedVideo && !activePremiere && (
          <div className="fixed inset-0 bg-black bg-opacity-95 z-50">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-4 bg-netflix-black border-b border-gray-600">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedVideo.title}</h2>
                  <p className="text-gray-400 text-sm">{selectedVideo.category} • {selectedVideo.views} views</p>
                </div>
                <button
                  onClick={handleCloseVideo}
                  className="text-gray-400 hover:text-white text-2xl p-2"
                >
                  ×
                </button>
              </div>

              {/* Video Player */}
              <div className="flex-1 flex">
                <div className="flex-1">
                  <VideoPlayer
                    video={selectedVideo}
                    autoPlay={true}
                    controls={true}
                    className="h-full"
                    onClose={handleCloseVideo}
                  />
                </div>

                {/* Video Info Sidebar */}
                <div className="w-80 bg-netflix-gray p-6 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                      <p className="text-gray-300 text-sm">{selectedVideo.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration:</span>
                          <span className="text-white">{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Resolution:</span>
                          <span className="text-white">{selectedVideo.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="text-white capitalize">{selectedVideo.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Uploaded by:</span>
                          <span className="text-white">{selectedVideo.uploadedBy.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Upload date:</span>
                          <span className="text-white">{new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedVideo.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-700 text-white text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">Actions</h3>
                      <div className="space-y-2">
                        <button className="w-full btn-primary text-sm">
                          Add to My List
                        </button>
                        <button className="w-full btn-secondary text-sm">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthProvider>
  );
}

export default App;
