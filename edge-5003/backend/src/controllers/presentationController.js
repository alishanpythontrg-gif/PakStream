const Presentation = require('../models/Presentation');
const PresentationProcessor = require('../services/presentationProcessor');
const path = require('path');
const fs = require('fs');

const presentationProcessor = new PresentationProcessor();

// Upload presentation
const uploadPresentation = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, category = 'other', tags = [] } = req.body;
    const userId = req.user.id;

    // Create presentation record
    const presentation = new Presentation({
      title,
      description,
      uploadedBy: userId,
      originalFile: {
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype
      },
      category,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())
    });

    await presentation.save();

    // Process presentation in background
    presentationProcessor.processPresentation(presentation._id.toString(), req.file.path)
      .then(async (result) => {
        presentation.slides = result.slides;
        presentation.thumbnail = result.thumbnail;
        presentation.totalSlides = result.totalSlides;
        presentation.status = 'ready';
        presentation.processingProgress = 100;
        await presentation.save();
        console.log(`Presentation ${presentation._id} processed successfully`);
      })
      .catch(async (error) => {
        console.error(`Error processing presentation ${presentation._id}:`, error);
        presentation.status = 'error';
        await presentation.save();
      });

    res.status(201).json({
      message: 'Presentation uploaded successfully',
      presentation: {
        id: presentation._id,
        title: presentation.title,
        status: presentation.status,
        processingProgress: presentation.processingProgress
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Get all presentations
const getPresentations = async (req, res) => {
  try {
    const { page = 1, limit = 12, category, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { status: 'ready', isPublic: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const presentations = await Presentation.find(query)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Presentation.countDocuments(query);

    res.json({
      presentations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get presentations error:', error);
    res.status(500).json({ message: 'Failed to fetch presentations', error: error.message });
  }
};

// Get presentation by ID
const getPresentationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const presentation = await Presentation.findById(id)
      .populate('uploadedBy', 'username email');

    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    // Increment view count
    presentation.views += 1;
    await presentation.save();

    res.json({ presentation });

  } catch (error) {
    console.error('Get presentation error:', error);
    res.status(500).json({ message: 'Failed to fetch presentation', error: error.message });
  }
};

// Get presentation slides
const getPresentationSlides = async (req, res) => {
  try {
    const { id } = req.params;
    
    const presentation = await Presentation.findById(id);
    
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    if (presentation.status !== 'ready') {
      return res.status(400).json({ message: 'Presentation is not ready yet' });
    }

    res.json({ slides: presentation.slides });

  } catch (error) {
    console.error('Get slides error:', error);
    res.status(500).json({ message: 'Failed to fetch slides', error: error.message });
  }
};

// Serve presentation image
const getPresentationImage = async (req, res) => {
  try {
    const { id, slideNumber } = req.params;
    
    const presentation = await Presentation.findById(id);
    
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    const slide = presentation.slides.find(s => s.slideNumber === parseInt(slideNumber));
    
    if (!slide) {
      return res.status(404).json({ message: 'Slide not found' });
    }

    const imagePath = path.join(__dirname, '../../uploads', slide.imagePath);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found' });
    }

    res.sendFile(path.resolve(imagePath));

  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ message: 'Failed to fetch image', error: error.message });
  }
};

// Serve presentation thumbnail
const getPresentationThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const presentation = await Presentation.findById(id);
    
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    if (!presentation.thumbnail) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    const thumbnailPath = path.join(__dirname, '../../uploads', presentation.thumbnail);
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ message: 'Thumbnail file not found' });
    }

    res.sendFile(path.resolve(thumbnailPath));

  } catch (error) {
    console.error('Get thumbnail error:', error);
    res.status(500).json({ message: 'Failed to fetch thumbnail', error: error.message });
  }
};

// Get admin presentations
const getAdminPresentations = async (req, res) => {
  try {
    const presentations = await Presentation.find()
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ presentations });

  } catch (error) {
    console.error('Get admin presentations error:', error);
    res.status(500).json({ message: 'Failed to fetch presentations', error: error.message });
  }
};

// Delete presentation
const deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const presentation = await Presentation.findById(id);
    
    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    // Delete files
    const presentationDir = path.join(__dirname, '../../uploads/presentations/processed', id);
    if (fs.existsSync(presentationDir)) {
      fs.rmSync(presentationDir, { recursive: true, force: true });
    }

    if (presentation.originalFile?.path && fs.existsSync(presentation.originalFile.path)) {
      fs.unlinkSync(presentation.originalFile.path);
    }

    await Presentation.findByIdAndDelete(id);

    res.json({ message: 'Presentation deleted successfully' });

  } catch (error) {
    console.error('Delete presentation error:', error);
    res.status(500).json({ message: 'Failed to delete presentation', error: error.message });
  }
};

// Update presentation
const updatePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, isPublic } = req.body;
    
    const presentation = await Presentation.findByIdAndUpdate(
      id,
      { 
        title, 
        description, 
        category, 
        tags: Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()),
        isPublic,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('uploadedBy', 'username email');

    if (!presentation) {
      return res.status(404).json({ message: 'Presentation not found' });
    }

    res.json({ presentation });

  } catch (error) {
    console.error('Update presentation error:', error);
    res.status(500).json({ message: 'Failed to update presentation', error: error.message });
  }
};

module.exports = {
  uploadPresentation,
  getPresentations,
  getPresentationById,
  getPresentationSlides,
  getPresentationImage,
  getPresentationThumbnail,
  getAdminPresentations,
  deletePresentation,
  updatePresentation
};
