import React, { useState, useEffect } from 'react';
import { AuthProvider } from './hooks';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import VideoGrid from './components/video/VideoGrid';
import AdminVideoDashboard from './components/video/AdminVideoDashboard';
import videoService from './services/videoService';
import { Video } from './types/video';
import './index.css';

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    fetchVideos();
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

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
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
        </main>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-6xl max-h-[90vh] bg-netflix-gray rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-600">
                <h2 className="text-xl font-bold text-white">{selectedVideo.title}</h2>
                <button
                  onClick={handleCloseVideo}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={videoService.getVideoUrl(selectedVideo, '720p')}
                    controls
                    className="w-full h-full"
                    poster={videoService.getPosterUrl(selectedVideo)}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 text-white">
                  <h3 className="text-lg font-semibold mb-2">{selectedVideo.title}</h3>
                  <p className="text-gray-300 mb-4">{selectedVideo.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{selectedVideo.views} views</span>
                    <span>{selectedVideo.category}</span>
                    <span>{selectedVideo.duration}s</span>
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
