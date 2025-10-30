import React from 'react';
import AdminPremiereDashboard from '../../components/premiere/AdminPremiereDashboard';

const PremiereManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Premiere Management</h1>
          <p className="text-gray-400">Create and manage live and scheduled premieres</p>
        </div>
        <AdminPremiereDashboard />
      </div>
    </div>
  );
};

export default PremiereManagementPage;

