const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const EdgeServer = require('../models/EdgeServer');

class EdgeSyncService {
  constructor() {
    this.syncQueue = [];
    this.isProcessing = false;
  }

  /**
   * Register an edge server
   */
  async registerEdgeServer(serverData) {
    try {
      const edgeServer = new EdgeServer(serverData);
      await edgeServer.save();
      console.log(`Edge server registered: ${serverData.name} (${serverData.host})`);
      return edgeServer;
    } catch (error) {
      console.error('Error registering edge server:', error);
      throw error;
    }
  }

  /**
   * Get all active edge servers
   */
  async getActiveEdgeServers() {
    try {
      const servers = await EdgeServer.find({ status: 'active' });
      return servers;
    } catch (error) {
      console.error('Error fetching edge servers:', error);
      return [];
    }
  }

  /**
   * Sync video to all edge servers
   */
  async syncVideoToEdges(videoId, videoPath, videoDir) {
    try {
      const edgeServers = await this.getActiveEdgeServers();
      
      if (edgeServers.length === 0) {
        console.log('No active edge servers found, skipping sync');
        return { synced: 0, failed: 0 };
      }

      console.log(`Syncing video ${videoId} to ${edgeServers.length} edge server(s)`);

      const syncPromises = edgeServers.map(server => 
        this.syncToSingleEdge(server, videoId, videoPath, videoDir)
      );

      const results = await Promise.allSettled(syncPromises);
      
      const synced = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`Video sync completed: ${synced} successful, ${failed} failed`);

      return { synced, failed };
    } catch (error) {
      console.error('Error syncing video to edges:', error);
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Sync video to a single edge server
   */
  async syncToSingleEdge(edgeServer, videoId, videoPath, videoDir) {
    try {
      const baseUrl = `${edgeServer.protocol}://${edgeServer.host}:${edgeServer.port}`;
      
      // 1. Send video metadata
      await this.sendVideoMetadata(baseUrl, edgeServer.apiKey, videoId, videoPath, videoDir);
      
      // 2. Upload video files
      await this.uploadVideoFiles(baseUrl, edgeServer.apiKey, videoId, videoDir);
      
      // 3. Update edge server stats
      await EdgeServer.findByIdAndUpdate(edgeServer._id, {
        $inc: { 'stats.videosSynced': 1 },
        'stats.lastSyncTime': new Date()
      });

      console.log(`Successfully synced video ${videoId} to ${edgeServer.name}`);
      return { success: true, server: edgeServer.name };
    } catch (error) {
      console.error(`Failed to sync video ${videoId} to ${edgeServer.name}:`, error.message);
      
      // Update error count
      await EdgeServer.findByIdAndUpdate(edgeServer._id, {
        $inc: { 'stats.syncErrors': 1 }
      });

      throw error;
    }
  }

  /**
   * Send video metadata to edge server
   */
  async sendVideoMetadata(baseUrl, apiKey, videoId, videoPath, videoDir) {
    const Video = require('../models/Video');
    const video = await Video.findById(videoId).lean();
    
    if (!video) {
      throw new Error('Video not found');
    }

    try {
      const response = await axios.post(`${baseUrl}/api/edge/video/metadata`, {
        videoId: videoId.toString(),
        videoData: video
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send metadata: ${error.message}`);
    }
  }

  /**
   * Upload video files to edge server
   */
  async uploadVideoFiles(baseUrl, apiKey, videoId, videoDir) {
    const formData = new FormData();
    
    // Add master playlist
    const masterPlaylistPath = path.join(videoDir, 'hls', 'master.m3u8');
    if (fs.existsSync(masterPlaylistPath)) {
      formData.append('masterPlaylist', fs.createReadStream(masterPlaylistPath), 'master.m3u8');
    }

    // Add all variant playlists
    const hlsDir = path.join(videoDir, 'hls');
    if (fs.existsSync(hlsDir)) {
      const files = fs.readdirSync(hlsDir);
      const playlistFiles = files.filter(f => f.endsWith('.m3u8') && f !== 'master.m3u8');
      
      for (const file of playlistFiles) {
        const filePath = path.join(hlsDir, file);
        formData.append('playlists', fs.createReadStream(filePath), file);
      }

      // Add all segments
      const segmentFiles = files.filter(f => f.endsWith('.ts'));
      for (const file of segmentFiles) {
        const filePath = path.join(hlsDir, file);
        formData.append('segments', fs.createReadStream(filePath), file);
      }
    }

    // Add thumbnails and poster
    const thumbnailDir = videoDir;
    if (fs.existsSync(thumbnailDir)) {
      const files = fs.readdirSync(thumbnailDir);
      const imageFiles = files.filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
      
      for (const file of imageFiles) {
        const filePath = path.join(thumbnailDir, file);
        formData.append('thumbnails', fs.createReadStream(filePath), file);
      }
    }

    try {
      const response = await axios.post(`${baseUrl}/api/edge/video/files`, formData, {
        headers: {
          'X-API-Key': apiKey,
          ...formData.getHeaders()
        },
        timeout: 300000 // 5 minutes for large file uploads
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload files: ${error.message}`);
    }
  }

  /**
   * Monitor edge server health
   */
  async checkEdgeServerHealth(edgeServer) {
    try {
      const baseUrl = `${edgeServer.protocol}://${edgeServer.host}:${edgeServer.port}`;
      
      const response = await axios.get(`${baseUrl}/api/edge/health`, {
        headers: {
          'X-API-Key': edgeServer.apiKey
        },
        timeout: 5000
      });

      if (response.status === 200) {
        await EdgeServer.findByIdAndUpdate(edgeServer._id, {
          status: 'active',
          lastHeartbeat: new Date()
        });
        return true;
      } else {
        await EdgeServer.findByIdAndUpdate(edgeServer._id, {
          status: 'error'
        });
        return false;
      }
    } catch (error) {
      console.error(`Health check failed for ${edgeServer.name}:`, error.message);
      await EdgeServer.findByIdAndUpdate(edgeServer._id, {
        status: 'error'
      });
      return false;
    }
  }

  /**
   * Monitor all edge servers periodically
   */
  startHealthMonitoring(intervalMs = 60000) {
    setInterval(async () => {
      const servers = await EdgeServer.find();
      for (const server of servers) {
        await this.checkEdgeServerHealth(server);
      }
    }, intervalMs);
    
    console.log('Edge server health monitoring started');
  }
}

module.exports = new EdgeSyncService();

