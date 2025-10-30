// Application Configuration for Deployment
// Update CORS_ORIGIN here for deployment environments

require('dotenv').config();

/**
 * Get CORS allowed origins
 * Priority: 
 * 1. CORS_ORIGIN environment variable (comma-separated)
 * 2. Environment-specific defaults
 */
function getCorsOrigins() {
  // Check if CORS_ORIGIN is explicitly set in environment
  if (process.env.CORS_ORIGIN) {
    return process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
  }

  // Environment-specific defaults
  if (process.env.NODE_ENV === 'production') {
    // Production: Replace with your actual production domain(s)
    return ['https://yourdomain.com'];
  }

  // Development: Default to localhost and allow local network access
  // This allows access from http://192.168.x.x:3000, http://localhost:3000, etc.
  return ['http://localhost:3000', /^http:\/\/192\.168\.\d+\.\d+:\d+$/, /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/];
}

/**
 * Application Configuration
 */
const appConfig = {
  // CORS Configuration
  cors: {
    origin: getCorsOrigins(),
    credentials: true
  },

  // Socket.IO CORS Configuration
  socketCors: {
    origin: getCorsOrigins(),
    methods: ['GET', 'POST'],
    credentials: true
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pakstream'
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET
  }
};

module.exports = {
  appConfig,
  getCorsOrigins
};

