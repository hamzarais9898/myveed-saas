/**
 * Format Resolver Utility
 * Centralizes logic for converting high-level formats (youtube, short) 
 * into technical dimensions, ratios, and orientations.
 */

const DEFAULT_WIDTH_LANDSCAPE = 1280;
const DEFAULT_HEIGHT_LANDSCAPE = 720;
const DEFAULT_WIDTH_PORTRAIT = 720;
const DEFAULT_HEIGHT_PORTRAIT = 1280;

/**
 * Resolves technical configuration for a given format and provider
 * @param {string} format - 'youtube' or 'short'
 * @param {string} provider - 'sora', 'veo', 'luma', etc.
 * @returns {object}
 */
exports.resolveOutputConfig = (format, provider = 'auto') => {
  const isShort = format === 'short';
  
  const config = {
    variantType: format,
    aspectRatio: isShort ? '9:16' : '16:9',
    orientation: isShort ? 'portrait' : 'landscape',
    targetPlatformType: isShort ? 'short-form' : 'youtube-long',
    width: isShort ? DEFAULT_WIDTH_PORTRAIT : DEFAULT_WIDTH_LANDSCAPE,
    height: isShort ? DEFAULT_HEIGHT_PORTRAIT : DEFAULT_HEIGHT_LANDSCAPE,
    promptHint: isShort 
      ? 'Generate a cinematic vertical 9:16 video optimized for TikTok / YouTube Shorts / Reels' 
      : 'Generate a cinematic horizontal 16:9 video for standard YouTube viewing'
  };

  // Provider-specific overrides
  const prov = provider.toLowerCase();
  
  if (prov === 'sora') {
    // Sora values based on their current API capabilities
    config.width = isShort ? 720 : 1280;
    config.height = isShort ? 1280 : 720;
    config.providerSize = `${config.width}x${config.height}`;
  } else if (prov === 'veo') {
    // Veo values
    config.width = isShort ? 720 : 1280;
    config.height = isShort ? 1280 : 720;
    config.providerSize = `${config.width}x${config.height}`;
  } else if (prov === 'luma' || prov === 'pika') {
    // Luma/Pika often use slightly different defaults
    config.width = isShort ? 720 : 1280;
    config.height = isShort ? 1280 : 720;
  }

  return config;
};

/**
 * Gets the list of configs to generate based on requested format
 * @param {string} format - 'youtube', 'short', or 'both'
 * @param {string} provider
 * @returns {Array}
 */
exports.resolveAllConfigs = (format, provider = 'auto') => {
  if (format === 'both') {
    return [
      this.resolveOutputConfig('youtube', provider),
      this.resolveOutputConfig('short', provider)
    ];
  }
  return [this.resolveOutputConfig(format, provider)];
};
