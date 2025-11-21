// Storage Configuration
// Supports both local filesystem and MinIO object storage

require('dotenv').config();

const STORAGE_CONFIG = {
  // Storage type: 'local' or 'minio'
  type: process.env.STORAGE_TYPE || 'local',
  
  // MinIO configuration
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    bucketName: process.env.MINIO_BUCKET_NAME || 'pakstream-videos',
    // Public URL for serving files (if MinIO is exposed directly)
    publicUrl: process.env.MINIO_PUBLIC_URL || null
  },
  
  // Local storage paths
  local: {
    videosPath: process.env.LOCAL_VIDEOS_PATH || 'uploads/videos',
    presentationsPath: process.env.LOCAL_PRESENTATIONS_PATH || 'uploads/presentations'
  }
};

/**
 * Check if MinIO storage is enabled
 * @returns {boolean}
 */
function isMinIOEnabled() {
  return STORAGE_CONFIG.type === 'minio';
}

/**
 * Check if local storage is enabled
 * @returns {boolean}
 */
function isLocalStorageEnabled() {
  return STORAGE_CONFIG.type === 'local';
}

/**
 * Get storage configuration
 * @returns {Object}
 */
function getStorageConfig() {
  return STORAGE_CONFIG;
}

module.exports = {
  STORAGE_CONFIG,
  isMinIOEnabled,
  isLocalStorageEnabled,
  getStorageConfig
};

