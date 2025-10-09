# PakStream Video Upload, Processing & Playback Flow

## 🎬 Complete End-to-End Video Flow

This document explains the complete journey of a video from upload to playback in PakStream.

---

## 📤 **Phase 1: Video Upload**

### Frontend (User Action)
1. User selects video file in `VideoUploadModal.tsx`
2. Form validation checks:
   - File type (mp4, avi, mov, webm, mkv, etc.)
   - File size (max 2GB)
   - Title, description, category

### API Call
```typescript
// frontend/src/services/videoService.ts
async uploadVideo(videoFile: File, uploadData: VideoUploadData)
```

### Backend Receipt
```javascript
// backend/src/routes/video.js
POST /api/videos/upload
- Authenticates user (JWT token)
- Multer middleware validates file
- Saves to: uploads/videos/original/
```

### Database Record Created
```javascript
// backend/src/controllers/videoController.js
const video = new Video({
  title: '...',
  description: '...',
  status: 'uploading',
  originalFile: { filename, path, size, mimetype }
});
await video.save();
```

### Processing Queue
```javascript
// backend/src/services/videoQueue.js
videoQueue.addToQueue(video._id, filePath);
// Supports 2 concurrent processing jobs
```

---

## ⚙️ **Phase 2: Video Processing**

### Step 1: Get Video Metadata
```javascript
// Uses ffprobe to extract:
- Duration (e.g., 180 seconds)
- Resolution (e.g., 1920x1080)
- Bitrate
- Codec info
```

### Step 2: Determine Quality Variants
```javascript
// backend/src/services/videoProcessor.js
this.qualities = [
  { resolution: '360p', width: 640, height: 360, bitrate: '500k' },
  { resolution: '480p', width: 854, height: 480, bitrate: '1000k' },
  { resolution: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { resolution: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
];

// For a 1080p source video, generates: 360p, 480p, 720p, 1080p
// For a 720p source video, generates: 360p, 480p, 720p (skips 1080p)
```

### Step 3: FFmpeg Processing (Parallel)
```javascript
// For EACH quality variant:
ffmpeg(inputPath)
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1280x720')              // e.g., for 720p
  .videoBitrate('2500k')
  .audioBitrate('128k')
  .format('hls')
  .outputOptions([
    '-preset medium',            // Quality/speed balance
    '-crf 23',                   // Visual quality
    '-hls_time 10',              // 10-second segments
    '-hls_list_size 0',          // Include all segments
    '-g 48',                     // Keyframe interval
    '-profile:v main',           // H.264 profile
  ])
```

**Output for each quality:**
```
uploads/videos/processed/{videoId}/hls/
├── {videoId}_360p.m3u8        # Playlist for 360p
├── {videoId}_360p_000.ts      # Segments
├── {videoId}_360p_001.ts
├── {videoId}_720p.m3u8        # Playlist for 720p
├── {videoId}_720p_000.ts
├── {videoId}_720p_001.ts
└── ... (more segments)
```

### Step 4: Generate Master Playlist ✅ **FIXED**
```javascript
// Before (WRONG - caused the bug):
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=360p
{videoId}_360p.m3u8

// After (CORRECT):
#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360
{videoId}_360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
{videoId}_720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
{videoId}_1080p.m3u8
```

**Why this fix matters:**
- HLS.js parses `RESOLUTION=640x360` to extract width (640) and height (360)
- With `RESOLUTION=360p`, HLS.js couldn't parse dimensions → height=0
- VideoPlayer filters out height=0 → only "Auto" remained

### Step 5: Generate Thumbnails
```javascript
// Creates 5 thumbnails at different timestamps
{videoId}_thumb_1.jpg
{videoId}_thumb_2.jpg
{videoId}_thumb_3.jpg
{videoId}_thumb_4.jpg
{videoId}_thumb_5.jpg
```

### Step 6: Update Database
```javascript
video.status = 'ready';
video.duration = 180;
video.resolution = '1920x1080';
video.processedFiles = {
  hls: {
    masterPlaylist: '{videoId}_master.m3u8',
    variants: [
      { resolution: '360p', width: 640, height: 360, bitrate: 500, playlist: '...', segments: [...] },
      { resolution: '720p', width: 1280, height: 720, bitrate: 2500, playlist: '...', segments: [...] },
      { resolution: '1080p', width: 1920, height: 1080, bitrate: 5000, playlist: '...', segments: [...] }
    ]
  },
  thumbnails: [...],
  poster: '{videoId}_thumb_1.jpg'
};
await video.save();
```

