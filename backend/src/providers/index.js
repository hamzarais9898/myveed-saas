/**
 * Provider Router
 * Routes video generation requests to the appropriate provider
 * Supports: LUMA (api), PIKA (manual), RUNWAY (manual), SORA (coming), VEO (coming)
 */

const lumaProvider = require('./luma.provider');
const pikaProvider = require('./pika.provider');
const runwayProvider = require('./runway.provider');
const soraProvider = require('./sora.provider');
const veoProvider = require('./veo.provider');

const AVAILABLE_PROVIDERS = {
  luma: lumaProvider,
  pika: pikaProvider,
  runway: runwayProvider,
  sora: soraProvider,
  veo: veoProvider
};

/**
 * Get provider instance
 * @param {string} providerId - Provider ID
 * @returns {object} - Provider instance
 */
function getProvider(providerId) {
  const provider = AVAILABLE_PROVIDERS[providerId.toLowerCase()];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider;
}

/**
 * Generate video using selected provider
 * @param {object} payload - { promptText, format, provider }
 * @returns {Promise<object>} - Generation job info
 */
exports.generateVideo = async (payload) => {
  try {
    const { promptText, format = 'youtube', provider = 'auto' } = payload;

    console.log(`--------------------------------------------------`);
    console.log(`🎥 [PROVIDER ROUTER] Requested=${provider} | format=${format}`);

    // Resolve provider
    let selectedProvider = provider === 'auto'
      ? (process.env.DEFAULT_PROVIDER || 'runway')
      : provider;

    selectedProvider = selectedProvider.toLowerCase();

    // Get provider instance
    const providerInstance = getProvider(selectedProvider);
    
    console.log(`🎥 [PROVIDER ROUTER] Resolved=${selectedProvider} | Enabled=${providerInstance.enabled}`);

    // Check if provider is available
    if (!providerInstance.enabled) {
      const defaultProvider = (process.env.DEFAULT_PROVIDER || 'runway').toLowerCase();

      // If the selected provider is the default one, we can't fallback (avoid infinite loop)
      if (selectedProvider === defaultProvider) {
        console.error(`❌ [PROVIDER ROUTER] Default provider ${selectedProvider.toUpperCase()} is disabled!`);
        throw new Error(`Provider ${selectedProvider.toUpperCase()} is not enabled. Please check API key/configuration.`);
      }

      console.warn(`⚠️  [PROVIDER ROUTER] Provider ${selectedProvider} is disabled. Falling back to ${defaultProvider}`);
      return await exports.generateVideo({
        promptText,
        format,
        provider: defaultProvider
      });
    }

    // Call provider
    return await providerInstance.generateVideo(payload);

  } catch (error) {
    console.error('❌ Provider router error:', error.message);
    throw error;
  }
};

/**
 * Check video generation status
 * @param {string} generationId - The generation job ID
 * @param {string} provider - Provider ID
 * @returns {Promise<object>} - Status information
 */
exports.checkStatus = async (generationId, provider = 'luma') => {
  try {
    const providerInstance = getProvider(provider);
    return await providerInstance.checkStatus(generationId);
  } catch (error) {
    console.error('❌ Status check error:', error.message);
    throw error;
  }
};

/**
 * Complete manual video upload
 * @param {string} generationId - The generation job ID
 * @param {string} provider - Provider ID
 * @param {string} videoUrl - Video URL
 * @returns {Promise<object>}
 */
exports.completeVideo = async (generationId, provider, videoUrl) => {
  try {
    const providerInstance = getProvider(provider);

    if (providerInstance.mode !== 'manual') {
      throw new Error(`Provider ${provider} does not support manual video upload`);
    }

    return await providerInstance.completeVideo(generationId, videoUrl);
  } catch (error) {
    console.error('❌ Complete video error:', error.message);
    throw error;
  }
};

/**
 * Get available providers and their status
 * @returns {array} - List of available providers with configuration status
 */
exports.getAvailableProviders = () => {
  const providers = [];

  // LUMA - Always available if configured
  if (lumaProvider.enabled) {
    providers.push(lumaProvider.getInfo());
  } else {
    providers.push({
      id: 'luma',
      name: 'LUMA Dream Machine',
      description: 'Cinematic video generation - Fast & Reliable',
      status: 'coming-soon',
      mode: 'api',
      enabled: false,
      features: ['text-to-video', 'image-to-video'],
      available: false
    });
  }

  // PIKA - Manual mode
  if (process.env.ENABLE_PIKA === 'true') {
    providers.push(pikaProvider.getInfo());
  }

  // RUNWAY - Official Gen-3 Alpha
  if (runwayProvider.enabled) {
    providers.push(runwayProvider.getInfo());
  } else {
    providers.push({
      id: 'runway',
      name: 'RUNWAY Gen-3 Alpha',
      description: 'General Purpose World Model - High Fidelity',
      status: 'setup-required',
      mode: 'api',
      enabled: false,
      features: ['text-to-video', 'image-to-video', 'gen-3-alpha'],
      available: false
    });
  }

  // SORA - Real Provider
  if (soraProvider.enabled) {
    providers.push(soraProvider.getInfo());
  } else {
    providers.push({
      id: 'sora',
      name: 'SORA',
      description: 'Advanced AI video - High Fidelity',
      status: 'setup-required',
      mode: 'api',
      enabled: false,
      features: ['text-to-video', 'image-to-video'],
      available: false
    });
  }

  // VEO - Real Gemini API Integration
  const veoAvailable = !!process.env.VEO_API_KEY && veoProvider.enabled;
  if (veoAvailable) {
    providers.push(veoProvider.getInfo());
  } else {
    providers.push({
      id: 'veo',
      name: 'VEO V3',
      description: 'High-quality Generation (Google Gemini)',
      status: 'setup-required',
      mode: 'api',
      enabled: false,
      features: ['text-to-video', 'image-to-video'],
      available: false
    });
  }

  return providers;
};

/**
 * Check if provider is available and functional
 * @param {string} provider - Provider ID
 * @returns {boolean}
 */
exports.isProviderAvailable = (provider) => {
  try {
    const providerInstance = getProvider(provider);
    return providerInstance.isAvailable();
  } catch (error) {
    return false;
  }
};

exports.getProvider = getProvider;
module.exports.AVAILABLE_PROVIDERS = AVAILABLE_PROVIDERS;
