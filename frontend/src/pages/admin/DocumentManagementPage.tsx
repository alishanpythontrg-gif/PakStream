import React from 'react';
import AdminDocumentDashboard from '../../components/document/AdminDocumentDashboard';

const DocumentManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Document Management</h1>
          <p className="text-gray-400">Upload, manage, and monitor PDF documents</p>
        </div>
        <AdminDocumentDashboard />
      </div>
    </div>
  );
};

export default DocumentManagementPage;