### Step 7: Real-time Updates
```javascript
// Socket.IO emits progress events
io.emit('videoProcessingProgress', {
  videoId,
  progress: 75,
  message: 'Processing 720p (75%)...'
});

// When complete:
io.emit('videoProcessingComplete', {
  videoId,
  status: 'ready'
});
```

---

## ▶️ **Phase 3: Video Playback**

### Step 1: User Clicks Video
```typescript
// frontend/src/components/video/VideoGrid.tsx
<VideoPlayer video={selectedVideo} />
```

### Step 2: Fetch Master Playlist
```typescript
// frontend/src/services/videoService.ts
getMasterPlaylistUrl(video: Video): string {
  return `http://localhost:5000/uploads/videos/processed/${video._id}/hls/${video.processedFiles.hls.masterPlaylist}`;
}

// Example: http://localhost:5000/uploads/videos/processed/68e740c2.../hls/68e740c2..._master.m3u8
```

### Step 3: HLS.js Initialization
```typescript
// frontend/src/components/video/VideoPlayer.tsx
const hls = new Hls({
  enableWorker: true,
  lowLatencyMode: true,
  maxBufferLength: 30
});

hls.loadSource(masterPlaylistUrl);
hls.attachMedia(videoElement);
```

### Step 4: Parse Manifest ✅ **NOW WORKS**
```typescript
hls.on(Hls.Events.MANIFEST_PARSED, () => {
  const levels = hls.levels;
  // Before fix: levels = [] or levels with height=0
  // After fix: levels = [
  //   { width: 640, height: 360, bitrate: 500000 },
  //   { width: 1280, height: 720, bitrate: 2500000 },
  //   { width: 1920, height: 1080, bitrate: 5000000 }
  // ]
  
  const qualities = levels
    .filter(level => level.height && level.height > 0)
    .map(level => ({
      label: `${level.height}p`,
      height: level.height
    }));
  
  setAvailableQualities(['auto', ...qualities.map(q => q.label)]);
  // Result: ['auto', '360p', '720p', '1080p']
});
```

### Step 5: Quality Selection UI
```typescript
// User sees quality button: ⚙️ Auto

// Clicking shows menu:
┌─────────────────────┐
│ QUALITY             │
├─────────────────────┤
│ Auto (recommended) ✓│  ← Selected
│ 360p                │
│ 720p                │
│ 1080p               │
└─────────────────────┘
```

### Step 6: Adaptive Bitrate Streaming
```typescript
// Auto mode (default):
hls.currentLevel = -1; // HLS.js chooses best quality based on bandwidth

// Manual selection (e.g., 720p):
const levelIndex = hls.levels.findIndex(level => level.height === 720);
hls.currentLevel = levelIndex; // Forces 720p
```

### Step 7: Video Playback
1. HLS.js downloads segments (.ts files)
2. Decodes and plays video
3. Buffers ahead (30 seconds default)
4. Monitors network speed
5. Switches quality automatically (if Auto mode)

---

## 🔄 **Real-time Progress Tracking**

### Backend Emits Progress
```javascript
io.emit('videoProcessingProgress', {
  videoId: '68e740c2...',
  progress: 45,
  message: 'Processing 720p (45%)...',
  timestamp: '2025-10-09T12:34:56.789Z'
});
```

### Frontend Displays
```typescript
// frontend/src/components/video/VideoProcessingStatus.tsx
┌──────────────────────────────┐
│ 📺 Processing Videos (1)     │
├──────────────────────────────┤
│ ⚙️ My Video                  │
│ 📺 Generating 360p, 720p...  │
│ ████████░░░░░░░░ 45%         │
└──────────────────────────────┘
```

---

## 📊 **Complete Flow Diagram**

```
┌─────────────┐
│   Upload    │ User uploads video.mp4 (1920x1080)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Queue     │ Add to processing queue (max 2 concurrent)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Analyze    │ FFprobe: Duration=180s, Resolution=1920x1080
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Process    │ FFmpeg generates 4 qualities:
│             │ ├─ 360p (640x360) @ 500k
│             │ ├─ 480p (854x480) @ 1000k
│             │ ├─ 720p (1280x720) @ 2500k
│             │ └─ 1080p (1920x1080) @ 5000k
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Master    │ Create master.m3u8 with:
│  Playlist   │ RESOLUTION=640x360 ✅ (not "360p")
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Ready     │ Status: ready, notify user via Socket.IO
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Player    │ HLS.js loads master.m3u8
│             │ Parses: Found 4 quality levels ✅
│             │ Displays: Auto, 360p, 480p, 720p, 1080p
│             │ User can switch between qualities
└─────────────┘
```

---

## 🐛 **The Bug & The Fix**

### **The Bug**
```javascript
// videoProcessor.js line 314 (OLD):
playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate * 1000},RESOLUTION=${variant.resolution}\n`;
// Generated: RESOLUTION=360p ❌

// HLS.js couldn't parse "360p" → level.height = 0
// VideoPlayer filtered height=0 → Only "Auto" shown
```

