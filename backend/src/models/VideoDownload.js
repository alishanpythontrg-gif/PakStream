const mongoose = require('mongoose');

const videoDownloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
videoDownloadSchema.index({ user: 1, downloadedAt: -1 });
videoDownloadSchema.index({ video: 1, downloadedAt: -1 });
videoDownloadSchema.index({ downloadedAt: -1 });

module.exports = mongoose.model('VideoDownload', videoDownloadSchema);

