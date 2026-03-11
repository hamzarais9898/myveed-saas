const Video = require('../models/Video');

/**
 * Download Service
 * Handles video download functionality
 */

/**
 * Get video download URL
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} - Download URL and metadata
 */
exports.getVideoDownloadUrl = async (videoId, userId) => {
  try {
    // Find video and verify ownership
    const video = await Video.findOne({ _id: videoId, userId });

    if (!video) {
      throw new Error('Video not found or access denied');
    }

    if (video.status !== 'generated' && video.status !== 'published' && video.status !== 'scheduled') {
      throw new Error('Video is not ready for download');
    }

    // Return download information
    return {
      downloadUrl: video.videoUrl,
      filename: `video-${video.format}-${videoId}.mp4`,
      format: video.format,
      promptText: video.promptText
    };
  } catch (error) {
    console.error('Download service error:', error);
    throw error;
  }
};

/**
 * Get batch download URLs
 * @param {string} batchId - Batch ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Array>} - Array of download URLs
 */
exports.getBatchDownloadUrls = async (batchId, userId) => {
  try {
    // Find all videos in batch
    const videos = await Video.find({ 
      batchId, 
      userId,
      status: { $in: ['generated', 'published', 'scheduled'] }
    });

    if (videos.length === 0) {
      throw new Error('No videos found in this batch');
    }

    // Return download information for all videos
    return videos.map(video => ({
      videoId: video._id,
      downloadUrl: video.videoUrl,
      filename: `video-${video.format}-variant${video.variantNumber}-${video._id}.mp4`,
      format: video.format,
      variantNumber: video.variantNumber
    }));
  } catch (error) {
    console.error('Batch download service error:', error);
    throw error;
  }
};
