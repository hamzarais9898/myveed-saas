const axios = require('axios');
const jwt = require('jsonwebtoken');
const BaseVideoProvider = require('./BaseVideoProvider');
const uploadService = require('../services/uploadService');

/**
 * KLING AI Video Generation Provider
 * Supports Kling 2.6 with Audio
 */
class KlingProvider extends BaseVideoProvider {
  constructor() {
    const hasKey = !!process.env.KLING_ACCESS_KEY && 
                   !!process.env.KLING_SECRET_KEY;
    
    const enabled = hasKey || process.env.ENABLE_KLING === 'true';
    
    super('kling', 'Kling AI 2.6', 'api', enabled);
    
    this.description = 'Next-gen video generation with high-quality audio and animation';
    this.features = ['text-to-video', 'image-to-video', 'kling-v2-6', 'audio-sync'];
    this.status = hasKey ? 'active' : (enabled ? 'simulation' : 'setup-required');
    this.baseUrl = process.env.KLING_BASE_URL || 'https://api-singapore.klingai.com';

    console.log(`🔌 KlingProvider Initialized | Enabled: ${enabled} | API Keys Present: ${hasKey}`);
  }

  isAvailable() {
    return this.enabled;
  }

  /**
   * Create JWT for Kling API authentication
   */
  _generateToken() {
    const accessKey = process.env.KLING_ACCESS_KEY;
    const secretKey = process.env.KLING_SECRET_KEY;

    if (!accessKey || !secretKey) {
      throw new Error('Kling API keys not configured');
    }

    const payload = {
      iss: accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
      nbf: Math.floor(Date.now() / 1000) - 5
    };

    return jwt.sign(payload, secretKey, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });
  }

  /**
   * Generate video using Kling API
   * @param {object} payload - { promptText, format, image, imageTail, duration, mode, cameraControl }
   */
  async generateVideo(payload) {
    const { 
      promptText, 
      format = 'youtube', 
      image, 
      imageTail, 
      duration = 10, 
      mode = 'std',
      cameraControl 
    } = payload;
    
    this.validatePayload(payload);

    try {
      console.log(`🎬 KLING 2.6 - Starting generation...`);
      console.log(`📝 Prompt: ${promptText}`);

      const accessKey = process.env.KLING_ACCESS_KEY;
      const secretKey = process.env.KLING_SECRET_KEY;

      if (!accessKey || !secretKey || accessKey === 'your_kling_access_key') {
        console.warn('⚠️ KLING API Keys not configured, using fallback simulation.');
        return this._simulateGeneration(promptText, format, image ? 'img2vid' : 'txt2vid');
      }

      const token = this._generateToken();
      
      const isImageToVideo = !!image;
      const endpoint = isImageToVideo ? '/v1/videos/image2video' : '/v1/videos/text2video';
      
      // Kling specific durations: strictly "5" or "10"
      const klingDuration = duration === 5 ? '5' : '10';

      let finalImageUrl = image;
      let finalImageTailUrl = imageTail;

      // Handle Base64 Start Image
      if (isImageToVideo && image && image.startsWith('data:')) {
          try {
             console.log('📤 Uploading Start Image to Cloudinary...');
             finalImageUrl = await uploadService.uploadImage(image, 'kling_assets');
          } catch (uploadError) {
             console.error('❌ Failed to upload start image:', uploadError.message);
             throw new Error(`Failed to upload start image: ${uploadError.message}`);
          }
      }

      // Handle Base64 Tail Image
      if (imageTail && imageTail.startsWith('data:')) {
          try {
             console.log('📤 Uploading Tail Image to Cloudinary...');
             finalImageTailUrl = await uploadService.uploadImage(imageTail, 'kling_assets');
          } catch (uploadError) {
             console.error('❌ Failed to upload tail image:', uploadError.message);
             throw new Error(`Failed to upload tail image: ${uploadError.message}`);
          }
      }
      
      const requestBody = {
        model_name: 'kling-v2-6', 
        prompt: promptText,
        negative_prompt: "",
        aspect_ratio: format === 'short' ? '9:16' : (format === 'youtube' ? '16:9' : '1:1'),
        duration: klingDuration,
        mode: mode, 
        sound: mode === 'pro' ? "on" : "off",
      };

      if (isImageToVideo) {
        requestBody.image = finalImageUrl;
        if (finalImageTailUrl) {
          requestBody.image_tail = finalImageTailUrl;
        }
      }

      // Add Camera Control if provided and no tail image (Kling restriction)
      if (cameraControl && !finalImageTailUrl) {
        requestBody.camera_control = cameraControl;
      }

      const response = await axios.post(`${this.baseUrl}${endpoint}`, requestBody, {
        timeout: 120000,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      // Error Code Mapping
      if (data.code !== 0) {
        let errorMsg = data.message || 'Kling API Generation failed';
        if (data.code === 1102) errorMsg = 'Your Maveed credits are available, but our Kling API account balance is currently low. Please contact support or try again later.';
        if (data.code === 1201) errorMsg = 'Sound not supported in this Kling mode. Please use Pro mode for sound.';
        
        const err = new Error(errorMsg);
        err.response = { status: 400, data: data };
        throw err;
      }

      const taskId = data.data?.task_id;

      if (!taskId) {
        throw new Error('Kling API did not return a task_id');
      }

      console.log(`✅ KLING Generation Started - Job ID: ${taskId}`);

      return {
        id: taskId,
        status: 'processing',
        provider: 'kling',
        mode: 'api',
        createdAt: new Date(),
        format: format,
        promptText: promptText
      };

    } catch (error) {
      console.error('❌ KLING generation error:', error.response?.data || error.message);
      
      if (process.env.NODE_ENV === 'development' || !process.env.KLING_ACCESS_KEY) {
        console.log('🔄 falling back to simulation.');
        return this._simulateGeneration(promptText, format, image ? 'img2vid' : 'txt2vid');
      }
      
      throw new Error(`Kling API Error: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Extend video by 5 seconds
   * @param {string} videoId - Original Kling Task ID
   * @param {object} options - { prompt }
   */
  async extendVideo(videoId, options = {}) {
    try {
      const token = this._generateToken();
      const payload = {
        video_id: videoId,
        prompt: options.prompt || "",
        sound: options.mode === 'pro' ? "on" : "off"
      };

      const response = await axios.post(`${this.baseUrl}/v1/videos/video-extend`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      // Error Code Mapping
      if (data.code !== 0) {
        let errorMsg = data.message || 'Kling API Extend failed';
        if (data.code === 1102) errorMsg = 'Your Maveed credits are available, but our Kling API account balance is currently low. Please contact support or try again later.';
        
        const err = new Error(errorMsg);
        err.response = { status: 400, data: data };
        throw err;
      }

      const taskId = data.data?.task_id;

      if (!taskId) {
        throw new Error('Kling API did not return a task_id');
      }

      return {
        id: taskId,
        status: 'processing',
        provider: 'kling',
        isExtension: true
      };
    } catch (error) {
      console.error('❌ KLING extension error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Check status of generation
   */
  async checkStatus(generationId) {
    try {
      if (typeof generationId === 'string' && generationId.startsWith('sim_')) {
          return { 
            id: generationId, 
            status: 'completed', 
            progress: 100,
            provider: 'kling', 
            videoUrl: 'https://videos.pexels.com/video-files/856100/856100-sd_640_360_30fps.mp4' 
          };
      }

      const accessKey = process.env.KLING_ACCESS_KEY;
      if (!accessKey) {
        throw new Error('Kling API Key missing for real generation check');
      }

      const token = this._generateToken();
      const endpoint = `/v1/videos/text2video/${generationId}`; // Same endpoint for query regardless of text/image input

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = response.data.data; // { task_id, task_status, task_result: { videos: [...] } }

      let status = 'processing';
      if (data.task_status === 'succeed') status = 'completed';
      else if (data.task_status === 'failed') status = 'failed';

      const videoUrl = data.task_result?.videos?.[0]?.url || null;

      return {
        id: data.task_id,
        status: status,
        progress: status === 'completed' ? 100 : 0,
        videoUrl: videoUrl,
        provider: 'kling',
        failureReason: data.task_status_msg || null
      };

    } catch (error) {
      console.error('Kling status check error:', error.response?.data || error.message);
      throw error;
    }
  }

  async _simulateGeneration(prompt, format, type = 'txt2vid') {
     console.log('🎭 Simulating Kling 2.6 Generation...');
     await new Promise(r => setTimeout(r, 1500));
     
     const mockUrl = type === 'img2vid' 
        ? 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
        : 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
     
     return {
        id: `sim_kling_${Date.now()}`,
        status: 'processing',
        provider: 'kling',
        mode: 'api',
        videoUrl: mockUrl,
        createdAt: new Date(),
        format: format,
        promptText: prompt
     };
  }
}

module.exports = new KlingProvider();
