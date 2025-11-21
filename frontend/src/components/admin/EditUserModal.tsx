import React, { useState, useEffect } from 'react';
import { User, UpdateUserData } from '../../types/user';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSubmit: (userId: string, userData: UpdateUserData) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onSubmit }) => {
  const [formData, setFormData] = useState<UpdateUserData>({
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    profile: {
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      bio: user.profile?.bio || ''
    },
    organization: user.organization || '',
    dateOfEnrollment: user.dateOfEnrollment ? new Date(user.dateOfEnrollment).toISOString().split('T')[0] : '',
    contactNumber: user.contactNumber || '',
    address: user.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          bio: user.profile?.bio || ''
        },
        organization: user.organization || '',
        dateOfEnrollment: user.dateOfEnrollment ? new Date(user.dateOfEnrollment).toISOString().split('T')[0] : '',
        contactNumber: user.contactNumber || '',
        address: user.address || ''
      });
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(user._id, formData);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-netflix-gray rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'user' | 'admin' })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Status *
              </label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              >
                <option value="true">Active</option>
                <option value="false">Blocked</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                First Name
              </label>
              <input
                type="text"
                value={formData.profile?.firstName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, firstName: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.profile?.lastName || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  profile: { ...formData.profile, lastName: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Bio
            </label>
            <textarea
              value={formData.profile?.bio || ''}
              onChange={(e) => setFormData({
                ...formData,
                profile: { ...formData.profile, bio: e.target.value }
              })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization || ''}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                placeholder="Organization name"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Date of Enrollment
              </label>
              <input
                type="date"
                value={formData.dateOfEnrollment || ''}
                onChange={(e) => setFormData({ ...formData, dateOfEnrollment: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                value={formData.contactNumber || ''}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Address/Location
              </label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                placeholder="Full address or location"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;

