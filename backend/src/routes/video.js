const express = require('express');
const router = express.Router();
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

// Protected routes
router.post('/upload', authenticateToken, upload, handleUploadError, uploadVideo);
router.get('/user/my-videos', authenticateToken, getUserVideos);
router.put('/:id', authenticateToken, updateVideo);
router.delete('/:id', authenticateToken, deleteVideo);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
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
