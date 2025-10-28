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

module.exports = router;

