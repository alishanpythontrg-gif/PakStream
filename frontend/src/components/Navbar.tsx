import React, { useState } from 'react';
import { useAuth } from '../hooks';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import AdminRegisterModal from './auth/AdminRegisterModal';
import UserProfile from './auth/UserProfile';
import VideoUploadModal from './video/VideoUploadModal';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAdminRegister, setShowAdminRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
    setShowRegister(false);
    setShowAdminRegister(false);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setShowLogin(false);
    setShowAdminRegister(false);
  };

  const handleAdminRegisterClick = () => {
    setShowAdminRegister(true);
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleSwitchToLogin = () => {
    setShowLogin(true);
    setShowRegister(false);
    setShowAdminRegister(false);
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
    setShowLogin(false);
    setShowAdminRegister(false);
  };

  const handleSwitchToAdminRegister = () => {
    setShowAdminRegister(true);
    setShowLogin(false);
    setShowRegister(false);
  };

  const closeAllModals = () => {
    setShowLogin(false);
    setShowRegister(false);
    setShowAdminRegister(false);
    setShowProfile(false);
    setShowVideoUpload(false);
  };

  const handleUploadSuccess = () => {
    // You can add logic here to refresh video lists or show success message
    console.log('Video uploaded successfully!');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-netflix-black bg-opacity-95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-netflix-red">PakStream</h1>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-white hover:text-gray-300 transition duration-300">Home</a>
              <a href="#" className="text-white hover:text-gray-300 transition duration-300">Movies</a>
              <a href="#" className="text-white hover:text-gray-300 transition duration-300">TV Shows</a>
              <a href="#" className="text-white hover:text-gray-300 transition duration-300">My List</a>
            </div>
            
            {/* Auth Section */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Admin Upload Button */}
                  {user.role === 'admin' && (
                    <button
                      onClick={() => setShowVideoUpload(true)}
                      className="btn-primary text-sm"
                    >
                      Upload Video
                    </button>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white text-sm">
                      {user.username}
                    </span>
                    {user.role === 'admin' && (
                      <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowProfile(true)}
                    className="text-white hover:text-gray-300 transition duration-300"
                  >
                    Profile
                  </button>
                  <button
                    onClick={logout}
                    className="btn-secondary"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={handleLoginClick}
                    className="btn-secondary"
                  >
                    Login
                  </button>
                  <button 
                    onClick={handleRegisterClick}
                    className="btn-primary"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={showLogin}
        onClose={closeAllModals}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={closeAllModals}
        onSwitchToLogin={handleSwitchToLogin}
        onSwitchToAdminRegister={handleSwitchToAdminRegister}
      />

      <AdminRegisterModal
        isOpen={showAdminRegister}
        onClose={closeAllModals}
        onSwitchToLogin={handleSwitchToLogin}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <UserProfile
        isOpen={showProfile}
        onClose={closeAllModals}
      />

      <VideoUploadModal
        isOpen={showVideoUpload}
        onClose={closeAllModals}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
};

export default Navbar;
