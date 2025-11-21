import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import AdminSidebar from './components/admin/AdminSidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import UserHomePage from './pages/user/UserHomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import VideoManagementPage from './pages/admin/VideoManagementPage';
import PresentationManagementPage from './pages/admin/PresentationManagementPage';
import DocumentManagementPage from './pages/admin/DocumentManagementPage';
import PremiereManagementPage from './pages/admin/PremiereManagementPage';
import LivePremiereControlPage from './pages/admin/LivePremiereControlPage';
import DownloadManagementPage from './pages/admin/DownloadManagementPage';
import socketService from './services/socketService';
import './index.css';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  React.useEffect(() => {
    // Initialize socket connection once for the entire app
    socketService.connect();
  }, []);

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Show regular navbar for non-admin users */}
      {user?.role !== 'admin' && <Navbar />}
      
      {/* Admin Layout with Sidebar */}
      {user?.role === 'admin' && <AdminSidebar />}
      
      <main className={user?.role === 'admin' ? '' : 'flex-1'}>
        <Routes>
          {/* Public/User Routes */}
          <Route path="/" element={<UserHomePage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/videos"
            element={
              <ProtectedRoute requireAdmin>
                <VideoManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/presentations"
            element={
              <ProtectedRoute requireAdmin>
                <PresentationManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/documents"
            element={
              <ProtectedRoute requireAdmin>
                <DocumentManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/premieres"
            element={
              <ProtectedRoute requireAdmin>
                <PremiereManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/premieres/:premiereId/control"
            element={
              <ProtectedRoute requireAdmin>
                <LivePremiereControlPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/downloads"
            element={
              <ProtectedRoute requireAdmin>
                <DownloadManagementPage />
              </ProtectedRoute>
            }
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
