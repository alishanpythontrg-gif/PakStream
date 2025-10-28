const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads/presentations');
const originalDir = path.join(uploadDir, 'original');
const processedDir = path.join(uploadDir, 'processed');

[uploadDir, originalDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for presentation uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, originalDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `presentation-${uniqueSuffix}${ext}`);
  }
});

// File filter for presentations
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.presentation'
  ];
  
  const allowedExts = ['.ppt', '.pptx', '.odp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  console.log('Presentation upload - MIME type:', file.mimetype);
  console.log('Presentation upload - File extension:', ext);
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PowerPoint presentations (.ppt, .pptx, .odp) are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

module.exports = upload;
