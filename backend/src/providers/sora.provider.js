const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const FormData = require('form-data');
const BaseVideoProvider = require('./BaseVideoProvider');

/**
 * Sora (OpenAI) Video Generation Provider
 */
class SoraProvider extends BaseVideoProvider {
  constructor() {
    const hasKey = !!process.env.OPENAI_API_KEY;
    const enabled = (process.env.ENABLE_SORA === 'true') && hasKey;

    super('sora', 'SORA', 'api', enabled);

    this.description = 'OpenAI Sora - High-fidelity video generation';
    this.features = ['text-to-video', 'image-to-video'];
    this.status = hasKey ? 'active' : 'setup-required';
    this.baseUrl = 'https://api.openai.com/v1';

    // Create a specialized axios instance for Sora with interceptors
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000
    });

    // Request Interceptor: Log details and track time
    this.api.interceptors.request.use(config => {
      config.metadata = { startTime: new Date() };

      const key = process.env.OPENAI_API_KEY || '';
      const fingerprint = key ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(none)';
      const projectId = process.env.OPENAI_PROJECT_ID || '(none)';

      console.log(`🚀 [SORA REQ] ${config.method.toUpperCase()} ${config.url}`);
      console.log(`   🔑 Key Fingerprint: ${fingerprint} | Project: ${projectId}`);

      // Log headers (excluding full Authorization)
      const safeHeaders = { ...config.headers };
      if (safeHeaders.Authorization) {
        safeHeaders.Authorization = `Bearer ${fingerprint}`;
      }
      console.log(`   📝 Headers:`, JSON.stringify(safeHeaders));

      return config;
    }, error => Promise.reject(error));

    // Response Interceptor: Log metrics and Request ID
    this.api.interceptors.response.use(response => {
      const duration = new Date() - response.config.metadata.startTime;
      const requestId = response.headers['x-request-id'] || '(none)';

      console.log(`✅ [SORA RES] ${response.status} | ID: ${requestId} | Time: ${duration}ms`);
      return response;
    }, error => {
      const duration = error.config?.metadata?.startTime ? (new Date() - error.config.metadata.startTime) : 'unknown';
      const requestId = error.response?.headers?.['x-request-id'] || '(none)';

      console.error(`❌ [SORA ERR] ${error.response?.status || 'network'} | ID: ${requestId} | Time: ${duration}ms`);
      console.error(`   Message: ${error.response?.data?.error?.message || error.message}`);
      return Promise.reject(error);
    });

    const key = process.env.OPENAI_API_KEY || '';
    const fingerprint = key ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(none)';
    const projectId = process.env.OPENAI_PROJECT_ID || '(none)';
    
    console.log(`📡 [SORA STARTUP] Enabled: ${enabled} | Key: ${fingerprint} | Project: ${projectId}`);
    console.log(`plug SoraProvider Initialized | Enabled: ${enabled} | API Key Present: ${hasKey}`);
  }

  /**
   * Helper to get common OpenAI headers
   * @returns {object}
   */
  getOpenAIHeaders() {
    const API_KEY = process.env.OPENAI_API_KEY;
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };

    if (process.env.OPENAI_PROJECT_ID) {
      headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID;
    }

    return headers;
  }

  /**
   * Is this provider available?
   * @returns {boolean}
   */
  isAvailable() {
    return this.enabled;
  }

  // --- Image Processing Helpers ---

  isDataUri(str) {
    return typeof str === 'string' && str.startsWith('data:image/');
  }

  dataUriToBuffer(dataUri) {
    const regex = /^data:(image\/[a-zA-Z0-9.+-]+);base64,/;
    const match = dataUri.match(regex);
    if (!match) throw new Error('Invalid DataURI format');

    const mimeType = match[1];
    const base64Data = dataUri.replace(regex, '');
    return { buffer: Buffer.from(base64Data, 'base64'), mimeType };
  }

  async fetchUrlToBuffer(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 120000 });
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    return { buffer: Buffer.from(response.data), mimeType };
  }

  async resizeToTarget(buffer, targetSize) {
    try {
      const [widthStr, heightStr] = targetSize.split('x');
      const width = parseInt(widthStr);
      const height = parseInt(heightStr);

      console.log(`🖼️ [SORA] Resizing image to ${width}x${height}...`);

      const resizedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'cover' })
        .jpeg({ quality: 92 })
        .toBuffer();

      return { buffer: resizedBuffer, mimeType: 'image/jpeg', filename: 'input.jpg' };
    } catch (error) {
      console.error('❌ [SORA] Sharp resize error:', error.message);
      throw new Error(`Failed to resize input image. Unsupported format or corrupted file. (${error.message})`);
    }
  }

  async prepareInputReference(imageRef, size) {
    let raw;
    if (this.isDataUri(imageRef)) {
      raw = this.dataUriToBuffer(imageRef);
    } else {
      raw = await this.fetchUrlToBuffer(imageRef);
    }
    return await this.resizeToTarget(raw.buffer, size);
  }

  /**
   * Reinforce prompt for identity preservation
   * @param {string} userPrompt 
   * @param {object} options 
   * @returns {string}
   */
  buildIdentityPreservingPrompt(userPrompt, options = {}) {
    const { sourceType, preserveIdentity } = options;
    const isInfluencer = sourceType === 'influencer' || preserveIdentity === true;

    if (!isInfluencer) return userPrompt;

    const block = `
Use the source image as the exact identity reference. 
Keep the exact same real human person from the source image. 
Preserve facial identity, facial proportions, hairstyle, hair color, eye color, skin tone, expression realism, and overall photorealistic appearance. 
Do not redesign, reinterpret, restyle, beautify, cartoonize, animefy, illustrate, or stylize the person. 
Do not change the person into a drawing, animation character, CGI model, doll-like face, or video game character. 
The subject must remain the exact same real human as in the source image. 
Only add subtle natural motion and realistic live-action movement.`;

    return userPrompt ? `${userPrompt.trim()}\n\n[MANDATORY CONSTRAINTS]:${block}` : block.trim();
  }

  /**
   * Generate video using Sora API
   * @param {object} payload - { promptText, format, duration }
   */
  async generateVideo(payload) {
    const { promptText, format = 'youtube', duration = '4', image, sourceType, preserveIdentity, outputConfig } = payload;

    this.validatePayload(payload);

    // Resolve specific dimensions from outputConfig or fallback
    const width = outputConfig?.width || (format === 'short' ? 720 : 1280);
    const height = outputConfig?.height || (format === 'short' ? 1280 : 720);
    const size = `${width}x${height}`;

    console.log(`[FORMAT RESOLVER] requestedFormat=${format} | resolvedAspectRatio=${outputConfig?.aspectRatio || (format === 'short' ? '9:16' : '16:9')} | width=${width} | height=${height} | orientation=${outputConfig?.orientation || (format === 'short' ? 'portrait' : 'landscape')}`);
    
    const key = process.env.OPENAI_API_KEY || '';
    const fingerprint = key ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(none)';
    const projectId = process.env.OPENAI_PROJECT_ID || '(none)';
    
    console.log(`🎬 [SORA REQ PRE-FLIGHT] Model: sora-2 | hasImage: ${!!image} | format: ${format} | size: ${size} | duration: ${duration}`);
    console.log(`   🔑 Key Fingerprint: ${fingerprint} | Project: ${projectId}`);

    // Identity Preservation logic
    const basePrompt = outputConfig?.promptHint ? `${outputConfig.promptHint}. ${promptText}` : promptText;
    const finalPrompt = this.buildIdentityPreservingPrompt(basePrompt, { sourceType, preserveIdentity });
    if (sourceType === 'influencer' || preserveIdentity) {
      console.log(`🛡️ [SORA] Identity Lock enabled. Reinforced prompt applied.`);
    }

    const validDurations = ['4', '8', '12'];
    const seconds = duration.toString();

    if (!validDurations.includes(seconds)) {
      throw new Error('Sora duration must be 4, 8, or 12 seconds');
    }

    try {
      let response;
      let requestId;

      if (image) {
        console.log(`🎞️ [SORA] Image-to-Video mode enabled | targetSize=${size}`);
        const ref = await this.prepareInputReference(image, size);

        const form = new FormData();
        form.append('model', 'sora-2');
        form.append('prompt', (finalPrompt || '').toString());
        form.append('seconds', seconds);
        form.append('size', size);
        form.append('input_reference', ref.buffer, {
          filename: ref.filename,
          contentType: ref.mimeType
        });

        const headers = {
          ...this.getOpenAIHeaders(),
          ...form.getHeaders()
        };

        response = await this.api.post('/videos', form, { headers });
      } else {
        console.log(`🎬 [SORA] Text-to-Video mode`);
        response = await this.api.post('/videos', {
          model: "sora-2",
          prompt: finalPrompt,
          seconds: seconds,
          size: size
        }, {
          headers: this.getOpenAIHeaders()
        });
      }

      requestId = response.headers['x-request-id'];
      console.log(`📊 SORA Response Data:`, JSON.stringify(response.data, null, 2));

      const data = response.data;
      console.log(`✅ SORA Generation Started - Job ID: ${data.id}`);

      return {
        id: data.id,
        requestId: requestId,
        status: 'processing',
        provider: 'sora',
        mode: 'api',
        createdAt: new Date(),
        format: format,
        promptText: promptText,
        duration: seconds,
        generationType: image ? 'image-to-video' : 'text-to-video'
      };

    } catch (error) {
      const resp = error.response?.data?.error || {};
      const requestId = error.response?.headers?.['x-request-id'] || '(none)';
      const key = process.env.OPENAI_API_KEY || '';
      const fingerprint = key ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(none)';
      const projectId = process.env.OPENAI_PROJECT_ID || '(none)';

      console.error(`❌ [SORA ERR DETAILED]`);
      console.error(`   Message: ${resp.message || error.message}`);
      console.error(`   Type: ${resp.type || 'unknown'}`);
      console.error(`   Code: ${resp.code || 'unknown'}`);
      console.error(`   ID: ${requestId}`);
      console.error(`   Project: ${projectId}`);
      console.error(`   Fingerprint: ${fingerprint}`);

      const errorMsg = resp.message || error.message;
      throw new Error(`Sora API Error: ${errorMsg}`);
    }
  }

  /**
   * Wait until the generation is completed
   * @param {string} videoId
   * @param {object} options - { timeoutMs, intervalMs }
   */
  async waitForCompletion(videoId, { timeoutMs, intervalMs } = {}, onProgress = null) {
    if (!videoId || typeof videoId !== 'string' || !videoId.startsWith('video_')) {
      console.error(`❌ [SORA] Invalid videoId for polling:`, videoId);
      throw new Error(`Invalid videoId: ${videoId}. Sora IDs must start with 'video_'`);
    }

    const maxPollMs = timeoutMs || parseInt(process.env.SORA_MAX_POLL_MS) || 1200000; // Default 20 mins
    const defaultInterval = intervalMs || parseInt(process.env.SORA_POLL_INTERVAL_MS) || 10000; // Default 10s
    const startTime = Date.now();
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10;
    let currentInterval = defaultInterval;

    // Sentinel class for definitive (non-retryable) failures
    class FatalGenerationError extends Error {
      constructor(msg) { super(msg); this.isFatal = true; }
    }

    console.log(`⏳ [SORA POLL] Strict polling started for ${videoId} (Max: ${maxPollMs}ms)`);

    while (Date.now() - startTime < maxPollMs) {
      try {
        const response = await this.api.get(`/videos/${videoId}`, {
          headers: this.getOpenAIHeaders()
        });

        consecutiveErrors = 0; // Reset on success
        const data = response.data;
        const { status, progress, completed_at, error } = data;

        console.log(`🕒 [POLL] ID: ${videoId} | Status: ${status} | Progress: ${progress || 0}% | Completed: ${completed_at || 'no'} | Error: ${error ? JSON.stringify(error) : 'none'}`);

        // Notify background caller of progress updates
        if (onProgress && typeof onProgress === 'function' && progress != null) {
          const pct = progress <= 1 ? Math.round(progress * 100) : Math.round(progress);
          onProgress(pct).catch(() => {});
        }

        if (['completed', 'succeeded'].includes(status)) {
          console.log(`🎯 [SORA FINAL] Generation completed for ${videoId}!`);
          return data;
        }

        // Definitive failure — throw FatalGenerationError so it is NOT retried
        if (['failed', 'canceled'].includes(status)) {
          const msg = error?.message || `Sora generation ${status}`;
          const code = error?.code || '';
          console.error(`❌ [SORA FINAL] Generation ${status}: ${msg}${code ? ` (${code})` : ''}`);
          throw new FatalGenerationError(msg);
        }

        // Adaptive polling interval
        if (status === 'queued') currentInterval = Math.max(defaultInterval, 15000);
        else if (status === 'in_progress') currentInterval = Math.max(defaultInterval / 2, 5000);
        else currentInterval = defaultInterval;

      } catch (err) {
        // Do NOT retry definitive generation failures
        if (err.isFatal) throw err;

        consecutiveErrors++;
        const status = err.response?.status;
        const requestId = err.response?.headers?.['x-request-id'] || 'unknown';

        // Retry only on network errors or 429/500
        const isRetryable = !status || status === 429 || status >= 500;

        if (isRetryable && consecutiveErrors < maxConsecutiveErrors) {
          const backoff = Math.min(currentInterval * Math.pow(1.5, consecutiveErrors), 30000);
          console.warn(`⚠️ [SORA RETRY] ${status || 'Network'} error (ID: ${requestId}). Retrying in ${Math.round(backoff / 1000)}s... (${consecutiveErrors}/${maxConsecutiveErrors})`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          continue;
        } else {
          console.error(`❌ [SORA POLL] Permanent failure or max retries reached for ${videoId}`);
          throw err;
        }
      }

      // Normal wait before next poll
      await new Promise(resolve => setTimeout(resolve, currentInterval));
    }

    throw new Error('Timeout waiting for Sora generation completion');
  }

  /**
   * Check status of generation
   */
  async checkStatus(generationId) {
    try {
      if (typeof generationId === 'string' && generationId.startsWith('sim_')) {
        return { id: generationId, status: 'completed', progress: 100, provider: 'sora', videoUrl: 'https://videos.pexels.com/video-files/856100/856100-sd_640_360_30fps.mp4' };
      }

      const response = await this.api.get(`/videos/${generationId}`, {
        headers: this.getOpenAIHeaders()
      });

      const data = response.data;

      let status = 'processing';
      if (['completed', 'succeeded'].includes(data.status)) status = 'completed';
      else if (['failed', 'canceled'].includes(data.status)) status = 'failed';
      else if (['queued', 'in_progress', 'processing'].includes(data.status)) status = 'processing';

      return {
        id: data.id,
        status: status,
        progress: data.progress ? Math.round(data.progress * 100) : (status === 'completed' ? 100 : 0),
        provider: 'sora',
        videoUrl: null,
        failureReason: data.error?.message || null,
        rawStatus: data.status,
        requestId: response.headers['x-request-id']
      };

    } catch (error) {
      console.error('Sora status check error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Download content from Sora to a local file
   */
  async downloadContentToFile(generationId, outputPath) {
    try {
      console.log(`📥 Downloading SORA content for ${generationId}...`);

      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/videos/${generationId}/content`,
        responseType: 'stream',
        headers: this.getOpenAIHeaders(),
        timeout: 300000
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ SORA content downloaded to: ${outputPath}`);
          resolve(outputPath);
        });
        writer.on('error', (err) => {
          console.error(`❌ Sora download stream error: ${err.message}`);
          reject(err);
        });
      });
    } catch (error) {
      console.error('Sora download error:', error.message);
      throw error;
    }
  }

  /**
   * Get content stream directly from OpenAI
   */
  async getContentStream(generationId) {
    try {
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/videos/${generationId}/content`,
        responseType: 'stream',
        headers: this.getOpenAIHeaders(),
        timeout: 300000
      });
      return response.data;
    } catch (error) {
      console.error('Sora get content stream error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new SoraProvider();
