const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = [
    'uploads/videos/original',
    'uploads/videos/processed',
    'public/videos'
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
};

// Initialize upload directories
ensureUploadDirs();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos/original');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `video-${uniqueSuffix}${ext}`);
  }
});

// File filter for video files
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/3gp'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB limit
    files: 1 // Only one file at a time
  }
});

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2GB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only one file allowed.'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only video files are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload: upload.single('video'),
  handleUploadError
};
