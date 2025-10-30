import React, { useState, useEffect } from 'react';
import HeroSection from '../../components/HeroSection';
import VideoGrid from '../../components/video/VideoGrid';
import PresentationGrid from '../../components/presentation/PresentationGrid';
import VideoPlayer from '../../components/video/VideoPlayer';
import PresentationViewer from '../../components/presentation/PresentationViewer';
import LivePremiere from '../../components/premiere/LivePremiere';
import ScheduledPremiere from '../../components/premiere/ScheduledPremiere';
import VideoProcessingStatus from '../../components/video/VideoProcessingStatus';
import videoService from '../../services/videoService';
import presentationService from '../../services/presentationService';
import premiereService from '../../services/premiereService';
import { Video } from '../../types/video';
import { Presentation } from '../../types/presentation';
import { Premiere } from '../../types/premiere';

const UserHomePage: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showPresentationViewer, setShowPresentationViewer] = useState(false);
  const [activePremiere, setActivePremiere] = useState<Premiere | null>(null);
  const [showPremiere, setShowPremiere] = useState(false);

  useEffect(() => {
    initializeApp();
    const interval = setInterval(checkActivePremiere, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchVideos(),
        fetchPresentations(),
        checkActivePremiere()
      ]);
    } catch (error) {
      console.error('Failed to initialize app:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await videoService.getVideos({ limit: 12 });
      setVideos(response.data.videos);
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const fetchPresentations = async () => {
    try {
      const response = await presentationService.getPresentations({ limit: 12 });
      setPresentations(response.presentations);
    } catch (error) {
      console.error('Failed to fetch presentations:', error);
    }
  };

  const checkActivePremiere = async () => {
    try {
      const response = await premiereService.getActivePremiere();
      
      if (response.data.premiere) {
        setActivePremiere(prev => {
          if (prev && prev._id === response.data.premiere._id) {
            if (prev.status !== response.data.premiere.status) {
              return response.data.premiere;
            }
            return prev;
          }
          return response.data.premiere;
        });
        setShowPremiere(true);
      } else {
        if (activePremiere !== null) {
          setActivePremiere(null);
          setShowPremiere(false);
        }
      }
    } catch (error) {
      console.error('Failed to check active premiere:', error);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const handlePresentationClick = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setShowPresentationViewer(true);
  };

  const handleCloseVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
  };

  const handleClosePresentationViewer = () => {
    setShowPresentationViewer(false);
    setSelectedPresentation(null);
  };

  const handleClosePremiere = () => {
    setShowPremiere(false);
    setActivePremiere(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading PakStream...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
              onCountdownFinish={checkActivePremiere}
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
            loading={loading}
            onVideoClick={handleVideoClick}
          />
        </div>
      </section>

      {/* Presentations Section */}
      <section id="presentations" className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-8">Presentations</h2>
          <PresentationGrid 
            presentations={presentations} 
            onPresentationClick={handlePresentationClick}
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

      {/* Video Player Modal */}
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

      {/* Presentation Viewer Modal */}
      {showPresentationViewer && selectedPresentation && (
        <PresentationViewer
          presentation={selectedPresentation}
          onClose={handleClosePresentationViewer}
        />
      )}

      {/* Video Processing Status */}
      <VideoProcessingStatus 
        onVideoReady={(videoId) => {
          console.log('Video ready:', videoId);
          fetchVideos();
        }}
      />
    </>
  );
};

export default UserHomePage;

