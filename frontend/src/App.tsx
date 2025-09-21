import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks';
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

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [activePremiere, setActivePremiere] = useState<Premiere | null>(null);
  const [showPremiere, setShowPremiere] = useState(false);

  useEffect(() => {
    console.log('App mounted, checking for active premiere...');
    fetchVideos();
    checkActivePremiere();
    
    // Check for active premiere every 10 seconds
    const interval = setInterval(checkActivePremiere, 10000);
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
      console.log('Checking for active premiere...');
      const response = await premiereService.getActivePremiere();
      console.log('Active premiere response:', response);
      
      if (response.data.premiere) {
        console.log('Found active premiere:', response.data.premiere);
        setActivePremiere(response.data.premiere);
        setShowPremiere(true);
      } else {
        console.log('No active premiere found');
        setActivePremiere(null);
        setShowPremiere(false);
      }
    } catch (error) {
      console.error('Failed to check active premiere:', error);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  const handleClosePremiere = () => {
    setShowPremiere(false);
    setActivePremiere(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main>
        {/* Live Premiere */}
        {showPremiere && activePremiere && (
          <div className="mb-8">
            {premiereService.isPremiereLive(activePremiere) ? (
              <LivePremiere 
                premiere={activePremiere} 
                onClose={handleClosePremiere}
              />
            ) : premiereService.isPremiereScheduled(activePremiere) ? (
              <ScheduledPremiere 
                premiere={activePremiere} 
                onClose={handleClosePremiere}
              />
            ) : null}
          </div>
        )}

        {/* Hero Section */}
        <HeroSection />

        {/* Videos Section */}
        <section id="videos" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-8">Videos</h2>
            <VideoGrid 
              videos={videos} 
              onVideoClick={handleVideoClick}
            />
          </div>
        </section>

        {/* Premieres Section */}
        <section id="premieres" className="py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-white mb-8">Premieres</h2>
            <div className="text-center text-gray-400">
              <p className="text-lg mb-4">Live and upcoming premieres will appear here</p>
              <p className="text-sm">Check back for exciting new content!</p>
            </div>
          </div>
        </section>

        {/* Video Player Modal - Full Screen */}
        {showVideoPlayer && selectedVideo && (
          <div className="fixed inset-0 bg-black z-50 video-player-fullscreen">
            <VideoPlayer
              video={selectedVideo}
              onClose={handleCloseVideoPlayer}
              autoPlay={true}
              controls={true}
              className="w-full h-full"
            />
          </div>
        )}

        {/* Admin Dashboard */}
        {user?.role === 'admin' && (
          <div className="container mx-auto px-6 py-8">
            <div id="admin-videos">
              <AdminVideoDashboard />
            </div>
            <div id="admin-premieres" className="mt-16">
              <AdminPremiereDashboard />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
