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
  const [isDragging, setIsDragging] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (videoRef.current) {
        videoRef.current.play();
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
        setIsLoading(true);
        setError(null);

        if (!videoRef.current) return;

        const videoElement = videoRef.current;

        // Get HLS URL
        const hlsUrl = videoService.getMasterPlaylistUrl(video);
        console.log('Loading video:', hlsUrl);

        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }

          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hlsRef.current = hls;

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoElement);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed');
            setIsLoading(false);
            
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
              setError(`HLS Error: ${data.type} - ${data.details}`);
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
        } else {
          setError('HLS is not supported in this browser');
        }

        // Set up event listeners
        const handleLoadedMetadata = () => {
          setDuration(videoElement.duration);
          setIsLoading(false);
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
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);
        videoElement.addEventListener('seeked', handleSeeked);
        videoElement.addEventListener('error', handleError);

        // Auto play if requested
        if (autoPlay) {
          videoElement.play().catch(console.error);
        }

        return () => {
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoElement.removeEventListener('timeupdate', handleTimeUpdate);
          videoElement.removeEventListener('play', handlePlay);
          videoElement.removeEventListener('pause', handlePause);
          videoElement.removeEventListener('seeked', handleSeeked);
          videoElement.removeEventListener('error', handleError);
        };

      } catch (err) {
        console.error('Error initializing video:', err);
        setError('Failed to initialize video player');
        setIsLoading(false);
      }
    };

    initializeVideo();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [video, autoPlay, onPlay, onPause, onSeek]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    onSeek?.(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;

    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleMute = () => {
    if (!videoRef.current) return;

    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;

    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  const handleQualityChange = (quality: string) => {
    if (!hlsRef.current) return;

    if (quality === 'auto') {
      hlsRef.current.currentLevel = -1;
    } else {
      const levelIndex = availableQualities.findIndex(q => q === quality) - 1;
      if (levelIndex >= 0) {
        hlsRef.current.currentLevel = levelIndex;
      }
    }
    setSelectedQuality(quality);
    setShowQualityMenu(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 1000);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onSeek?.(newTime);
  };

  if (error) {
    return (
      <div className={`bg-black flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Video Error</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-black group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={videoService.getPosterUrl(video)}
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

      {/* YouTube-style Controls Overlay */}
      {controls && showControls && (
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none">
          {/* Top Controls */}
          <div className="absolute top-0 left-0 right-0 p-4 pointer-events-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl font-semibold truncate max-w-md">{video.title}</h2>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-300 text-3xl p-2 hover:bg-black hover:bg-opacity-50 rounded-full transition-all"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Center Play Button */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <button
                onClick={handlePlayPause}
                className="w-20 h-20 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white text-4xl transition-all backdrop-blur-sm"
              >
                ▶️
              </button>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="mb-4">
              <div 
                className="relative h-1 bg-gray-600 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-0 left-0 h-full bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ width: `${(buffered / duration) * 100}%` }}
                />
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause Button */}
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-gray-300 text-2xl transition-colors"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                {/* Volume Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleMute}
                    className="text-white hover:text-gray-300 text-xl transition-colors"
                  >
                    {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                  </button>
                  <div className="w-20">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Time Display */}
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quality Selector */}
                {availableQualities.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowQualityMenu(!showQualityMenu)}
                      className="text-white hover:text-gray-300 text-sm px-3 py-1 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                    >
                      {selectedQuality}
                    </button>
                    {showQualityMenu && (
                      <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg shadow-lg min-w-32 z-50">
                        {availableQualities.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => handleQualityChange(quality)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                              selectedQuality === quality ? 'text-red-500' : 'text-white'
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Fullscreen Button */}
                <button
                  onClick={handleFullscreen}
                  className="text-white hover:text-gray-300 text-xl transition-colors"
                >
                  {isFullscreen ? '⤢' : '⤡'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
