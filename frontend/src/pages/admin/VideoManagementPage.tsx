import React from 'react';
import AdminVideoDashboard from '../../components/video/AdminVideoDashboard';

const VideoManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Video Management</h1>
          <p className="text-gray-400">Upload, manage, and monitor videos</p>
        </div>
        <AdminVideoDashboard />
      </div>
    </div>
  );
};

export default VideoManagementPage;

