/**
 * Centralized API Configuration
 * 
 * This file provides a single source of truth for API URLs and Socket.IO URLs.
 * It handles environment variables and provides fallback logic for different deployment scenarios.
 * 
 * For Docker/network deployments, set these environment variables:
 * - REACT_APP_API_URL: Full API base URL (e.g., http://192.168.1.100:5000/api)
 * - REACT_APP_SOCKET_URL: Full Socket.IO server URL (e.g., http://192.168.1.100:5000)
 * 
 * If not set, it will attempt to detect the current origin and use relative URLs.
 */

/**
 * Get the API base URL
 * Priority:
 * 1. REACT_APP_API_URL environment variable
 * 2. Current window origin + /api (for relative URLs)
 * 3. Fallback to localhost:5000/api (development)
 */
export function getApiBaseUrl(): string {
  // Check environment variable first
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Try to detect current origin (works when frontend and backend are on same domain/port)
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    // Use relative URL if we're on the same origin
    return `${origin}/api`;
  }

  // Fallback for server-side rendering or when window is not available
  return 'http://localhost:5000/api';
}

/**
 * Get the Socket.IO server URL
 * Priority:
 * 1. REACT_APP_SOCKET_URL environment variable
 * 2. Current window origin (for relative URLs)
 * 3. Fallback to localhost:5000 (development)
 */
export function getSocketUrl(): string {
  // Check environment variable first
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  // Try to detect current origin
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    return origin;
  }

  // Fallback for server-side rendering
  return 'http://localhost:5000';
}

/**
 * Get the base URL for static file uploads (without /api suffix)
 * This is used for constructing URLs to video/presentation files
 */
export function getBaseUrl(): string {
  const apiUrl = getApiBaseUrl();
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, '');
}

/**
 * Construct a URL for a static file (video, presentation, etc.)
 * @param path - Relative path to the file (e.g., '/uploads/videos/processed/123/hls/master.m3u8')
 */
export function getStaticFileUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

// Export constants for convenience
export const API_BASE_URL = getApiBaseUrl();
export const SOCKET_URL = getSocketUrl();
export const BASE_URL = getBaseUrl();

