const Video = require('../models/Video');
const videoProcessor = require('../services/videoProcessor');
const path = require('path');
const fs = require('fs').promises;

// Upload video
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    const { title, description, category, tags } = req.body;
    const uploadedBy = req.user._id;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required'
      });
    }

    // Create video record
    const video = new Video({
      title,
      description,
      uploadedBy,
      originalFile: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      category: category || 'other',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await video.save();

    // Start video processing in background
    processVideoAsync(video._id, req.file.path);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: {
        video: {
          id: video._id,
          title: video.title,
          status: video.status,
          uploadDate: video.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Video upload failed',
      error: error.message
    });
  }
};

// Process video asynchronously
const processVideoAsync = async (videoId, inputPath) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    // Update status to processing
    video.status = 'processing';
    video.processingProgress = 0;
    await video.save();

    const outputDir = path.join('uploads/videos/processed', videoId.toString());
    
    // Process video
    const result = await videoProcessor.processVideo(videoId, inputPath, outputDir);
    
    // Update video with processed data
    video.status = 'ready';
    video.processingProgress = 100;
    video.duration = result.duration;
    video.resolution = result.resolution;
    video.fileSize = result.fileSize;
    video.processedFiles = result.processedFiles;
    
    await video.save();

    // Clean up original file
    await videoProcessor.cleanupTempFiles(inputPath);

    console.log(`Video processing completed for ${videoId}`);

  } catch (error) {
    console.error('Video processing error:', error);
    
    // Update video status to error
    try {
      const video = await Video.findById(videoId);
      if (video) {
        video.status = 'error';
        video.processingError = error.message;
        await video.save();
      }
    } catch (updateError) {
      console.error('Error updating video status:', updateError);
    }
  }
};

// Get all videos
const getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search, status } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublic: true };
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

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
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch videos',
      error: error.message
    });
  }
};

// Get video by ID
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id)
      .populate('uploadedBy', 'username email');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment view count
    video.views += 1;
    await video.save();

    res.json({
      success: true,
      data: { video }
    });

  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch video',
      error: error.message
    });
  }
};

// Get user's videos
const getUserVideos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const videos = await Video.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Video.countDocuments({ uploadedBy: userId });

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
    console.error('Get user videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user videos',
      error: error.message
    });
  }
};

// Update video
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, isPublic, isFeatured } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns the video or is admin
    if (video.uploadedBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this video'
      });
    }

    // Update fields
    if (title) video.title = title;
    if (description) video.description = description;
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map(tag => tag.trim());
    if (typeof isPublic === 'boolean') video.isPublic = isPublic;
    if (typeof isFeatured === 'boolean' && req.user.role === 'admin') {
      video.isFeatured = isFeatured;
    }

    await video.save();

    res.json({
      success: true,
      message: 'Video updated successfully',
      data: { video }
    });

  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update video',
      error: error.message
    });
  }
};

// Delete video
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findById(id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if user owns the video or is admin
    if (video.uploadedBy.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this video'
      });
    }

    // Delete files
    await deleteVideoFiles(video);

    // Delete video record
    await Video.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
};

// Helper function to delete video files
const deleteVideoFiles = async (video) => {
  try {
    // Delete original file
    if (video.originalFile && video.originalFile.path) {
      await fs.unlink(video.originalFile.path);
    }

    // Delete processed files
    if (video.processedFiles) {
      const processedDir = path.join('uploads/videos/processed', video._id.toString());
      await fs.rmdir(processedDir, { recursive: true });
    }
  } catch (error) {
    console.error('Error deleting video files:', error);
  }
};

// Get video processing status
const getVideoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const video = await Video.findById(id).select('status processingProgress processingError');
    
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
        progress: video.processingProgress,
        error: video.processingError
      }
    });

  } catch (error) {
    console.error('Get video status error:', error);
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
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  getVideoStatus
};
