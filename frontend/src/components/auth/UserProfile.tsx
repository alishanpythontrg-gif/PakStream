import React from 'react';
import { User } from '../../types/auth';

interface UserProfileProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout }) => {
  return (
    <div className="absolute right-0 top-12 bg-netflix-gray rounded-lg shadow-xl border border-gray-700 w-64 z-50">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-netflix-red rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-white font-semibold">{user.username}</div>
            <div className="text-gray-400 text-sm">{user.email}</div>
            {user.role === 'admin' && (
              <div className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-1">
                Admin
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-4">
          <button
            onClick={onLogout}
            className="w-full text-left text-white hover:bg-gray-700 px-3 py-2 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
