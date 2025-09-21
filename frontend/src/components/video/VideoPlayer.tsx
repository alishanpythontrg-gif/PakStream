import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Video } from '../../types/video';
import videoService from '../../services/videoService';

interface VideoPlayerProps {
  video: Video;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  onClose?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  video, 
  autoPlay = false, 
  controls = true,
  className = '',
  onClose,
  onPlay,
  onPause,
  onSeek
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current && !isInitializingRef.current) {
        videoRef.current.play().catch(err => {
          console.warn('Play interrupted:', err);
        });
        setIsPlaying(true);
        onPlay?.();
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
        onPause?.();
      }
    },
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
        onSeek?.(time);
      }
    },
    getCurrentTime: () => currentTime,
    getDuration: () => duration,
    isPlaying: () => isPlaying
  }));

  useEffect(() => {
    if (!video) return;

    const initializeVideo = async () => {
      try {
        isInitializingRef.current = true;
        setIsLoading(true);
        setError(null);

        if (!videoRef.current) return;

        const videoElement = videoRef.current;

        // Clean up previous HLS instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        // Reset video element
        videoElement.src = '';
        videoElement.load();

        // Get HLS URL
        const hlsUrl = videoService.getMasterPlaylistUrl(video);
        console.log('Loading video:', hlsUrl);

        if (!hlsUrl) {
          setError('Video not ready for playback');
          setIsLoading(false);
          isInitializingRef.current = false;
          return;
        }

        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            liveSyncDurationCount: 3,
            liveMaxLatencyDurationCount: 5
          });

          hlsRef.current = hls;

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoElement);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed successfully');
            setIsLoading(false);
            isInitializingRef.current = false;
            
            // Set up quality options
            const levels = hls.levels;
            const qualities = levels.map((level, index) => ({
              index,
              height: level.height,
              bitrate: level.bitrate,
              label: `${level.height}p`
            }));
            
            setAvailableQualities(['auto', ...qualities.map(q => q.label)]);
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setError(`Network Error: ${data.details}. Please check your connection and try again.`);
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setError(`Media Error: ${data.details}. The video file may be corrupted.`);
                  break;
                default:
                  setError(`HLS Error: ${data.type} - ${data.details}`);
                  break;
              }
              setIsLoading(false);
              isInitializingRef.current = false;
            }
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
            const level = hls.levels[data.level];
            if (level) {
              setSelectedQuality(`${level.height}p`);
            }
          });

        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoElement.src = hlsUrl;
          setIsLoading(false);
          isInitializingRef.current = false;
        } else {
          setError('HLS is not supported in this browser');
          setIsLoading(false);
          isInitializingRef.current = false;
        }

        // Set up event listeners
        const handleLoadedMetadata = () => {
          setDuration(videoElement.duration);
          setIsLoading(false);
          isInitializingRef.current = false;
        };

        const handleTimeUpdate = () => {
          setCurrentTime(videoElement.currentTime);
          setBuffered(videoElement.buffered.length > 0 ? videoElement.buffered.end(videoElement.buffered.length - 1) : 0);
        };

        const handlePlay = () => {
          setIsPlaying(true);
          onPlay?.();
        };

        const handlePause = () => {
          setIsPlaying(false);
          onPause?.();
        };

        const handleSeeked = () => {
          setCurrentTime(videoElement.currentTime);
          onSeek?.(videoElement.currentTime);
        };

        const handleError = (e: Event) => {
          console.error('Video error:', e);
          setError('Failed to load video');
          setIsLoading(false);
          isInitializingRef.current = false;
        };

        const handleAbort = (e: Event) => {
          console.warn('Video load aborted:', e);
          // Don't set error for abort, it's usually intentional
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('seeked', handleSeeked);
        videoElement.addEventListener('error', handleError);
        videoElement.addEventListener('abort', handleAbort);

        // Auto play if requested and not initializing
        if (autoPlay && !isInitializingRef.current) {
          videoElement.play().catch(err => {
            console.warn('Auto-play failed:', err);
          });
        }

        return () => {
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('pause', handlePause);
          videoElement.removeEventListener('seeked', handleSeeked);
          videoElement.removeEventListener('error', handleError);
          videoElement.removeEventListener('abort', handleAbort);
        };

      } catch (error) {
        console.error('Video initialization error:', error);
        setError('Failed to initialize video player');
        setIsLoading(false);
        isInitializingRef.current = false;
      }
    };

    initializeVideo();

    // Cleanup on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      isInitializingRef.current = false;
    };
  }, [video, autoPlay]);

  // Handle quality change
  const handleQualityChange = (quality: string) => {
    if (!hlsRef.current || quality === 'auto') return;
    
    const levelIndex = availableQualities.findIndex(q => q === quality) - 1;
    if (levelIndex >= 0) {
      hlsRef.current.currentLevel = levelIndex;
      setSelectedQuality(quality);
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!videoRef.current || isInitializingRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => {
        console.warn('Play failed:', err);
      });
    }
  };

  // Handle seek
  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    onSeek?.(time);
  };

  // Handle volume change
  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Handle mute toggle
  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle controls visibility
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  if (error) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Video Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded ml-2"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        preload="metadata"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {controls && showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-600 rounded-full h-1">
              <div 
                className="bg-red-600 h-1 rounded-full transition-all duration-200"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <button onClick={handlePlayPause} className="hover:text-gray-300">
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Volume control */}
              <div className="flex items-center space-x-2">
                <button onClick={handleMuteToggle} className="hover:text-gray-300">
                  {isMuted ? '🔇' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-20"
                />
              </div>

              {/* Quality selector */}
              {availableQualities.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className="hover:text-gray-300"
                  >
                    {selectedQuality}p
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-8 right-0 bg-black bg-opacity-90 rounded p-2 min-w-20">
                      {availableQualities.map(quality => (
                        <button
                          key={quality}
                          onClick={() => {
                            handleQualityChange(quality);
                            setShowQualityMenu(false);
                          }}
                          className={`block w-full text-left px-2 py-1 hover:bg-gray-700 ${
                            quality === selectedQuality ? 'text-red-500' : 'text-white'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={handleFullscreenToggle} className="hover:text-gray-300">
                {isFullscreen ? '⤢' : '⤡'}
              </button>

              {onClose && (
                <button onClick={onClose} className="hover:text-gray-300">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
