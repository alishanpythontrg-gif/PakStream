const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentFile,
  getDocumentThumbnail,
  getAdminDocuments,
  deleteDocument,
  updateDocument
} = require('../controllers/documentController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/documentUpload');

// Public routes
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.get('/:id/file', getDocumentFile);
router.get('/:id/thumbnail', getDocumentThumbnail);

// Admin routes
router.post('/upload', authenticateToken, requireAdmin, upload.single('document'), uploadDocument);
router.get('/admin/all', authenticateToken, requireAdmin, getAdminDocuments);
router.put('/:id', authenticateToken, requireAdmin, updateDocument);
router.delete('/:id', authenticateToken, requireAdmin, deleteDocument);

module.exports = router;

