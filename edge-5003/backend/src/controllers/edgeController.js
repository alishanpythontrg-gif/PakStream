const EdgeServer = require('../models/EdgeServer');
const edgeSyncService = require('../services/edgeSyncService');

// Register a new edge server
const registerEdgeServer = async (req, res) => {
  try {
    const { name, host, port, protocol, apiKey, capacity, location } = req.body;

    // Validate required fields
    if (!name || !host || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Name, host, and API key are required'
      });
    }

    // Check if edge server already exists
    const existing = await EdgeServer.findOne({ host, port });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Edge server with this host and port already exists'
      });
    }

    const edgeServer = await edgeSyncService.registerEdgeServer({
      name,
      host,
      port: port || 5000,
      protocol: protocol || 'http',
      apiKey,
      capacity: capacity || {},
      location: location || {}
    });

    res.status(201).json({
      success: true,
      message: 'Edge server registered successfully',
      data: { edgeServer }
    });
  } catch (error) {
    console.error('Register edge server error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register edge server',
      error: error.message
    });
  }
};

// Get all edge servers
const getEdgeServers = async (req, res) => {
  try {
    const servers = await EdgeServer.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: { servers }
    });
  } catch (error) {
    console.error('Get edge servers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch edge servers',
      error: error.message
    });
  }
};

// Update edge server
const updateEdgeServer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const edgeServer = await EdgeServer.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!edgeServer) {
      return res.status(404).json({
        success: false,
        message: 'Edge server not found'
      });
    }

    res.json({
      success: true,
      message: 'Edge server updated successfully',
      data: { edgeServer }
    });
  } catch (error) {
    console.error('Update edge server error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update edge server',
      error: error.message
    });
  }
};

// Delete edge server
const deleteEdgeServer = async (req, res) => {
  try {
    const { id } = req.params;

    const edgeServer = await EdgeServer.findByIdAndDelete(id);

    if (!edgeServer) {
      return res.status(404).json({
        success: false,
        message: 'Edge server not found'
      });
    }

    res.json({
      success: true,
      message: 'Edge server deleted successfully'
    });
  } catch (error) {
    console.error('Delete edge server error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete edge server',
      error: error.message
    });
  }
};

// Trigger video sync to all edge servers
const syncVideoToEdges = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const Video = require('../models/Video');
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    if (video.status !== 'ready') {
      return res.status(400).json({
        success: false,
        message: 'Video is not ready for sync'
      });
    }

    const videoDir = require('path').join(__dirname, '../../uploads/videos/processed', videoId);
    
    // Sync in background
    edgeSyncService.syncVideoToEdges(videoId, video.originalFile.path, videoDir)
      .then(result => {
        console.log(`Video ${videoId} sync completed:`, result);
      })
      .catch(error => {
        console.error(`Video ${videoId} sync failed:`, error);
      });

    res.json({
      success: true,
      message: 'Video sync initiated',
      data: { videoId }
    });
  } catch (error) {
    console.error('Sync video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync video',
      error: error.message
    });
  }
};

// Health check endpoint for edge servers
const healthCheck = async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date()
  });
};

module.exports = {
  registerEdgeServer,
  getEdgeServers,
  updateEdgeServer,
  deleteEdgeServer,
  syncVideoToEdges,
  healthCheck
};

