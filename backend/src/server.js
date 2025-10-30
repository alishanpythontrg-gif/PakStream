// Load environment variables first
require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const SocketHandler = require('./socket/socketHandler');
const { appConfig } = require('./config/appConfig');

const app = express();
const server = http.createServer(app);
const socketHandler = new SocketHandler(server);

// Initialize video queue with socket.io
const videoQueue = require('./services/videoQueue');
videoQueue.setSocketIO(socketHandler.io);

// Middleware - CORS configuration from appConfig
app.use(cors(appConfig.cors));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(appConfig.database.uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Helper function to check if origin matches allowed origins (including regex patterns)
function isOriginAllowed(origin, allowedOrigins) {
  if (!origin) return false;
  
  for (const allowed of allowedOrigins) {
    if (typeof allowed === 'string') {
      if (allowed === origin) return true;
    } else if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return true;
    }
  }
  return false;
}

// Serve static files with proper headers for HLS
app.use('/uploads/videos', (req, res, next) => {
  // Set CORS headers for video files using configured origins
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin, appConfig.cors.origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (appConfig.cors.origin.length > 0) {
    // Find first string origin (not regex) as fallback
    const stringOrigin = appConfig.cors.origin.find(o => typeof o === 'string');
    if (stringOrigin) {
      res.header('Access-Control-Allow-Origin', stringOrigin);
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Set proper content type for HLS files
  if (req.path.endsWith('.m3u8')) {
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
  } else if (req.path.endsWith('.ts')) {
    res.header('Content-Type', 'video/mp2t');
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads/videos')));

app.use('/uploads/presentations', (req, res, next) => {
  // Set CORS headers for presentation files using configured origins
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin, appConfig.cors.origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  } else if (appConfig.cors.origin.length > 0) {
    // Find first string origin (not regex) as fallback
    const stringOrigin = appConfig.cors.origin.find(o => typeof o === 'string');
    if (stringOrigin) {
      res.header('Access-Control-Allow-Origin', stringOrigin);
    }
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(path.join(__dirname, '../uploads/presentations')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/videos', require('./routes/video'));
app.use('/api/premieres', require('./routes/premiere'));
app.use('/api/presentations', require('./routes/presentation'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = appConfig.server.port;

// Listen on all interfaces (0.0.0.0) to allow network access
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is running on port ${PORT}`);
  console.log(`Environment: ${appConfig.server.nodeEnv}`);
  const corsOriginsStr = appConfig.cors.origin.map(o => typeof o === 'string' ? o : o.toString()).join(', ');
  console.log(`CORS Origins: ${corsOriginsStr}`);
  console.log(`JWT Secret: ${appConfig.security.jwtSecret ? 'Set' : 'Not Set'}`);
  console.log(`Access locally: http://localhost:${PORT}`);
  console.log(`Access from network: http://192.168.100.72:${PORT}`);
  console.log(`Video uploads: http://localhost:${PORT}/uploads/videos/`);
  console.log(`Original videos: http://localhost:${PORT}/api/videos/:id/original`);
  console.log(`Presentations: http://localhost:${PORT}/api/presentations`);
});

// Export socket handler for use in other modules
module.exports = { app, server, socketHandler };
