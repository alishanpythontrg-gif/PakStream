const Video = require('../models/Video');
const videoProcessor = require('../services/videoProcessor');
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

    // Start video processing in background
    processVideoAsync(video._id, req.file.path);

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully. Processing started.',
      data: { video }
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

const processVideoAsync = async (videoId, inputPath) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) return;

    video.status = 'processing';
    await video.save();

    const outputDir = path.join(__dirname, '../../uploads/videos/processed', videoId.toString());
    
    const processedData = await videoProcessor.processVideo(videoId, inputPath, outputDir);
    
    video.status = 'ready';
    video.duration = processedData.duration;
    video.resolution = processedData.resolution;
    video.fileSize = processedData.fileSize;
    video.processedFiles = processedData.processedFiles;
    
    await video.save();
    
    console.log(`Video processing completed for ${videoId}`);
  } catch (error) {
    console.error('Video processing error:', error);
    
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'error';
      video.processingError = error.message;
      await video.save();
    }
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

    // Increment view count
    video.views += 1;
    await video.save();

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

    // Delete files
    try {
      if (video.originalFile?.path) {
        await fs.unlink(video.originalFile.path);
      }
      
      const processedDir = path.join(__dirname, '../../uploads/videos/processed', video._id.toString());
      await fs.rmdir(processedDir, { recursive: true });
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
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
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  getVideoStatus
};
