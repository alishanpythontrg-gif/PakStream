import React, { useState, useEffect } from 'react';
import edgeServerService from '../../services/edgeServerService';
import { EdgeServer } from '../../types/edgeServer';
import CreateEdgeServerModal from './CreateEdgeServerModal';
import EditEdgeServerModal from './EditEdgeServerModal';

const EdgeServerManagement: React.FC = () => {
  const [servers, setServers] = useState<EdgeServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedServer, setSelectedServer] = useState<EdgeServer | null>(null);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await edgeServerService.getEdgeServers();
      setServers(response.data.servers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch edge servers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (serverData: any) => {
    try {
      await edgeServerService.registerEdgeServer(serverData);
      setShowCreateModal(false);
      fetchServers();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create edge server');
    }
  };

  const handleUpdateServer = async (serverId: string, serverData: any) => {
    try {
      await edgeServerService.updateEdgeServer(serverId, serverData);
      setShowEditModal(false);
      setSelectedServer(null);
      fetchServers();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update edge server');
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!window.confirm('Are you sure you want to delete this edge server?')) {
      return;
    }
    
    try {
      await edgeServerService.deleteEdgeServer(serverId);
      fetchServers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete edge server');
    }
  };

  const handleManualSync = async (videoId: string) => {
    try {
      await edgeServerService.syncVideo(videoId);
      alert('Video sync initiated successfully');
    } catch (err: any) {
      alert(`Failed to sync video: ${err.message}`);
    }
  };

  const openEditModal = (server: EdgeServer) => {
    setSelectedServer(server);
    setShowEditModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900 text-green-200';
      case 'inactive':
        return 'bg-gray-700 text-gray-300';
      case 'error':
        return 'bg-red-900 text-red-200';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Edge Server Management</h2>
        <p className="text-gray-400">Manage CDN edge servers for offline/intranet deployment</p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-netflix-gray rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">What are Edge Servers?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <h4 className="font-semibold text-white mb-2">Purpose</h4>
            <p className="text-sm">
              Edge servers act as local CDN nodes. When you upload a video, it's automatically 
              pushed to all active edge servers, reducing load on the origin server.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Benefits</h4>
            <ul className="text-sm space-y-1">
              <li>✓ Reduced origin server load</li>
              <li>✓ Faster content delivery</li>
              <li>✓ Load balancing</li>
              <li>✓ High availability</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-netflix-gray rounded-lg p-6 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          + Register Edge Server
        </button>
      </div>

      {/* Edge Servers Table */}
      <div className="bg-netflix-gray rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            Loading edge servers...
          </div>
        ) : servers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">No edge servers registered</p>
            <p className="text-sm">Register an edge server to start using the CDN</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Server Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Host</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Last Heartbeat</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {servers.map((server) => (
                  <tr key={server._id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{server.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {server.protocol}://{server.host}:{server.port}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {server.location?.region || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(server.status)}`}>
                        {server.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                      <div>Videos: {server.stats?.videosSynced || 0}</div>
                      <div className="text-xs text-gray-400">Errors: {server.stats?.syncErrors || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {server.lastHeartbeat 
                        ? new Date(server.lastHeartbeat).toLocaleString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(server)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteServer(server._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEdgeServerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateServer}
        />
      )}

      {showEditModal && selectedServer && (
        <EditEdgeServerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedServer(null);
          }}
          server={selectedServer}
          onSubmit={handleUpdateServer}
        />
      )}
    </div>
  );
};

export default EdgeServerManagement;

