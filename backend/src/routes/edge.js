const express = require('express');
const router = express.Router();
const {
  registerEdgeServer,
  getEdgeServers,
  updateEdgeServer,
  deleteEdgeServer,
  syncVideoToEdges,
  healthCheck
} = require('../controllers/edgeController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// API key authentication middleware for edge servers
const authenticateEdgeServer = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }

  // Verify API key against edge servers
  const EdgeServer = require('../models/EdgeServer');
  EdgeServer.findOne({ apiKey })
    .then(server => {
      if (!server) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key'
        });
      }
      req.edgeServer = server;
      next();
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: err.message
      });
    });
};

// Admin routes for managing edge servers
router.post('/register', authenticateToken, requireAdmin, registerEdgeServer);
router.get('/servers', authenticateToken, requireAdmin, getEdgeServers);
router.put('/servers/:id', authenticateToken, requireAdmin, updateEdgeServer);
router.delete('/servers/:id', authenticateToken, requireAdmin, deleteEdgeServer);
router.post('/video/:videoId/sync', authenticateToken, requireAdmin, syncVideoToEdges);

// Health check endpoint (can be called by edge servers)
router.get('/health', authenticateEdgeServer, healthCheck);

// Edge server endpoints for receiving synced content
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads to edge servers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const videoId = req.body.videoId;
    const dest = path.join(__dirname, '../../uploads/videos/processed', videoId);
    fs.mkdirSync(dest, { recursive: true });
    fs.mkdirSync(path.join(dest, 'hls'), { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Keep original filename
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Receive video metadata
router.post('/video/metadata', authenticateEdgeServer, async (req, res) => {
  try {
    const { videoId, videoData } = req.body;
    
    // Save video metadata to edge server's database
    const Video = require('../models/Video');
    
    // Check if video already exists
    const existingVideo = await Video.findById(videoId);
    if (existingVideo) {
      return res.json({
        success: true,
        message: 'Video metadata already exists'
      });
    }
    
    // Create new video record
    const video = new Video(videoData);
    await video.save();
    
    res.json({
      success: true,
      message: 'Video metadata received'
    });
  } catch (error) {
    console.error('Error receiving video metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive metadata',
      error: error.message
    });
  }
});

// Receive video files
router.post('/video/files', authenticateEdgeServer, upload.any(), async (req, res) => {
  try {
    const videoId = req.body.videoId;
    
    console.log(`Received files for video ${videoId}:`, req.files?.map(f => f.filename));
    
    res.json({
      success: true,
      message: 'Video files received',
      filesReceived: req.files?.length || 0
    });
  } catch (error) {
    console.error('Error receiving video files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive files',
      error: error.message
    });
  }
});

module.exports = router;

