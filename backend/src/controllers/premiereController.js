const Premiere = require('../models/Premiere');
const Video = require('../models/Video');

const createPremiere = async (req, res) => {
  try {
    const { videoId, title, description, startTime, duration } = req.body;
    
    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check if there's already an active premiere
    const activePremiere = await Premiere.findOne({ 
      status: { $in: ['scheduled', 'live'] },
      isActive: true
    });

    if (activePremiere) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active premiere. Please end it first.'
      });
    }

    // Calculate start and end times
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + (duration || video.duration) * 1000);

    const premiere = new Premiere({
      video: videoId,
      title: title || video.title,
      description: description || video.description,
      startTime: start,
      endTime: end,
      createdBy: req.user.id,
      status: start <= new Date() ? 'live' : 'scheduled'
    });

    await premiere.save();
    await premiere.populate('video');

    res.status(201).json({
      success: true,
      message: 'Premiere created successfully',
      data: { premiere }
    });
  } catch (error) {
    console.error('Create premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create premiere',
      error: error.message
    });
  }
};

const getActivePremiere = async (req, res) => {
  try {
    const premiere = await Premiere.findOne({ 
      status: { $in: ['scheduled', 'live'] },
      isActive: true
    }).populate('video').populate('createdBy', 'username');

    if (!premiere) {
      return res.json({
        success: true,
        data: { premiere: null }
      });
    }

    // Update status if needed
    const now = new Date();
    if (premiere.status === 'scheduled' && premiere.startTime <= now) {
      premiere.status = 'live';
      await premiere.save();
    }

    res.json({
      success: true,
      data: { premiere }
    });
  } catch (error) {
    console.error('Get active premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active premiere',
      error: error.message
    });
  }
};

const getAllPremieres = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const premieres = await Premiere.find(query)
      .populate('video')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Premiere.countDocuments(query);

    res.json({
      success: true,
      data: {
        premieres,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get premieres error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get premieres',
      error: error.message
    });
  }
};

const joinPremiere = async (req, res) => {
  try {
    const premiere = await Premiere.findOne({ 
      status: 'live',
      isActive: true
    });

    if (!premiere) {
      return res.status(404).json({
        success: false,
        message: 'No active premiere found'
      });
    }

    // Add viewer if not already joined
    const existingViewer = premiere.viewers.find(
      viewer => viewer.user.toString() === req.user.id
    );

    if (!existingViewer) {
      premiere.viewers.push({ user: req.user.id });
      premiere.totalViewers += 1;
      await premiere.save();
    }

    res.json({
      success: true,
      message: 'Joined premiere successfully',
      data: { premiere }
    });
  } catch (error) {
    console.error('Join premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join premiere',
      error: error.message
    });
  }
};

const endPremiere = async (req, res) => {
  try {
    const premiere = await Premiere.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!premiere) {
      return res.status(404).json({
        success: false,
        message: 'Premiere not found or access denied'
      });
    }

    premiere.status = 'ended';
    premiere.isActive = false;
    await premiere.save();

    res.json({
      success: true,
      message: 'Premiere ended successfully',
      data: { premiere }
    });
  } catch (error) {
    console.error('End premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end premiere',
      error: error.message
    });
  }
};

const updatePremiere = async (req, res) => {
  try {
    const { title, description, startTime, duration } = req.body;
    
    const premiere = await Premiere.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!premiere) {
      return res.status(404).json({
        success: false,
        message: 'Premiere not found or access denied'
      });
    }

    if (premiere.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update live premiere'
      });
    }

    if (title) premiere.title = title;
    if (description) premiere.description = description;
    if (startTime) {
      premiere.startTime = new Date(startTime);
      if (duration) {
        premiere.endTime = new Date(premiere.startTime.getTime() + duration * 1000);
      }
    }

    await premiere.save();

    res.json({
      success: true,
      message: 'Premiere updated successfully',
      data: { premiere }
    });
  } catch (error) {
    console.error('Update premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update premiere',
      error: error.message
    });
  }
};

const deletePremiere = async (req, res) => {
  try {
    const premiere = await Premiere.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!premiere) {
      return res.status(404).json({
        success: false,
        message: 'Premiere not found or access denied'
      });
    }

    if (premiere.status === 'live') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete live premiere'
      });
    }

    await Premiere.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Premiere deleted successfully'
    });
  } catch (error) {
    console.error('Delete premiere error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete premiere',
      error: error.message
    });
  }
};

module.exports = {
  createPremiere,
  getActivePremiere,
  getAllPremieres,
  joinPremiere,
  endPremiere,
  updatePremiere,
  deletePremiere
};
