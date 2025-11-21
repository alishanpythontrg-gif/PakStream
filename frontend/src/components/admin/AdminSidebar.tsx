import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin/users', label: 'User Management', icon: '👥' },
    { path: '/admin/videos', label: 'Video Management', icon: '🎬' },
    { path: '/admin/presentations', label: 'Presentation Management', icon: '📊' },
    { path: '/admin/documents', label: 'Document Management', icon: '📄' },
    { path: '/admin/premieres', label: 'Premiere Management', icon: '🎭' },
    { path: '/admin/downloads', label: 'Download Management', icon: '⬇️' },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-netflix-gray border-r border-gray-800 flex flex-col z-30">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="text-2xl font-bold text-netflix-red mb-2">
          🎬 PakStream
        </div>
        <div className="text-xs text-gray-400">Admin Dashboard</div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-netflix-red text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-netflix-red rounded-full flex items-center justify-center text-white font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{user?.username}</div>
            <div className="text-xs text-gray-400">Administrator</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="block w-full text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;

