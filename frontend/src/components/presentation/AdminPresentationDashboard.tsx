import React, { useState, useEffect } from 'react';
import { Presentation, CreatePresentationData } from '../../types/presentation';
import presentationService from '../../services/presentationService';
import PresentationVerificationModal from './PresentationVerificationModal';
import ProtectedRoute from '../ProtectedRoute';

const AdminPresentationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'presentations' | 'verification'>('presentations');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [presentationToVerify, setPresentationToVerify] = useState<Presentation | null>(null);
  const [verificationSearch, setVerificationSearch] = useState('');

  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const response = await presentationService.getAdminPresentations();
      setPresentations(response.presentations);
    } catch (error) {
      console.error('Failed to fetch presentations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const response = await presentationService.uploadPresentation(formData);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Wait for processing to complete
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        setShowUploadModal(false);
        fetchPresentations();
        setUploading(false);
      }, 3000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this presentation?')) {
      return;
    }

    try {
      await presentationService.deletePresentation(id);
      fetchPresentations();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleVerifyClick = (presentation: Presentation) => {
    setPresentationToVerify(presentation);
    setShowVerificationModal(true);
  };

  const handleCloseVerification = () => {
    setShowVerificationModal(false);
    setPresentationToVerify(null);
  };

  const filteredPresentationsForVerification = presentations.filter(presentation => {
    const searchLower = verificationSearch.toLowerCase();
    return (
      presentation.title.toLowerCase().includes(searchLower) ||
      presentation.description.toLowerCase().includes(searchLower) ||
      presentation._id.toLowerCase().includes(searchLower)
    );
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      business: 'bg-blue-600',
      education: 'bg-green-600',
      marketing: 'bg-purple-600',
      technology: 'bg-gray-600',
      design: 'bg-pink-600',
      other: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading presentations...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-netflix-black pt-16">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Presentation Management</h1>
              <p className="text-gray-400">Administrators can manage and verify all presentations</p>
            </div>
            {activeTab === 'presentations' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="btn-primary"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Presentation'}
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-700">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('presentations')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'presentations'
                    ? 'text-white border-b-2 border-netflix-red bg-transparent'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📊 Presentations
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'verification'
                    ? 'text-white border-b-2 border-netflix-red bg-transparent'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                ✓ Verification
              </button>
            </div>
          </div>

          {/* Presentations Tab Content */}
          {activeTab === 'presentations' && (
            <div className="space-y-6">

      {/* Upload Progress */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white">Uploading presentation...</span>
            <span className="text-white">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-netflix-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Presentations Grid */}
      {presentations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Presentations</h3>
          <p className="text-gray-400 mb-4">Upload your first presentation to get started.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary"
          >
            Upload Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presentations.map((presentation) => (
            <div key={presentation._id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-700 relative">
                {presentation.thumbnail ? (
                  <img
                    src={presentationService.getThumbnailUrl(presentation._id)}
                    alt={presentation.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl text-gray-500">📊</div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    presentation.status === 'ready' 
                      ? 'bg-green-600 text-white' 
                      : presentation.status === 'processing'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {presentation.status === 'ready' ? 'Ready' : 
                     presentation.status === 'processing' ? 'Processing' : 'Error'}
                  </span>
                </div>

                {/* Category Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getCategoryColor(presentation.category)}`}>
                    {presentation.category}
                  </span>
                </div>

                {/* Slide Count */}
                <div className="absolute bottom-2 right-2">
                  <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                    {presentation.totalSlides} slides
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                  {presentation.title}
                </h3>
                
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {presentation.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                      </svg>
                      {presentation.views}
                    </span>
                    
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      {presentation.likes}
                    </span>
                  </div>
                  
                  <span className="text-xs">
                    {new Date(presentation.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDelete(presentation._id)}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1 border border-red-400 rounded hover:bg-red-400 hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    by {presentation.uploadedBy.username}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

              {/* Upload Modal */}
              {showUploadModal && (
                <PresentationUploadModal
                  onClose={() => setShowUploadModal(false)}
                  onUpload={handleUpload}
                />
              )}
            </div>
          )}

          {/* Verification Tab Content */}
          {activeTab === 'verification' && (
            <div>
              <div className="bg-blue-900 border border-blue-600 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-blue-400 text-xl mr-3">🔒</div>
                  <div>
                    <h3 className="text-blue-400 font-semibold">Presentation Integrity Verification</h3>
                    <p className="text-blue-200 text-sm">
                      Verify that downloaded presentation files match the original by comparing SHA-256 hashes. This helps detect tampering or corruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Search */}
              <div className="bg-netflix-gray p-4 rounded-lg mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Presentations for Verification
                </label>
                <input
                  type="text"
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  placeholder="Search by title, description, or presentation ID..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                />
              </div>

              {/* Presentations List for Verification */}
              <div className="bg-netflix-gray rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Presentation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hash</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-netflix-gray divide-y divide-gray-700">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                            Loading presentations...
                          </td>
                        </tr>
                      ) : filteredPresentationsForVerification.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                            No presentations found
                          </td>
                        </tr>
                      ) : (
                        filteredPresentationsForVerification.map((presentation) => (
                          <tr key={presentation._id} className="hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{presentation.title}</div>
                              <div className="text-sm text-gray-400">{presentation.description.substring(0, 60)}...</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                presentation.status === 'ready' ? 'bg-green-900 text-green-200' :
                                presentation.status === 'processing' ? 'bg-yellow-900 text-yellow-200' :
                                presentation.status === 'error' ? 'bg-red-900 text-red-200' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {presentation.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {presentation.sha256Hash ? (
                                <div className="text-xs font-mono text-gray-400 max-w-xs truncate" title={presentation.sha256Hash}>
                                  {presentation.sha256Hash.substring(0, 16)}...
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Not available</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {presentation.status === 'ready' && presentation.sha256Hash ? (
                                <button
                                  onClick={() => handleVerifyClick(presentation)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Verify
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs">
                                  {presentation.status !== 'ready' ? 'Not ready' : 'No hash'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verification Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-netflix-gray p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">{filteredPresentationsForVerification.length}</div>
                  <div className="text-sm text-gray-400">Total Presentations</div>
                </div>
                <div className="bg-netflix-gray p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredPresentationsForVerification.filter(p => p.sha256Hash).length}
                  </div>
                  <div className="text-sm text-gray-400">With Hash</div>
                </div>
                <div className="bg-netflix-gray p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {filteredPresentationsForVerification.filter(p => p.status === 'ready' && p.sha256Hash).length}
                  </div>
                  <div className="text-sm text-gray-400">Ready to Verify</div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Modal */}
          {presentationToVerify && (
            <PresentationVerificationModal
              isOpen={showVerificationModal}
              onClose={handleCloseVerification}
              presentation={presentationToVerify}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Upload Modal Component
interface PresentationUploadModalProps {
  onClose: () => void;
  onUpload: (formData: FormData) => void;
}

const PresentationUploadModal: React.FC<PresentationUploadModalProps> = ({ onClose, onUpload }) => {
  const [formData, setFormData] = useState<CreatePresentationData>({
    title: '',
    description: '',
    category: 'other',
    tags: []
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a presentation file');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('presentation', selectedFile);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('category', formData.category);
    uploadData.append('tags', formData.tags.join(','));

    onUpload(uploadData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Upload Presentation</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Presentation File
              </label>
              <input
                type="file"
                accept=".ppt,.pptx,.odp"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: .ppt, .pptx, .odp (Max 100MB)
              </p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red"
              >
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="marketing">Marketing</option>
                <option value="technology">Technology</option>
                <option value="design">Design</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-netflix-red text-white text-sm rounded flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-white hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-netflix-red text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPresentationDashboard;
