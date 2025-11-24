import React, { useState, useEffect } from 'react';
import { Document, DocumentUploadData } from '../../types/document';
import documentService from '../../services/documentService';
import DocumentVerificationModal from './DocumentVerificationModal';
import ProtectedRoute from '../ProtectedRoute';

const AdminDocumentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'verification'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [documentToVerify, setDocumentToVerify] = useState<Document | null>(null);
  const [verificationSearch, setVerificationSearch] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentService.getAdminDocuments();
      setDocuments(response.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File, uploadData: DocumentUploadData) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      
      await documentService.uploadDocument(file, uploadData);
      
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
        fetchDocuments();
        setUploading(false);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.deleteDocument(id);
      fetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      academic: 'bg-blue-600',
      business: 'bg-green-600',
      legal: 'bg-purple-600',
      technical: 'bg-gray-600',
      other: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const handleVerifyClick = (document: Document) => {
    setDocumentToVerify(document);
    setShowVerificationModal(true);
  };

  const handleCloseVerification = () => {
    setShowVerificationModal(false);
    setDocumentToVerify(null);
  };

  const filteredDocumentsForVerification = documents.filter(document => {
    const searchLower = verificationSearch.toLowerCase();
    return (
      document.title.toLowerCase().includes(searchLower) ||
      document.description.toLowerCase().includes(searchLower) ||
      document._id.toLowerCase().includes(searchLower)
    );
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white">Loading documents...</p>
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
              <h1 className="text-3xl font-bold text-white mb-2">Admin Document Management</h1>
              <p className="text-gray-400">Administrators can manage and verify all documents</p>
            </div>
            {activeTab === 'documents' && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-netflix-red hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span>Upload Document</span>
              </button>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-700">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'documents'
                    ? 'text-white border-b-2 border-netflix-red bg-transparent'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                📄 Documents
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

          {/* Documents Tab Content */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Documents Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Views</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {documents.map((document) => (
              <tr key={document._id} className="hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{document.title}</div>
                  <div className="text-sm text-gray-400 truncate max-w-xs">{document.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getCategoryColor(document.category)} text-white`}>
                    {document.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    document.status === 'ready' 
                      ? 'bg-green-600 text-white' 
                      : document.status === 'processing'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}>
                    {document.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {document.originalFile?.size ? formatFileSize(document.originalFile.size) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {document.views}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {typeof document.uploadedBy === 'object' ? document.uploadedBy.username : 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleDelete(document._id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

              {/* Upload Modal */}
              {showUploadModal && (
                <DocumentUploadModal
                  onClose={() => setShowUploadModal(false)}
                  onUpload={handleUpload}
                  uploading={uploading}
                  uploadProgress={uploadProgress}
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
                    <h3 className="text-blue-400 font-semibold">Document Integrity Verification</h3>
                    <p className="text-blue-200 text-sm">
                      Verify that downloaded document files match the original by comparing SHA-256 hashes. This helps detect tampering or corruption.
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification Search */}
              <div className="bg-netflix-gray p-4 rounded-lg mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Documents for Verification
                </label>
                <input
                  type="text"
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  placeholder="Search by title, description, or document ID..."
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-netflix-red"
                />
              </div>

              {/* Documents List for Verification */}
              <div className="bg-netflix-gray rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Document</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hash</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-netflix-gray divide-y divide-gray-700">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                            Loading documents...
                          </td>
                        </tr>
                      ) : filteredDocumentsForVerification.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-gray-400">
                            No documents found
                          </td>
                        </tr>
                      ) : (
                        filteredDocumentsForVerification.map((document) => (
                          <tr key={document._id} className="hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-white">{document.title}</div>
                              <div className="text-sm text-gray-400">{document.description.substring(0, 60)}...</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                document.status === 'ready' ? 'bg-green-900 text-green-200' :
                                document.status === 'processing' ? 'bg-yellow-900 text-yellow-200' :
                                document.status === 'error' ? 'bg-red-900 text-red-200' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {document.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {document.sha256Hash ? (
                                <div className="text-xs font-mono text-gray-400 max-w-xs truncate" title={document.sha256Hash}>
                                  {document.sha256Hash.substring(0, 16)}...
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500">Not available</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {document.status === 'ready' && document.sha256Hash ? (
                                <button
                                  onClick={() => handleVerifyClick(document)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  Verify
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs">
                                  {document.status !== 'ready' ? 'Not ready' : 'No hash'}
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
                  <div className="text-2xl font-bold text-white">{filteredDocumentsForVerification.length}</div>
                  <div className="text-sm text-gray-400">Total Documents</div>
                </div>
                <div className="bg-netflix-gray p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {filteredDocumentsForVerification.filter(d => d.sha256Hash).length}
                  </div>
                  <div className="text-sm text-gray-400">With Hash</div>
                </div>
                <div className="bg-netflix-gray p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {filteredDocumentsForVerification.filter(d => d.status === 'ready' && d.sha256Hash).length}
                  </div>
                  <div className="text-sm text-gray-400">Ready to Verify</div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Modal */}
          {documentToVerify && (
            <DocumentVerificationModal
              isOpen={showVerificationModal}
              onClose={handleCloseVerification}
              document={documentToVerify}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

// Upload Modal Component
interface DocumentUploadModalProps {
  onClose: () => void;
  onUpload: (file: File, uploadData: DocumentUploadData) => void;
  uploading: boolean;
  uploadProgress: number;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ onClose, onUpload, uploading, uploadProgress }) => {
  const [formData, setFormData] = useState<DocumentUploadData>({
    title: '',
    description: '',
    category: 'other',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Invalid file type. Please select a PDF file.');
        return;
      }

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File too large. Maximum size is 50MB.');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    onUpload(selectedFile, formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Upload Document</h2>
            <button
              onClick={onClose}
              disabled={uploading}
              className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
            >
              ×
            </button>
          </div>

          {uploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Uploading...</span>
                <span className="text-sm text-gray-300">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-netflix-red h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PDF Document
              </label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                disabled={uploading}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Supported format: PDF (Max 50MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-green-400 mt-1">
                  Selected: {selectedFile.name}
                </p>
              )}
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
                disabled={uploading}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
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
                disabled={uploading}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
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
                disabled={uploading}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
              >
                <option value="academic">Academic</option>
                <option value="business">Business</option>
                <option value="legal">Legal</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                disabled={uploading}
                placeholder="e.g., research, report, analysis"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-netflix-red disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900 bg-opacity-50 border border-red-600 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="flex-1 px-4 py-2 bg-netflix-red text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentDashboard;

