import React from 'react';

interface VideoThumbnail {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

const VideoGrid: React.FC = () => {
  // Mock data for demonstration
  const mockVideos: VideoThumbnail[] = Array.from({ length: 12 }, (_, i) => ({
    id: `video-${i + 1}`,
    title: `Sample Video ${i + 1}`,
    thumbnail: `https://via.placeholder.com/300x200/333333/FFFFFF?text=Video+${i + 1}`,
    duration: `${Math.floor(Math.random() * 60) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
  }));

  return (
    <section className="py-16 px-4 bg-netflix-black">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-white">Featured Videos</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {mockVideos.map((video) => (
            <div key={video.id} className="video-thumbnail group">
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 md:h-40 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-white truncate">{video.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoGrid;
