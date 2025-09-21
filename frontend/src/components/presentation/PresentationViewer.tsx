import React, { useState, useEffect, useRef } from 'react';
import { Presentation, PresentationSlide } from '../../types/presentation';
import presentationService from '../../services/presentationService';

interface PresentationViewerProps {
  presentation: Presentation;
  onClose: () => void;
}

const PresentationViewer: React.FC<PresentationViewerProps> = ({ presentation, onClose }) => {
  const [slides, setSlides] = useState<PresentationSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadSlides();
    
    // Auto-hide controls
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= slides.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 3000); // 3 seconds per slide
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, slides.length]);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const response = await presentationService.getPresentationSlides(presentation._id);
      setSlides(response.slides);
    } catch (error) {
      console.error('Failed to load slides:', error);
      setError('Failed to load presentation slides');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevSlide();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        togglePlay();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [currentSlide, slides.length]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Slides Found</h3>
          <p className="text-gray-400 mb-4">This presentation has no slides available.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      {showControls && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent z-10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-xl font-semibold truncate max-w-md">
                {presentation.title}
              </h1>
              <p className="text-gray-400 text-sm">
                Slide {currentSlide + 1} of {slides.length}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 text-2xl transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-gray-300 text-2xl transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? '⤢' : '⤡'}
              </button>
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 text-3xl transition-colors"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Slide Display */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-6xl max-h-full">
          <img
            src={presentationService.getImageUrl(presentation._id, currentSlide + 1)}
            alt={`Slide ${currentSlide + 1}`}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM2QjcyODAiLz4KPHN2ZyB4PSIzNjAiIHk9IjI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiB2aWV3Qm94PSIwIDAgODAgODAiIGZpbGw9Im5vbmUiPgo8cGF0aCBkPSJNMzAgMjBINDBWNDBIMzBWMjBaIiBmaWxsPSIjRkZGRkZGIi8+CjxwYXRoIGQ9Ik0yMCAzMEg0MFY1MEgyMFYzMFoiIGZpbGw9IiNGRkZGRkYiLz4KPHN2ZyB4PSI1MCIgeT0iNDAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIzMCIgdmlld0JveD0iMCAwIDMwIDMwIiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTQgNEgyNlYyNkg0VjRaIiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4KPC9zdmc+';
            }}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent z-10 p-4">
          <div className="flex items-center justify-between">
            {/* Previous/Next Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed text-2xl transition-colors"
                title="Previous Slide"
              >
                ⬅️
              </button>
              
              <button
                onClick={nextSlide}
                disabled={currentSlide === slides.length - 1}
                className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed text-2xl transition-colors"
                title="Next Slide"
              >
                ➡️
              </button>
            </div>

            {/* Slide Thumbnails */}
            <div className="flex-1 flex justify-center space-x-2 max-w-2xl mx-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-16 h-12 rounded overflow-hidden transition-all ${
                    index === currentSlide
                      ? 'ring-2 ring-red-500 scale-110'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  title={`Go to slide ${index + 1}`}
                >
                  <img
                    src={presentationService.getSlideThumbnailUrl(presentation._id, index + 1)}
                    alt={`Slide ${index + 1} thumbnail`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA2NCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0yOCAyMEgzNlYyOEgyOFYyMFoiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+';
                    }}
                  />
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 text-2xl transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showControls && (
        <div className="absolute top-16 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg">
          <div className="space-y-1">
            <div>← → Navigate slides</div>
            <div>Space Play/Pause</div>
            <div>F Fullscreen</div>
            <div>Esc Close</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationViewer;
