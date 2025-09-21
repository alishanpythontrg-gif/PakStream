import React, { useRef, useEffect, useState } from 'react';
import { Video } from '../../types/video';
import videoService from '../../services/videoService';

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  autoPlay = false, 
  controls = true,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!video || video.status !== 'ready') {
      setError('Video is not ready for playback');
      setIsLoading(false);
      return;
    }

    const initializePlayer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if HLS is supported
        if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          const masterPlaylistUrl = videoService.getMasterPlaylistUrl(video);
          if (masterPlaylistUrl && videoRef.current) {
            videoRef.current.src = masterPlaylistUrl;
            videoRef.current.load();
          }
        } else {
          // Use HLS.js for other browsers
          const Hls = (window as any).Hls;
          if (Hls && Hls.isSupported()) {
            const masterPlaylistUrl = videoService.getMasterPlaylistUrl(video);
            if (masterPlaylistUrl) {
              hlsRef.current = new Hls();
              hlsRef.current.loadSource(masterPlaylistUrl);
              hlsRef.current.attachMedia(videoRef.current);
              
              hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsLoading(false);
              });
              
              hlsRef.current.on(Hls.Events.ERROR, (event: any, data: any) => {
                console.error('HLS error:', data);
                setError('Error loading video');
                setIsLoading(false);
              });
            }
          } else {
            // Fallback to direct video URL
            const videoUrl = videoService.getVideoUrl(video, '720p');
            if (videoUrl && videoRef.current) {
              videoRef.current.src = videoUrl;
              videoRef.current.load();
            }
          }
        }

        // Handle video events
        if (videoRef.current) {
          videoRef.current.addEventListener('loadeddata', () => {
            setIsLoading(false);
          });

          videoRef.current.addEventListener('error', () => {
            setError('Error loading video');
            setIsLoading(false);
          });
        }

      } catch (err) {
        console.error('Player initialization error:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    initializePlayer();

    // Cleanup
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [video]);

  if (video.status !== 'ready') {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="text-4xl mb-4">⏳</div>
          <p>Video is processing...</p>
          {video.status === 'error' && (
            <p className="text-red-400 mt-2">Processing failed</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-netflix-red mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        controls={controls}
        autoPlay={autoPlay}
        className="w-full h-full"
        poster={videoService.getPosterUrl(video)}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
