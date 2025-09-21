const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/videos', express.static(path.join(__dirname, '../uploads/videos/processed')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize Socket.IO
const SocketHandler = require('./socket/socketHandler');
const socketHandler = new SocketHandler(server);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'PakStream API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      premieres: '/api/premieres',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes - MUST be before 404 handler
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/video'));
app.use('/api/premieres', require('./routes/premiere'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - MUST be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Video uploads: http://localhost:${PORT}/videos/`);
  console.log(`Original videos: http://localhost:${PORT}/api/videos/:id/original`);
});

// Export socket handler for use in other modules
module.exports = { app, server, socketHandler };
