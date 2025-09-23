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
  const [presentationType, setPresentationType] = useState<'html' | 'slides'>('slides');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    if (isPlaying && presentationType === 'slides') {
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
  }, [isPlaying, slides.length, presentationType]);

  const loadSlides = async () => {
    try {
      setIsLoading(true);
      const response = await presentationService.getPresentationSlides(presentation._id);
      setSlides(response.slides);
      
      // Check if this is an HTML presentation
      // Look for HTML type or check if imagePath ends with .html
      const isHtmlPresentation = response.slides.length === 1 && 
        (response.slides[0].type === 'html' || 
         response.slides[0].imagePath.endsWith('.html'));
      
      if (isHtmlPresentation) {
        setPresentationType('html');
      }
    } catch (error) {
      console.error('Failed to load slides:', error);
      setError('Failed to load presentation slides');
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (presentationType === 'html') {
      // For HTML presentations, we can't control individual slides
      return;
    }
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (presentationType === 'html') {
      // For HTML presentations, we can't control individual slides
      return;
    }
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideIndex: number) => {
    if (presentationType === 'html') {
      return;
    }
    setCurrentSlide(slideIndex);
  };

  const togglePlay = () => {
    if (presentationType === 'html') {
      return;
    }
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
  }, [currentSlide, slides.length, presentationType]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-center text-white p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Presentation Error</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
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
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{presentation.title}</h2>
        <div className="flex items-center space-x-4">
          {presentationType === 'html' && (
            <span className="text-sm text-gray-300">HTML Presentation</span>
          )}
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {presentationType === 'html' ? (
          // HTML Presentation
          <iframe
            ref={iframeRef}
            src={`http://localhost:5000/uploads/${slides[0]?.imagePath}`}
            className="w-full h-full border-0"
            title={presentation.title}
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          // Slide-based Presentation
          <div className="relative w-full h-full">
            {slides.length > 0 && (
              <img
                src={`http://localhost:5000/uploads/${slides[currentSlide]?.imagePath}`}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-contain"
                onError={() => setError('Failed to load slide image')}
              />
            )}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
            {presentationType === 'slides' && (
              <>
                {/* Slide Navigation */}
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-white text-sm">
                    {currentSlide + 1} / {slides.length}
                  </span>
                  
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === slides.length - 1}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
                  >
                    Next →
                  </button>
                </div>

                {/* Play/Pause */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={togglePlay}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded"
                  >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                  </button>
                  
                  <button
                    onClick={toggleFullscreen}
                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded"
                  >
                    {isFullscreen ? '⤢ Exit Fullscreen' : '⤡ Fullscreen'}
                  </button>
                </div>
              </>
            )}

            {presentationType === 'html' && (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={toggleFullscreen}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded"
                >
                  {isFullscreen ? '⤢ Exit Fullscreen' : '⤡ Fullscreen'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Slide Thumbnails (for slide-based presentations) */}
        {presentationType === 'slides' && slides.length > 1 && showControls && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`block w-20 h-12 rounded overflow-hidden ${
                    currentSlide === index ? 'ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={`http://localhost:5000/uploads/${slide.thumbnailPath}`}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresentationViewer;
