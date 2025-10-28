const { getCdnUrl, isCdnEnabled } = require('../config/cdn');

/**
 * Add CDN URLs to video object
 * @param {Object} video - Video document from database
 * @returns {Object} - Video object with CDN URLs added
 */
function addCdnUrlsToVideo(video) {
  if (!video || !isCdnEnabled()) {
    return video;
  }

  const videoId = video._id.toString();
  
  // Add CDN URL for master playlist (synchronous fallback)
  if (video.processedFiles?.hls?.masterPlaylist) {
    // Use direct path for synchronous operation
    video.cdnMasterPlaylist = `/uploads/videos/processed/${videoId}/hls/${video.processedFiles.hls.masterPlaylist}`;
  }

  // Add CDN URLs for variants
  if (video.processedFiles?.hls?.variants) {
    video.cdnVariants = video.processedFiles.hls.variants.map(variant => ({
      ...variant,
      cdnPlaylist: `/uploads/videos/processed/${videoId}/hls/${variant.playlist}`,
      cdnSegments: variant.segments.map(segment => 
        `/uploads/videos/processed/${videoId}/hls/${segment}`
      )
    }));
  }

  // Add CDN URL for poster/thumbnail
  if (video.processedFiles?.poster) {
    video.cdnPoster = `/uploads/videos/processed/${videoId}/${video.processedFiles.poster}`;
  }

  // Add CDN URLs for thumbnails
  if (video.processedFiles?.thumbnails) {
    video.cdnThumbnails = video.processedFiles.thumbnails.map(thumb => 
      `/uploads/videos/processed/${videoId}/${thumb}`
    );
  }

  return video;
}

/**
 * Add CDN URLs to array of videos
 * @param {Array} videos - Array of video documents
 * @returns {Array} - Array of videos with CDN URLs added
 */
function addCdnUrlsToVideos(videos) {
  if (!Array.isArray(videos)) {
    return videos;
  }

  return videos.map(video => addCdnUrlsToVideo(video));
}

/**
 * Add CDN URLs to presentation object
 * @param {Object} presentation - Presentation document from database
 * @returns {Object} - Presentation object with CDN URLs added
 */
function addCdnUrlsToPresentation(presentation) {
  if (!presentation || !isCdnEnabled()) {
    return presentation;
  }

  const presentationId = presentation._id.toString();

  // Add CDN URLs for slides
  if (presentation.slides) {
    presentation.cdnSlides = presentation.slides.map(slide => ({
      ...slide,
      cdnImagePath: getCdnUrl(slide.imagePath),
      cdnThumbnailPath: getCdnUrl(slide.thumbnailPath)
    }));
  }

  // Add CDN URL for thumbnail
  if (presentation.thumbnail) {
    presentation.cdnThumbnail = getCdnUrl(presentation.thumbnail);
  }

  return presentation;
}

/**
 * Add CDN URLs to array of presentations
 * @param {Array} presentations - Array of presentation documents
 * @returns {Array} - Array of presentations with CDN URLs added
 */
function addCdnUrlsToPresentations(presentations) {
  if (!Array.isArray(presentations)) {
    return presentations;
  }

  return presentations.map(presentation => addCdnUrlsToPresentation(presentation));
}

module.exports = {
  addCdnUrlsToVideo,
  addCdnUrlsToVideos,
  addCdnUrlsToPresentation,
  addCdnUrlsToPresentations
};

