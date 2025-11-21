import React from 'react';
import AdminDownloadDashboard from '../../components/admin/AdminDownloadDashboard';

const DownloadManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Download Management</h1>
          <p className="text-gray-400">Track and monitor video downloads</p>
        </div>
        <AdminDownloadDashboard />
      </div>
    </div>
  );
};

export default DownloadManagementPage;

