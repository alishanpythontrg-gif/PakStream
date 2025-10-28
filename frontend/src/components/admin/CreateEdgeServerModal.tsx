import React, { useState } from 'react';
import { CreateEdgeServerData } from '../../types/edgeServer';

interface CreateEdgeServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serverData: CreateEdgeServerData) => Promise<void>;
}

const CreateEdgeServerModal: React.FC<CreateEdgeServerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateEdgeServerData>({
    name: '',
    host: '',
    port: 5000,
    protocol: 'http',
    apiKey: '',
    capacity: {
      storage: 0,
      bandwidth: 0
    },
    location: {
      region: '',
      datacenter: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        host: '',
        port: 5000,
        protocol: 'http',
        apiKey: '',
        capacity: { storage: 0, bandwidth: 0 },
        location: { region: '', datacenter: '' }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create edge server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-netflix-gray rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Register Edge Server</h2>
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
                Server Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
                placeholder="Edge Server 1"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Host/IP Address *
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
                placeholder="192.168.1.100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Port *
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
                min="1"
                max="65535"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Protocol *
              </label>
              <select
                value={formData.protocol}
                onChange={(e) => setFormData({ ...formData, protocol: e.target.value as 'http' | 'https' })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              API Key *
            </label>
            <input
              type="text"
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              required
              placeholder="secret-api-key-123"
            />
            <p className="text-gray-400 text-xs mt-1">
              This key must match the one configured on the edge server
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Storage Capacity (GB)
              </label>
              <input
                type="number"
                value={formData.capacity?.storage || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  capacity: { 
                    storage: parseInt(e.target.value), 
                    bandwidth: formData.capacity?.bandwidth || 0 
                  }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                min="0"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Bandwidth (Mbps)
              </label>
              <input
                type="number"
                value={formData.capacity?.bandwidth || 0}
                onChange={(e) => setFormData({
                  ...formData,
                  capacity: { 
                    storage: formData.capacity?.storage || 0,
                    bandwidth: parseInt(e.target.value) 
                  }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Region
              </label>
              <input
                type="text"
                value={formData.location?.region || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { 
                    region: e.target.value,
                    datacenter: formData.location?.datacenter || ''
                  }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                placeholder="Building A"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Datacenter
              </label>
              <input
                type="text"
                value={formData.location?.datacenter || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { 
                    region: formData.location?.region || '',
                    datacenter: e.target.value 
                  }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                placeholder="Server Room 1"
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
              {loading ? 'Registering...' : 'Register Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEdgeServerModal;

