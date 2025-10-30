import React from 'react';
import AdminUserManagement from '../../components/admin/AdminUserManagement';

const UserManagementPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
        </div>
        <AdminUserManagement />
      </div>
    </div>
  );
};

export default UserManagementPage;

