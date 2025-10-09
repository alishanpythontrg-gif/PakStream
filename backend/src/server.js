// Load environment variables first
require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const SocketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);
const socketHandler = new SocketHandler(server);

// Initialize video queue with socket.io
const videoQueue = require('./services/videoQueue');
videoQueue.setSocketIO(socketHandler.io);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pakstream', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Serve static files with proper headers for HLS
app.use('/uploads/videos', (req, res, next) => {
  // Set CORS headers for video files
  res.header('Access-Control-Allow-Origin', '*');
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

app.use('/uploads/presentations', express.static(path.join(__dirname, '../uploads/presentations')));

// API routes
app.use('/api/auth', require('./routes/auth'));
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

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`);
  console.log(`Video uploads: http://localhost:${PORT}/uploads/videos/`);
  console.log(`Original videos: http://localhost:${PORT}/api/videos/:id/original`);
  console.log(`Presentations: http://localhost:${PORT}/api/presentations`);
});

// Export socket handler for use in other modules
module.exports = { app, server, socketHandler };
