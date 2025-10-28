const mongoose = require('mongoose');

const edgeServerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    default: 5000
  },
  protocol: {
    type: String,
    enum: ['http', 'https'],
    default: 'http'
  },
  apiKey: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active'
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  capacity: {
    storage: Number, // GB
    bandwidth: Number, // Mbps
  },
  location: {
    region: String,
    datacenter: String,
  },
  stats: {
    videosSynced: {
      type: Number,
      default: 0
    },
    lastSyncTime: Date,
    syncErrors: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

edgeServerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('EdgeServer', edgeServerSchema);

