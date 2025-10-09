const Video = require('../models/Video');
const videoQueue = require('../services/videoQueue');
const path = require('path');
const fs = require('fs').promises;

const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { title, description, category, tags } = req.body;
    
    // Create video record
    const video = new Video({
      title,
      description,
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      uploadedBy: req.user.id,
      originalFile: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      status: 'uploading'
    });

    await video.save();

    // Add video to processing queue
    videoQueue.addToQueue(video._id, req.file.path);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Added to processing queue.',
      data: { 
        video,
        queueStatus: videoQueue.getQueueStatus()
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
};

// Get queue status endpoint
const getQueueStatus = async (req, res) => {
  try {
    const status = videoQueue.getQueueStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status',
      error: error.message
    });
  }
};

const getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
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
      message: 'Failed to fetch videos',
      error: error.message
    });
  }
};

const getFeaturedVideos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get featured videos that are ready for playback
    const videos = await Video.find({
      isPublic: true,
      isFeatured: true,
      status: 'ready'
    })
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // If no featured videos, return latest ready videos
    if (videos.length === 0) {
      const latestVideos = await Video.find({
        isPublic: true,
        status: 'ready'
      })
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return res.json({
        success: true,
        data: {
          videos: latestVideos,
          isFallback: true,
          message: 'No featured videos available, showing latest videos'
        }
      });
    }

    res.json({
      success: true,
      data: {
        videos,
        isFallback: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured videos',
      error: error.message
    });
  }
};

const getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment view count asynchronously without blocking response
    // This prevents the view counter from slowing down video playback start
    Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: false }
    ).catch(err => console.error('Failed to update view count:', err));

    res.json({
      success: true,
      data: { video }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video',
      error: error.message
    });
  }
};

const getUserVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const videos = await Video.find({ uploadedBy: req.user.id })
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments({ uploadedBy: req.user.id });

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
      message: 'Failed to fetch user videos',
      error: error.message
    });
  }
};

const updateVideo = async (req, res) => {
  try {
    const { title, description, category, tags, isPublic } = req.body;
    
    const video = await Video.findOne({
      _id: req.params.id,
      uploadedBy: req.user.id
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found or access denied'
      });
    }

    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map(tag => tag.trim());
    if (typeof isPublic !== 'undefined') video.isPublic = isPublic;

    await video.save();

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update video',
      error: error.message
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    // Find video
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // ONLY admins can delete videos - no exceptions
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete videos.'
      });
    }

    // Delete files
    try {
      if (video.originalFile?.path) {
        await fs.unlink(video.originalFile.path);
        console.log(`Deleted original file: ${video.originalFile.path}`);
      }
      
      const processedDir = path.join(__dirname, '../../uploads/videos/processed', video._id.toString());
      try {
        await fs.rmdir(processedDir, { recursive: true });
        console.log(`Deleted processed directory: ${processedDir}`);
      } catch (dirError) {
        console.log(`Processed directory not found or already deleted: ${processedDir}`);
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully by administrator'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
};

const getVideoStatus = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: video.status,
        processingProgress: video.processingProgress || 0,
        error: video.processingError
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get video status',
      error: error.message
    });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getFeaturedVideos,
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  getVideoStatus,
  getQueueStatus
};