### **The Fix**
```javascript
// videoProcessor.js (NEW):
const resolution = variant.width && variant.height 
  ? `${variant.width}x${variant.height}`  // "640x360" ✅
  : variant.resolution;

playlistContent += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bitrate * 1000},RESOLUTION=${resolution}\n`;
// Generated: RESOLUTION=640x360 ✅

// HLS.js parses correctly → level.height = 360
// VideoPlayer shows: Auto, 360p, 720p, 1080p ✅
```

---

## ✅ **Testing the Fix**

### 1. Upload a new video (1080p source recommended)
### 2. Wait for processing to complete
### 3. Check the master playlist:
```bash
cat uploads/videos/processed/{videoId}/hls/{videoId}_master.m3u8
```

**Expected output:**
```
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=500000,RESOLUTION=640x360
{videoId}_360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=854x480
{videoId}_480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
{videoId}_720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
{videoId}_1080p.m3u8
```

### 4. Play the video
### 5. Click the quality selector (⚙️ button)
### 6. Verify you see: Auto, 360p, 480p, 720p, 1080p ✅

---

## 🎯 **Quality Selection Behavior**

### Auto Mode (Recommended)
- HLS.js monitors network bandwidth
- Automatically switches between qualities
- Starts with best quality available
- Downgrades if network slows
- Upgrades when network improves

### Manual Mode
- User selects specific quality (e.g., 720p)
- Player stays at that quality
- Useful for:
  - Slow connections (choose 360p)
  - Data saving (choose lower quality)
  - Quality testing

---

## 📈 **Performance Metrics**

### Processing Time (approximate)
- **360p**: ~30% of video duration
- **480p**: ~40% of video duration
- **720p**: ~60% of video duration
- **1080p**: ~100% of video duration

**Example:** 3-minute (180s) video
- 360p: ~54 seconds
- 720p: ~108 seconds
- 1080p: ~180 seconds
- **Total**: ~6-7 minutes (with 2 parallel jobs)

### Storage Size (approximate)
- **360p**: ~25% of original
- **480p**: ~35% of original
- **720p**: ~50% of original
- **1080p**: ~80% of original

**Example:** 100MB original video
- Total processed: ~190MB (all 4 qualities)

---

## 🔧 **Configuration**

### Adjust Quality Settings
Edit `/backend/src/services/videoProcessor.js`:
```javascript
this.qualities = [
  { resolution: '360p', width: 640, height: 360, bitrate: '500k' },
  { resolution: '480p', width: 854, height: 480, bitrate: '1000k' },
  { resolution: '720p', width: 1280, height: 720, bitrate: '2500k' },
  { resolution: '1080p', width: 1920, height: 1080, bitrate: '5000k' }
  // Add 4K if needed:
  // { resolution: '2160p', width: 3840, height: 2160, bitrate: '15000k' }
];
```

### Adjust Concurrent Processing
Edit `/backend/src/services/videoQueue.js`:
```javascript
const videoQueue = new VideoQueue(2); // Change from 2 to 3, 4, etc.
```

### Adjust FFmpeg Quality
Edit `/backend/src/services/videoProcessor.js`:
```javascript
'-preset medium',    // Options: ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow
'-crf 23',          // Lower = better quality (18-28 recommended)
```

---

## 🎓 **Summary**

The complete video flow involves:
1. ✅ **Upload** - File validation and storage
2. ✅ **Queue** - Parallel processing management
3. ✅ **Analyze** - Extract video metadata
4. ✅ **Process** - Generate multiple quality variants
5. ✅ **Playlist** - Create HLS master playlist (FIXED)
6. ✅ **Playback** - Adaptive bitrate streaming
7. ✅ **Quality Selection** - User control over quality (FIXED)

**Key Fix:** Changed `RESOLUTION=360p` → `RESOLUTION=640x360` in master playlist generation, enabling proper quality detection in HLS.js and quality selector display.

---

**Date:** October 9, 2025  
**Status:** ✅ Bug Fixed - Quality selector now working  
**Affected Files:**
- `/backend/src/services/videoProcessor.js` - Fixed master playlist generation

