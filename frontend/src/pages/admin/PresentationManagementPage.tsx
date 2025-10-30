import React from 'react';
import AdminPresentationDashboard from '../../components/presentation/AdminPresentationDashboard';

const PresentationManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Presentation Management</h1>
          <p className="text-gray-400">Upload, manage, and monitor presentations</p>
        </div>
        <AdminPresentationDashboard />
      </div>
    </div>
  );
};

export default PresentationManagementPage;

