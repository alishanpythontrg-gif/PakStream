import React, { useState, useEffect } from 'react';
import { EdgeServer } from '../../types/edgeServer';

interface EditEdgeServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  server: EdgeServer;
  onSubmit: (serverId: string, serverData: any) => Promise<void>;
}

const EditEdgeServerModal: React.FC<EditEdgeServerModalProps> = ({ isOpen, onClose, server, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: server.name,
    host: server.host,
    port: server.port,
    protocol: server.protocol,
    status: server.status,
    capacity: {
      storage: server.capacity?.storage || 0,
      bandwidth: server.capacity?.bandwidth || 0
    },
    location: {
      region: server.location?.region || '',
      datacenter: server.location?.datacenter || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: server.name,
        host: server.host,
        port: server.port,
        protocol: server.protocol,
        status: server.status,
        capacity: {
          storage: server.capacity?.storage || 0,
          bandwidth: server.capacity?.bandwidth || 0
        },
        location: {
          region: server.location?.region || '',
          datacenter: server.location?.datacenter || ''
        }
      });
    }
  }, [isOpen, server]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit(server._id, formData);
    } catch (err: any) {
      setError(err.message || 'Failed to update edge server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-netflix-gray rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Edge Server</h2>
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
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Storage Capacity (GB)
              </label>
              <input
                type="number"
                value={formData.capacity.storage}
                onChange={(e) => setFormData({
                  ...formData,
                  capacity: { ...formData.capacity, storage: parseInt(e.target.value) }
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
                value={formData.capacity.bandwidth}
                onChange={(e) => setFormData({
                  ...formData,
                  capacity: { ...formData.capacity, bandwidth: parseInt(e.target.value) }
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
                value={formData.location.region}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, region: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Datacenter
              </label>
              <input
                type="text"
                value={formData.location.datacenter}
                onChange={(e) => setFormData({
                  ...formData,
                  location: { ...formData.location, datacenter: e.target.value }
                })}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
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
              {loading ? 'Updating...' : 'Update Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEdgeServerModal;

