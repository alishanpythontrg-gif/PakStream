const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const {
  uploadVideo,
  getVideos,
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  getVideoStatus
} = require('../controllers/videoController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// Public routes
router.get('/', getVideos);
router.get('/:id', getVideoById);
router.get('/:id/status', getVideoStatus);

// Serve video files
router.get('/:id/original', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const video = await Video.findById(req.params.id);
    
    if (!video || !video.originalFile) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const filePath = path.join(__dirname, '../../uploads/videos/original', video.originalFile.filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({ message: 'Error serving video' });
  }
});

// Serve HLS files
router.get('/:id/hls/*', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const requestedFile = req.params[0]; // The * part of the route
    const filePath = path.join(__dirname, '../../uploads/videos/processed', video._id.toString(), 'hls', requestedFile);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate content type
    if (requestedFile.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (requestedFile.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
    } else if (requestedFile.endsWith('.jpg') || requestedFile.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving HLS file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Protected routes
router.post('/upload', authenticateToken, upload, handleUploadError, uploadVideo);
router.get('/user/my-videos', authenticateToken, getUserVideos);
router.put('/:id', authenticateToken, updateVideo);
router.delete('/:id', authenticateToken, deleteVideo);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const Video = require('../models/Video');
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const videos = await Video.find(query)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all videos',
      error: error.message
    });
  }
});

module.exports = router;
