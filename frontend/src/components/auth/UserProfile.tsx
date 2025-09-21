import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    bio: ''
  });

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        bio: user.profile?.bio || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-netflix-gray rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-netflix-red hover:underline"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
              {user.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
              {user.email}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
              <span className={`px-2 py-1 rounded text-xs ${
                user.role === 'admin' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-blue-600 text-white'
              }`}>
                {user.role.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="firstName"
                value={profileData.firstName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
                {profileData.firstName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                name="lastName"
                value={profileData.lastName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-700 rounded-md text-white">
                {profileData.lastName || 'Not set'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={profileData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-700 rounded-md text-white min-h-[60px]">
                {profileData.bio || 'No bio available'}
              </div>
            )}
          </div>

          {isEditing && (
            <div className="flex space-x-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}

          <div className="pt-4 border-t border-gray-600">
            <button
              onClick={logout}
              className="w-full btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
