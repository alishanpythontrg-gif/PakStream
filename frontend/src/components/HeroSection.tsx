import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative h-screen bg-gradient-to-r from-netflix-black via-netflix-gray to-netflix-black">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            Coming Soon
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Your streaming experience awaits...
          </p>
          {/* Hero content will be added later as per user's guidance */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
