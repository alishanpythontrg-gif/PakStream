const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs').promises;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

class VideoProcessor {
  constructor() {
    this.qualities = [
      { resolution: '360p', width: 640, height: 360, bitrate: '500k' },
      { resolution: '480p', width: 854, height: 480, bitrate: '1000k' },
      { resolution: '720p', width: 1280, height: 720, bitrate: '2500k' },
      { resolution: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
    ];
  }

  async processVideo(videoId, inputPath, outputDir) {
    try {
      console.log(`Starting video processing for ${videoId}`);
      
      // Create output directories
      const hlsDir = path.join(outputDir, 'hls');
      await fs.mkdir(hlsDir, { recursive: true });

      // Get video metadata
      const metadata = await this.getVideoMetadata(inputPath);
      
      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(inputPath, hlsDir, videoId);
      
      // Generate HLS variants for different qualities
      const variants = await this.generateHLSVariants(inputPath, hlsDir, videoId, metadata);
      
      // Generate master playlist
      const masterPlaylist = await this.generateMasterPlaylist(variants, hlsDir, videoId);
      
      console.log(`Video processing completed for ${videoId}`);
      
      return {
        duration: metadata.duration,
        resolution: metadata.resolution,
        fileSize: metadata.fileSize,
        processedFiles: {
          hls: {
            masterPlaylist,
            variants,
            segments: this.getAllSegments(variants)
          },
          thumbnails,
          poster: thumbnails[0] // Use first thumbnail as poster
        }
      };
    } catch (error) {
      console.error('Video processing error:', error);
      throw error;
    }
  }

  async getVideoMetadata(inputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        const duration = metadata.format.duration;
        const fileSize = metadata.format.size;
        
        resolve({
          duration: Math.round(duration),
          resolution: `${videoStream.width}x${videoStream.height}`,
          fileSize: parseInt(fileSize),
          width: videoStream.width,
          height: videoStream.height
        });
      });
    });
  }

  async generateThumbnails(inputPath, outputDir, videoId) {
    const thumbnails = [];
    const thumbnailCount = 5;
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: thumbnailCount,
          folder: outputDir,
          filename: `${videoId}_thumb_%i.jpg`,
          size: '320x180'
        })
        .on('end', () => {
          for (let i = 1; i <= thumbnailCount; i++) {
            thumbnails.push(`${videoId}_thumb_${i}.jpg`);
          }
          resolve(thumbnails);
        })
        .on('error', reject);
    });
  }

  async generateHLSVariants(inputPath, outputDir, videoId, metadata) {
    const variants = [];
    
    for (const quality of this.qualities) {
      // Skip if video resolution is smaller than target resolution
      if (metadata.width < quality.width || metadata.height < quality.height) {
        continue;
      }
      
      const variant = await this.generateHLSVariant(
        inputPath, 
        outputDir, 
        videoId, 
        quality, 
        metadata
      );
      variants.push(variant);
    }
    
    return variants;
  }

  async generateHLSVariant(inputPath, outputDir, videoId, quality, metadata) {
    const playlistPath = path.join(outputDir, `${videoId}_${quality.resolution}.m3u8`);
    const segmentPattern = path.join(outputDir, `${videoId}_${quality.resolution}_%03d.ts`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${quality.width}x${quality.height}`)
        .videoBitrate(quality.bitrate)
        .audioBitrate('128k')
        .format('hls')
        .outputOptions([
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename', segmentPattern,
          '-f hls'
        ])
        .output(playlistPath)
        .on('end', () => {
          // Get generated segments
          this.getSegments(outputDir, videoId, quality.resolution)
            .then(segments => {
              resolve({
                resolution: quality.resolution,
                bitrate: parseInt(quality.bitrate),
                playlist: `${videoId}_${quality.resolution}.m3u8`,
                segments
              });
            })
            .catch(reject);
        })
        .on('error', reject)
        .run();
    });
  }

  async getSegments(outputDir, videoId, resolution) {
    try {
      const files = await fs.readdir(outputDir);
      return files
        .filter(file => file.startsWith(`${videoId}_${resolution}_`) && file.endsWith('.ts'))
        .sort();
    } catch (error) {
      console.error('Error getting segments:', error);
      return [];
    }
  }

  getAllSegments(variants) {
    const allSegments = [];
    variants.forEach(variant => {
      allSegments.push(...variant.segments);
    });
    return allSegments;
  }

  async generateMasterPlaylist(variants, outputDir, videoId) {
    const masterPlaylistPath = path.join(outputDir, `${videoId}_master.m3u8`);
    
    let playlistContent = '#EXTM3U\n#EXT-X-VERSION:3\n\n';
    
    variants.forEach(variant => {
      playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate * 1000},RESOLUTION=${this.getResolutionString(variant.resolution)}\n`;
      playlistContent += `${variant.playlist}\n`;
    });
    
    await fs.writeFile(masterPlaylistPath, playlistContent);
    return `${videoId}_master.m3u8`;
  }

  getResolutionString(resolution) {
    const resMap = {
      '360p': '640x360',
      '480p': '854x480',
      '720p': '1280x720',
      '1080p': '1920x1080'
    };
    return resMap[resolution] || '640x360';
  }
}

module.exports = new VideoProcessor();
