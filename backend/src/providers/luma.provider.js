const fetch = require('node-fetch');
const BaseVideoProvider = require('./BaseVideoProvider');

/**
 * LUMA Dream Machine Video Generation Provider
 * Production-ready video generation with text-to-video and image-to-video
 */
class LumaProvider extends BaseVideoProvider {
  constructor() {
    const enabled = !!process.env.LUMA_API_KEY && 
                    process.env.LUMA_API_KEY !== 'your_luma_api_key_here';
    super('luma', 'LUMA Dream Machine', 'api', enabled);
    
    this.description = 'Cinematic video generation - Fast & Reliable';
    this.features = ['text-to-video', 'image-to-video', 'aspect-ratio-control'];
    this.status = enabled ? 'active' : 'coming-soon';
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Generate video using LUMA Dream Machine API
   * @param {object} payload - { promptText, format }
   * @returns {Promise<object>} - Video generation job info
   */
  async generateVideo(payload) {
    const { promptText, format = 'youtube' } = payload;
    
    this.validatePayload(payload);

    try {
      console.log(`🎬 LUMA Dream Machine - Starting generation...`);
      console.log(`📝 Prompt: ${promptText}`);
      console.log(`📐 Format: ${format}`);

      const API_URL = process.env.LUMA_API_URL || 'https://api.lumalabs.ai/dream-machine/v1';
      const API_KEY = process.env.LUMA_API_KEY;

      if (!API_KEY || API_KEY === 'your_luma_api_key_here') {
        console.warn('⚠️ LUMA API Key not configured, using fallback simulation.');
        return this._simulateGeneration(promptText, format);
      }

      // Determine aspect ratio
      const aspectRatio = format === 'short' ? '9:16' : '16:9';

      // Make request to LUMA API
      const response = await fetch(`${API_URL}/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: promptText,
          aspect_ratio: aspectRatio,
          loop: false,
          duration: 6,
          camera: { type: 'dynamic' }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`LUMA API Error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ LUMA Generation Started - Job ID: ${data.id}`);

      return {
        id: data.id,
        status: 'processing',
        provider: 'luma',
        mode: 'api',
        createdAt: new Date(),
        format: format,
        promptText: promptText
      };

    } catch (error) {
      console.error('❌ LUMA video generation error:', error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: falling back to simulation.');
        return this._simulateGeneration(promptText, format);
      }
      
      throw new Error('Failed to generate video with LUMA: ' + error.message);
    }
  }

  /**
   * Check video generation status
   * @param {string} generationId - The generation job ID
   * @returns {Promise<object>} - Status information
   */
  async checkStatus(generationId) {
    try {
      const API_URL = process.env.LUMA_API_URL || 'https://api.lumalabs.ai/dream-machine/v1';
      const API_KEY = process.env.LUMA_API_KEY;

      if (!API_KEY || API_KEY === 'your_luma_api_key_here') {
        return {
          id: generationId,
          status: 'completed',
          videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          provider: 'luma'
        };
      }

      const response = await fetch(`${API_URL}/generations/${generationId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (!response.ok) {
        throw new Error(`LUMA Status Check Error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: data.id,
        status: data.state || data.status,
        videoUrl: data.assets?.video || null,
        provider: 'luma',
        createdAt: data.created_at,
        failureReason: data.failure_reason || null
      };

    } catch (error) {
      console.error('LUMA status check error:', error);
      throw new Error('Failed to check video status: ' + error.message);
    }
  }

  /**
   * Simulation helper for development
   * @private
   */
  async _simulateGeneration(promptText, format) {
    console.log('🎭 Using simulated LUMA generation (development mode)');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const youtubeVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    ];
    
    const shortVideos = [
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    ];
    
    const videoPool = format === 'short' ? shortVideos : youtubeVideos;
    const videoUrl = videoPool[Math.floor(Math.random() * videoPool.length)];

    return {
      id: `sim_${Date.now()}`,
      status: 'completed',
      provider: 'luma',
      mode: 'api',
      videoUrl: videoUrl,
      createdAt: new Date(),
      format: format,
      promptText: promptText
    };
  }
}

module.exports = new LumaProvider();
