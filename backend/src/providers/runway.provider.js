const axios = require('axios');
const BaseVideoProvider = require('./BaseVideoProvider');
const uploadService = require('../services/uploadService');


class RunwayProvider extends BaseVideoProvider {
  constructor() {
    const hasKey = !!process.env.RUNWAY_API_KEY && 
                   process.env.RUNWAY_API_KEY !== 'your_runway_api_key_here';
    
    const enabled = hasKey || process.env.ENABLE_RUNWAY === 'true';
    
    super('runway', 'RUNWAY Gen-3 Alpha', 'api', enabled);
    
    this.description = 'General Purpose World Model - High Fidelity';
    this.features = ['text-to-video', 'image-to-video', 'gen-3-alpha'];
    this.status = hasKey ? 'active' : (enabled ? 'simulation' : 'setup-required');
    this.baseUrl = 'https://api.dev.runwayml.com/v1';

    console.log(`🔌 RunwayProvider Initialized | Enabled: ${enabled} | API Key Present: ${hasKey}`);
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Generate video using Runway API
   * @param {object} payload - { promptText, format, image }
   */
  async generateVideo(payload) {
    const { promptText, format = 'youtube', image } = payload;
    
    this.validatePayload(payload);

    try {
      console.log(`🎬 RUNWAY Gen-3 - Starting generation...`);
      console.log(`📝 Prompt: ${promptText}`);

      const API_KEY = process.env.RUNWAY_API_KEY;

      if (!API_KEY || API_KEY === 'your_runway_api_key_here') {
        console.warn('⚠️ RUNWAY API Key not configured, using fallback simulation.');
        return this._simulateGeneration(promptText, format, image ? 'img2vid' : 'txt2vid');
      }

      // Prepare request payload for Gen-3 Alpha Turbo
      const isImageToVideo = !!image;
      const endpoint = isImageToVideo ? 'image_to_video' : 'text_to_video';
      
      const duration = payload.duration >= 10 ? 10 : 5;

      let finalImageUrl = image;

      // Handle Base64 Image - Upload to Cloudinary first
      if (isImageToVideo && image && image.startsWith('data:')) {
          try {
             console.log('📤 Converting Base64 Image to Public URL (Cloudinary)...');
             // Upload to 'runway_assets' folder
             finalImageUrl = await uploadService.uploadImage(image, 'runway_assets');
          } catch (uploadError) {
             console.error('❌ Failed to upload image for Runway:', uploadError.message);
             // In dev, proceed to simulation via catch block logic?
             // Or throw to let the outer catch handle it?
             throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
      }
      
      const requestBody = {
        model: 'gen3a_turbo', 
        promptText: promptText,
        ratio: format === 'short' ? '768:1280' : '1280:768',
        duration: duration, // Gen-3 Alpha Turbo supports 5 or 10
        watermark: false
      };

      if (isImageToVideo) {
        requestBody.promptImage = finalImageUrl;
      }

      const response = await axios.post(`${this.baseUrl}/${endpoint}`, requestBody, {
        timeout: 120000, // 2 minutes timeout to prevent EPIPE/Timeout errors
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06'
        }
      });

      const data = response.data;
      console.log(`✅ RUNWAY Generation Started - Job ID: ${data.id}`);

      return {
        id: data.id,
        status: 'processing',
        provider: 'runway',
        mode: 'api',
        createdAt: new Date(),
        format: format,
        promptText: promptText
      };

    } catch (error) {
      console.error('❌ RUNWAY generation error:', error.response?.data || error.message);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Development mode: falling back to simulation.');
        return this._simulateGeneration(promptText, format, image ? 'img2vid' : 'txt2vid');
      }
      
      throw new Error(`Runway API Error: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Check status of generation
   */
  async checkStatus(generationId) {
    try {
      // 1. Check for simulation ID first (always handle locally)
      if (typeof generationId === 'string' && generationId.startsWith('sim_')) {
          return { 
            id: generationId, 
            status: 'completed', 
            progress: 100,
            provider: 'runway', 
            videoUrl: 'https://videos.pexels.com/video-files/856100/856100-sd_640_360_30fps.mp4' 
          };
      }

      const API_KEY = process.env.RUNWAY_API_KEY;

      if (!API_KEY || API_KEY === 'your_runway_api_key_here') {
        throw new Error('Runway API Key missing for real generation check');
      }

      const response = await axios.get(`${this.baseUrl}/tasks/${generationId}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'X-Runway-Version': '2024-11-06'
        }
      });

      const data = response.data; // { id, status: 'PENDING'|'RUNNING'|'SUCCEEDED'|'FAILED', output: [url] }

      let status = 'processing';
      if (data.status === 'SUCCEEDED') status = 'completed';
      else if (data.status === 'FAILED') status = 'failed';

      return {
        id: data.id,
        status: status,
        progress: data.progress ? Math.round(data.progress * 100) : (status === 'completed' ? 100 : 0),
        videoUrl: data.output && data.output.length > 0 ? data.output[0] : null,
        provider: 'runway',
        failureReason: data.failureReason || null
      };

    } catch (error) {
      console.error('Runway status check error:', error.response?.data || error.message);
      throw error;
    }
  }

  async _simulateGeneration(prompt, format, type = 'txt2vid') {
     console.log('🎭 Simulating Runway Gen-3 Generation...');
     await new Promise(r => setTimeout(r, 1500));
     
     const mockUrl = type === 'img2vid' 
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
     
     return {
        id: `sim_runway_${Date.now()}`,
        status: 'processing', // Start as processing to simulate real flow
        provider: 'runway',
        mode: 'api',
        videoUrl: mockUrl,
        createdAt: new Date(),
        format: format,
        promptText: prompt
     };
  }
}

module.exports = new RunwayProvider();
