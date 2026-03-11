const veoProvider = require('../providers/veo.provider');
const soraService = require('./soraService');

/**
 * Video Generation Service - Abstraction Layer
 * Routes video generation requests to the appropriate provider (VEO or SORA)
 * 
 * NOTE: This service is often used by specialized controllers (Stars, Influencers).
 * It uses the provider system for Veo to ensure consistency.
 */

/**
 * Generate video using selected generator
 * @param {string} promptText - The text prompt for video generation
 * @param {string} format - Video format: 'youtube' (16:9) or 'short' (9:16)
 * @param {string} generator - Generator choice: 'veo' or 'sora'
 * @param {string} image - Optional input image for image-to-video
 * @returns {Promise<object>} - Generation job info
 */
exports.generateVideo = async (promptText, format = 'youtube', generator = null, image = null) => {
  try {
    // Use default if no generator specified
    const selectedGenerator = (generator || process.env.DEFAULT_VIDEO_GENERATOR || 'veo').toLowerCase();

    console.log(`🎥 Video Generation Service - Using: ${selectedGenerator.toUpperCase()}`);

    if (!['veo', 'sora'].includes(selectedGenerator)) {
      throw new Error(`Invalid generator: ${selectedGenerator}. Must be 'veo' or 'sora'.`);
    }

    if (selectedGenerator === 'sora') {
      // Sora still uses its dedicated service for high-level calls sometimes
      return await soraService.generateVideo(promptText, format);
    } else {
      // Use the unified provider for Veo
      return await veoProvider.generateVideo({
        promptText,
        format,
        image
      });
    }
  } catch (error) {
    console.error('❌ Video generation service error:', error);
    throw error;
  }
};

/**
 * Check video generation status
 * @param {string} videoId - The video ID to check
 * @param {string} generator - Generator used: 'veo' or 'sora'
 * @returns {Promise<object>} - Status information
 */
exports.checkVideoStatus = async (videoId, generator = 'veo') => {
  try {
    if (generator.toLowerCase() === 'sora') {
      return await soraService.checkVideoStatus(videoId);
    } else {
      return await veoProvider.checkStatus(videoId);
    }
  } catch (error) {
    console.error('❌ Status check error:', error);
    throw error;
  }
};

/**
 * Get available generators info
 */
exports.getAvailableGenerators = () => {
  return [
    {
      id: 'veo',
      name: 'VEO (Google)',
      description: 'High-quality video generation by Google Gemini',
      supported: veoProvider.enabled,
      models: ['veo-2.0-generate-001', 'veo-3.0-generate-001']
    },
    {
      id: 'sora',
      name: 'SORA (OpenAI)',
      description: 'Advanced AI video generation by OpenAI',
      supported: !!process.env.OPENAI_API_KEY && process.env.ENABLE_SORA === 'true',
      models: ['sora-2']
    }
  ];
};
