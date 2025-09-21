import React, { useState } from 'react';
import { useAuth } from '../../hooks';

interface AdminRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}

const AdminRegisterModal: React.FC<AdminRegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  onSwitchToLogin, 
  onSwitchToRegister 
}) => {
  const { registerAdmin, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await registerAdmin({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        adminKey: formData.adminKey
      });
      onClose();
    } catch (error) {
      // Error is handled by the useAuth hook
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-netflix-gray rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Registration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
          </div>

          <div>
            <label htmlFor="adminKey" className="block text-sm font-medium text-gray-300 mb-2">
              Admin Key
            </label>
            <input
              type="password"
              id="adminKey"
              name="adminKey"
              value={formData.adminKey}
              onChange={handleChange}
              required
              placeholder="Enter admin registration key"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
            />
            <p className="text-xs text-gray-400 mt-1">
              Contact system administrator for the admin key
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Admin Account...' : 'Register as Admin'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-400">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-netflix-red hover:underline"
            >
              Login
            </button>
          </p>
          <p className="text-gray-400">
            Regular user?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-netflix-red hover:underline"
            >
              Register as User
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterModal;
