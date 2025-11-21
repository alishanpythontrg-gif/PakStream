const Document = require('../models/Document');
const DocumentProcessor = require('../services/documentProcessor');
const path = require('path');
const fs = require('fs');

const documentProcessor = new DocumentProcessor();

// Upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, category = 'other', tags = [] } = req.body;
    const userId = req.user.id;

    // Create document record
    const document = new Document({
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

    await document.save();

    // Process document in background
    documentProcessor.processDocument(document._id.toString(), req.file.path)
      .then(async (result) => {
        document.pageCount = result.pageCount;
        document.thumbnail = result.thumbnail;
        document.status = 'ready';
        document.processingProgress = 100;
        await document.save();
        console.log(`Document ${document._id} processed successfully`);
      })
      .catch(async (error) => {
        console.error(`Error processing document ${document._id}:`, error);
        document.status = 'error';
        await document.save();
      });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        title: document.title,
        status: document.status,
        processingProgress: document.processingProgress
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Get all documents
const getDocuments = async (req, res) => {
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

    const documents = await Document.find(query)
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Document.countDocuments(query);

    res.json({
      documents,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// Get document by ID
const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id)
      .populate('uploadedBy', 'username email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Increment view count
    document.views += 1;
    await document.save();

    res.json({ document });

  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Failed to fetch document', error: error.message });
  }
};

// Serve document file
const getDocumentFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { download } = req.query;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.originalFile || !document.originalFile.path) {
      return res.status(404).json({ message: 'Document file not found' });
    }

    const filePath = path.resolve(document.originalFile.path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set headers for PDF viewing or downloading
    res.setHeader('Content-Type', 'application/pdf');
    
    // If download=true, force download; otherwise display inline (for iframe)
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalFile.filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${document.originalFile.filename}"`);
    }
    
    res.setHeader('Cache-Control', 'public, max-age=86400');

    res.sendFile(filePath);

  } catch (error) {
    console.error('Get document file error:', error);
    res.status(500).json({ message: 'Failed to fetch document file', error: error.message });
  }
};

// Serve document thumbnail
const getDocumentThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.thumbnail) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    const thumbnailPath = path.join(__dirname, '../../uploads', document.thumbnail);
    
    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ message: 'Thumbnail file not found' });
    }

    res.sendFile(path.resolve(thumbnailPath));

  } catch (error) {
    console.error('Get thumbnail error:', error);
    res.status(500).json({ message: 'Failed to fetch thumbnail', error: error.message });
  }
};

// Get admin documents
const getAdminDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .populate('uploadedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({ documents });

  } catch (error) {
    console.error('Get admin documents error:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await Document.findById(id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete files
    const documentDir = path.join(__dirname, '../../uploads/documents/processed', id);
    if (fs.existsSync(documentDir)) {
      fs.rmSync(documentDir, { recursive: true, force: true });
    }

    if (document.originalFile?.path && fs.existsSync(document.originalFile.path)) {
      fs.unlinkSync(document.originalFile.path);
    }

    await Document.findByIdAndDelete(id);

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags, isPublic } = req.body;
    
    const document = await Document.findByIdAndUpdate(
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

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({ document });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ message: 'Failed to update document', error: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentFile,
  getDocumentThumbnail,
  getAdminDocuments,
  deleteDocument,
  updateDocument
};

