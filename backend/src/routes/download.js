const express = require('express');
const router = express.Router();
const {
  getDownloadStats,
  getAllDownloads,
  getUserDownloads,
  getVideoDownloads
} = require('../controllers/downloadController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All download routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/stats', getDownloadStats);
router.get('/', getAllDownloads);
router.get('/user/:userId', getUserDownloads);
router.get('/video/:videoId', getVideoDownloads);

module.exports = router;

