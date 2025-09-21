import React, { useState } from 'react';
import { useAuth } from '../hooks';
import LoginModal from './auth/LoginModal';
import RegisterModal from './auth/RegisterModal';
import AdminRegisterModal from './auth/AdminRegisterModal';
import UserProfile from './auth/UserProfile';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showAdminRegisterModal, setShowAdminRegisterModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserProfile(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-netflix-black bg-opacity-95 backdrop-blur-sm z-40 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <div className="text-2xl font-bold text-netflix-red">
                🎬 PakStream
              </div>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => scrollToSection('videos')}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Videos
                </button>
                <button
                  onClick={() => scrollToSection('presentations')}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Presentations
                </button>
                <button
                  onClick={() => scrollToSection('premieres')}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Premieres
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Upload Buttons for Admins */}
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => scrollToSection('admin-videos')}
                        className="btn-primary text-sm"
                      >
                        Upload Video
                      </button>
                      <button
                        onClick={() => scrollToSection('admin-presentations')}
                        className="btn-secondary text-sm"
                      >
                        Upload Presentation
                      </button>
                    </>
                  )}

                  {/* User Profile */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserProfile(!showUserProfile)}
                      className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors"
                    >
                      <div className="w-8 h-8 bg-netflix-red rounded-full flex items-center justify-center">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden md:block">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="hidden md:block text-xs bg-red-600 px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </button>

                    {showUserProfile && (
                      <UserProfile
                        user={user}
                        onClose={() => setShowUserProfile(false)}
                        onLogout={handleLogout}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-white hover:text-gray-300 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="btn-primary"
                  >
                    Sign Up
                  </button>
                  <button
                    onClick={() => setShowAdminRegisterModal(true)}
                    className="btn-secondary text-sm"
                  >
                    Admin Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
        onSwitchToAdminRegister={() => {
          setShowRegisterModal(false);
          setShowAdminRegisterModal(true);
        }}
      />

      <AdminRegisterModal
        isOpen={showAdminRegisterModal}
        onClose={() => setShowAdminRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowAdminRegisterModal(false);
          setShowLoginModal(true);
        }}
        onSwitchToRegister={() => {
          setShowAdminRegisterModal(false);
          setShowRegisterModal(true);
        }}
      />
    </>
  );
};

export default Navbar;
