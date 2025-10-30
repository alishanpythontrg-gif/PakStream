import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  // Redirect to users page by default
  return <Navigate to="/admin/users" replace />;
};

export default AdminDashboard;

