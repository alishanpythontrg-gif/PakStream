const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const {
  uploadVideo,
  getVideos,
  getFeaturedVideos,
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  getVideoStatus,
  getQueueStatus
} = require('../controllers/videoController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

// In-memory cache for video metadata to avoid DB hits on every segment request
// Cache expires after 5 minutes to ensure metadata stays reasonably fresh
const videoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedVideo = async (videoId) => {
  const cached = videoCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const Video = require('../models/Video');
  const video = await Video.findById(videoId).lean();
  
  if (video) {
    videoCache.set(videoId, {
      data: video,
      timestamp: Date.now()
    });
  }
  
  return video;
};

// Clear cache entry when video is updated/deleted
const clearVideoCache = (videoId) => {
  videoCache.delete(videoId);
};

// Public routes
router.get('/', getVideos);
router.get('/featured/list', getFeaturedVideos); // Must come before /:id route
router.get('/queue/status', getQueueStatus); // Get processing queue status
router.get('/:id', getVideoById);
router.get('/:id/status', getVideoStatus);

// Serve video files with range request support for seeking
router.get('/:id/original', async (req, res) => {
  try {
    const Video = require('../models/Video');
    const video = await Video.findById(req.params.id);
    
    if (!video || !video.originalFile) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const filePath = path.join(__dirname, '../../uploads/videos/original', video.originalFile.filename);
    
    // Check if file exists and get stats
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch (error) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      // Create read stream for the requested range
      const fsSync = require('fs');
      const file = fsSync.createReadStream(filePath, { start, end });

      // Set headers for partial content
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.originalFile.mimetype || 'video/mp4',
        'Cache-Control': 'public, max-age=86400'
      });

      file.pipe(res);
    } else {
      // No range requested, send entire file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.originalFile.mimetype || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      });

      const fsSync = require('fs');
      const file = fsSync.createReadStream(filePath);
      file.pipe(res);
    }
  } catch (error) {
    console.error('Error serving video:', error);
    res.status(500).json({ message: 'Error serving video' });
  }
});

// Serve HLS files with caching to avoid DB hits on every segment request
router.get('/:id/hls/*', async (req, res) => {
  try {
    // Use cached video metadata instead of hitting DB every time
    const video = await getCachedVideo(req.params.id);
    
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

    // Set appropriate content type and caching headers
    if (requestedFile.endsWith('.m3u8')) {
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache'); // Playlists should not be cached
    } else if (requestedFile.endsWith('.ts')) {
      res.setHeader('Content-Type', 'video/mp2t');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // Segments can be cached forever
    } else if (requestedFile.endsWith('.jpg') || requestedFile.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache thumbnails for 1 day
    }

    // Enable CORS for HLS streaming
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving HLS file:', error);
    res.status(500).json({ message: 'Error serving file' });
  }
});

// Protected routes
router.post('/upload', authenticateToken, upload, handleUploadError, uploadVideo);
router.get('/user/my-videos', authenticateToken, getUserVideos);
router.put('/:id', authenticateToken, async (req, res, next) => {
  // Clear cache when video is updated
  clearVideoCache(req.params.id);
  next();
}, updateVideo);
router.delete('/:id', authenticateToken, async (req, res, next) => {
  // Clear cache when video is deleted
  clearVideoCache(req.params.id);
  next();
}, deleteVideo);

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
