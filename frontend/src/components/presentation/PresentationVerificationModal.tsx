import React, { useState, useRef } from 'react';
import presentationService from '../../services/presentationService';
import { Presentation } from '../../types/presentation';

interface PresentationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  presentation: Presentation | null;
}

interface VerificationResult {
  verified: boolean;
  providedHash: string;
  storedHash: string;
  message: string;
  verifiedAt: string;
}

const PresentationVerificationModal: React.FC<PresentationVerificationModalProps> = ({
  isOpen,
  onClose,
  presentation
}) => {
  const [verificationMethod, setVerificationMethod] = useState<'file' | 'hash'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hashInput, setHashInput] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presentationHash, setPresentationHash] = useState<string | null>(null);
  const [loadingHash, setLoadingHash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setVerificationResult(null);
    }
  };

  const handleGetHash = async () => {
    if (!presentation) return;

    setLoadingHash(true);
    setError(null);
    try {
      const response = await presentationService.getPresentationHash(presentation._id);
      setPresentationHash(response.data.sha256Hash);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve presentation hash');
    } finally {
      setLoadingHash(false);
    }
  };

  const handleVerify = async () => {
    if (!presentation) return;

    setVerifying(true);
    setError(null);
    setVerificationResult(null);

    try {
      let result;
      if (verificationMethod === 'file') {
        if (!selectedFile) {
          setError('Please select a presentation file');
          setVerifying(false);
          return;
        }
        result = await presentationService.verifyPresentationIntegrity(presentation._id, selectedFile);
      } else {
        if (!hashInput.trim()) {
          setError('Please enter a hash value');
          setVerifying(false);
          return;
        }
        result = await presentationService.verifyPresentationIntegrity(presentation._id, undefined, hashInput);
      }

      setVerificationResult(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to verify presentation integrity');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setVerificationMethod('file');
    setSelectedFile(null);
    setHashInput('');
    setVerificationResult(null);
    setError(null);
    setPresentationHash(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    // You could add a toast notification here
  };

  if (!isOpen || !presentation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Presentation Integrity
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Presentation: <span className="font-semibold">{presentation.title}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Verify that a downloaded presentation file matches the original by comparing its SHA-256 hash.
            </p>
          </div>

          {/* Get Hash Section */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Original Presentation Hash
              </h3>
              <button
                onClick={handleGetHash}
                disabled={loadingHash}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loadingHash ? 'Loading...' : 'Get Hash'}
              </button>
            </div>
            {presentationHash && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white dark:bg-gray-800 rounded text-xs font-mono break-all">
                    {presentationHash}
                  </code>
                  <button
                    onClick={() => copyHashToClipboard(presentationHash)}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                    title="Copy hash"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Use this hash to manually verify presentations using command-line tools (e.g., sha256sum)
                </p>
              </div>
            )}
          </div>

          {/* Verification Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Method
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="file"
                  checked={verificationMethod === 'file'}
                  onChange={(e) => setVerificationMethod(e.target.value as 'file')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Upload Presentation File</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="hash"
                  checked={verificationMethod === 'hash'}
                  onChange={(e) => setVerificationMethod(e.target.value as 'hash')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Enter Hash Manually</span>
              </label>
            </div>
          </div>

          {/* File Upload Method */}
          {verificationMethod === 'file' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Presentation File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ppt,.pptx,.odp"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 dark:text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  dark:file:bg-blue-900 dark:file:text-blue-300
                  dark:hover:file:bg-blue-800"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* Hash Input Method */}
          {verificationMethod === 'hash' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter SHA-256 Hash
              </label>
              <input
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter 64-character hexadecimal hash"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  font-mono text-sm"
              />
              {presentationHash && (
                <button
                  onClick={() => {
                    setHashInput(presentationHash);
                    setVerificationMethod('hash');
                  }}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Use original hash for testing
                </button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className={`mb-4 p-4 rounded-lg ${
              verificationResult.verified
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-3">
                {verificationResult.verified ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-semibold mb-2 ${
                    verificationResult.verified
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {verificationResult.verified ? '✓ Verification Successful' : '✗ Verification Failed'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {verificationResult.message}
                  </p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Provided Hash:</span>
                      <code className="ml-2 p-1 bg-white dark:bg-gray-800 rounded font-mono break-all">
                        {verificationResult.providedHash}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600 dark:text-gray-400">Stored Hash:</span>
                      <code className="ml-2 p-1 bg-white dark:bg-gray-800 rounded font-mono break-all">
                        {verificationResult.storedHash}
                      </code>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                      Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying || (verificationMethod === 'file' && !selectedFile) || (verificationMethod === 'hash' && !hashInput.trim())}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationVerificationModal;

