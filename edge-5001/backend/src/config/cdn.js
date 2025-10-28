// Local Cache/CDN Configuration for Offline/Intranet Environment
// Optimized for air-gapped networks without internet access

const CDN_CONFIG = {
  // Enable/disable local caching optimization
  enabled: process.env.LOCAL_CACHE_ENABLED !== 'false', // Enabled by default
  
  // Static files base URL (localhost or intranet domain)
  baseUrl: process.env.STATIC_FILES_URL || '',
  
  // Local cache optimization settings
  localCache: {
    // Cache control settings for local/offline network
    enabled: true,
    maxAge: 31536000, // 1 year (static files don't change)
    cacheInMemory: false, // Set to true to enable in-memory caching
  },
  
  // Cache control settings optimized for offline/local network
  cacheControl: {
    videos: {
      original: 'public, max-age=31536000, immutable', // 1 year - files don't change
      hlsSegments: 'public, max-age=31536000, immutable', // 1 year - segments immutable
      hlsPlaylists: 'public, max-age=3600', // Cache playlists for 1 hour locally
      thumbnails: 'public, max-age=31536000, immutable', // 1 year - immutable
    },
    presentations: {
      slides: 'public, max-age=31536000, immutable', // 1 year - slides don't change
      thumbnails: 'public, max-age=31536000, immutable', // 1 year - immutable
    },
    static: {
      default: 'public, max-age=86400', // 1 day for other static files
    }
  }
};

/**
 * Get static file URL for a given file path
 * Supports multiple edge servers with load balancing
 * @param {string} filePath - Relative path to the file (e.g., 'videos/processed/123/hls/master.m3u8')
 * @returns {string} - Full URL or relative path
 */
async function getCdnUrl(filePath) {
  // Try to get active edge servers
  try {
    const EdgeServer = require('../models/EdgeServer');
    const activeServers = await EdgeServer.find({ status: 'active' }).lean();
    
    if (activeServers.length > 0) {
      // Load balance across edge servers (round-robin based on filename hash)
      const hash = filePath.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const selectedServer = activeServers[hash % activeServers.length];
      
      const baseUrl = `${selectedServer.protocol}://${selectedServer.host}:${selectedServer.port}`;
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      return `${baseUrl}/uploads/${normalizedPath}`;
    }
  } catch (error) {
    console.error('Error getting edge servers:', error);
  }
  
  // If base URL is configured, use it (for intranet deployment)
  if (CDN_CONFIG.baseUrl) {
    const baseUrl = CDN_CONFIG.baseUrl.endsWith('/') 
      ? CDN_CONFIG.baseUrl.slice(0, -1) 
      : CDN_CONFIG.baseUrl;
    
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    return `${baseUrl}/uploads/${normalizedPath}`;
  }
  
  // Return relative path for same-origin requests (offline/local environment)
  return `/uploads/${filePath}`;
}

/**
 * Check if local caching is enabled
 * @returns {boolean}
 */
function isCdnEnabled() {
  return CDN_CONFIG.enabled;
}

/**
 * Get cache control header for a file type
 * @param {string} fileType - Type of file ('videos.original', 'videos.hlsSegments', etc.)
 * @returns {string} - Cache-Control header value
 */
function getCacheControl(fileType) {
  const parts = fileType.split('.');
  let cache = CDN_CONFIG.cacheControl;
  
  for (const part of parts) {
    cache = cache[part];
    if (!cache) return CDN_CONFIG.cacheControl.static.default;
  }
  
  return cache;
}

module.exports = {
  CDN_CONFIG,
  getCdnUrl,
  isCdnEnabled,
  getCacheControl
};

