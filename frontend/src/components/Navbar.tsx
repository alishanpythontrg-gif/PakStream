import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks';
import LoginModal from './auth/LoginModal';
import UserProfile from './auth/UserProfile';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleLogout = () => {
    logout();
    setShowUserProfile(false);
    navigate('/');
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-primary bg-opacity-95 backdrop-blur-sm z-40 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-2xl font-bold text-accent">
                🎬 PakStream
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center space-x-6">
                <button
                  onClick={() => scrollToSection('videos')}
                  className="text-text-primary hover:text-text-secondary transition-colors"
                >
                  Videos
                </button>
                <button
                  onClick={() => scrollToSection('presentations')}
                  className="text-text-primary hover:text-text-secondary transition-colors"
                >
                  Presentations
                </button>
                <button
                  onClick={() => scrollToSection('premieres')}
                  className="text-text-primary hover:text-text-secondary transition-colors"
                >
                  Premieres
                </button>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Switcher */}
              <ThemeSwitcher />

              {user ? (
                <div className="flex items-center space-x-4">
                  {/* Admin Dashboard Link */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="btn-primary text-sm"
                    >
                      Admin Dashboard
                    </Link>
                  )}

                  {/* User Profile */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserProfile(!showUserProfile)}
                      className="flex items-center space-x-2 text-text-primary hover:text-text-secondary transition-colors"
                    >
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-text-primary">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden md:block">{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="hidden md:block text-xs bg-accent px-2 py-1 rounded text-text-primary">
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
                    className="btn-primary"
                  >
                    Sign In
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
      />
    </>
  );
};

export default Navbar;
