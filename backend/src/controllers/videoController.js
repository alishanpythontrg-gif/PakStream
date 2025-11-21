const Video = require('../models/Video');
const VideoDownload = require('../models/VideoDownload');
const videoQueue = require('../services/videoQueue');
const { addCdnUrlsToVideos, addCdnUrlsToVideo } = require('../utils/cdnUtils');
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

    // Add CDN URLs to videos
    const videosWithCdn = addCdnUrlsToVideos(videos);

    res.json({
      success: true,
      data: {
        videos: videosWithCdn,
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

// Track video view (play start or 30 seconds watched)
const trackVideoView = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'start' } = req.query; // 'start' or 'watch30'

    // Validate view type
    if (type !== 'start' && type !== 'watch30') {
      return res.status(400).json({
        success: false,
        message: 'Invalid view type. Must be "start" or "watch30"'
      });
    }

    // Check if video exists
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Increment view count atomically
    await Video.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: false }
    ).catch(err => {
      console.error('Failed to update view count:', err);
      // Don't fail the request if view tracking fails
    });

    // Return success response
    res.json({
      success: true,
      message: `View tracked: ${type}`,
      data: {
        videoId: id,
        viewType: type
      }
    });
  } catch (error) {
    console.error('View tracking error:', error);
    // Don't fail the request - view tracking is non-critical
    res.status(200).json({
      success: true,
      message: 'View tracking attempted'
    });
  }
};

// Download video (original file in best quality)
const downloadVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    // Find video
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if video is public and ready
    if (!video.isPublic || video.status !== 'ready') {
      return res.status(403).json({
        success: false,
        message: 'Video is not available for download'
      });
    }

    // Check if original file exists
    if (!video.originalFile || !video.originalFile.filename) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const filePath = path.join(__dirname, '../../uploads/videos/original', video.originalFile.filename);
    
    // Check if file exists
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    // Track download (async, don't wait for it)
    VideoDownload.create({
      user: userId,
      video: videoId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    }).catch(err => {
      console.error('Failed to track download:', err);
      // Don't fail the download if tracking fails
    });

    const fileSize = stat.size;
    const range = req.headers.range;

    // Generate safe filename for download
    const safeTitle = video.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileExtension = path.extname(video.originalFile.filename);
    const downloadFilename = `${safeTitle}${fileExtension}`;

    if (range) {
      // Parse range header for partial content
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
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Cache-Control': 'no-cache'
      });

      file.pipe(res);
    } else {
      // No range requested, send entire file
      const fsSync = require('fs');
      const file = fsSync.createReadStream(filePath);

      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.originalFile.mimetype || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Cache-Control': 'no-cache'
      });

      file.pipe(res);
    }
  } catch (error) {
    console.error('Error downloading video:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download video',
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
  getQueueStatus,
  trackVideoView,
  downloadVideo
};
