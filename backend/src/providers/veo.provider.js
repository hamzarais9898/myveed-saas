const BaseVideoProvider = require('./BaseVideoProvider');
const veoService = require('../services/veoService');

/**
 * Google Veo Video Provider
 * High-quality video generation using Google Gemini API
 */
class VeoProvider extends BaseVideoProvider {
  constructor() {
    super('veo', 'VEO V3', 'api');
    this.enabled = !!process.env.VEO_API_KEY;
  }

  /**
  async generateVideo(payload) {
    const { promptText, image, format, duration, outputConfig } = payload;
    const aspectRatio = outputConfig?.aspectRatio || (format === 'short' ? '9:16' : '16:9');

    console.log(`[FORMAT RESOLVER] requestedFormat=${format} | resolvedAspectRatio=${aspectRatio} | orientation=${outputConfig?.orientation || (format === 'short' ? 'portrait' : 'landscape')}`);

    try {
      console.log(`🎬 [VEO PROVIDER] Starting generation request...`);
      const operation = await veoService.generateVideoOp({
        promptText: promptText,
        image: image,
        aspectRatio: aspectRatio,
        duration: duration || process.env.VEO_DEFAULT_DURATION_SECONDS || 8
      });

      // Standardized response for controller
      return {
        id: operation.name, // "operations/XXXX"
        requestId: operation.name,
        status: 'processing',
        provider: this.id,
        mode: this.mode,
        createdAt: new Date(),
        format: payload.format,
        promptText: payload.promptText,
        duration: payload.duration
      };
    } catch (error) {
      console.error('❌ [VEO ERROR] Provider generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Check operation status
   * @param {string} generationId - The operation name
   */
  async checkStatus(generationId) {
    try {
      console.log(`🔍 [VEO POLL] Checking status | operation=${generationId}`);
      const operation = await veoService.getOperation(generationId);
      
      const status = operation.done ? 'completed' : 'processing';
      const videoUrl = operation.done ? veoService.extractVideoUrl(operation) : null;
      
      // Handle failure
      if (operation.error) {
        console.error(`❌ [VEO POLL] Operation failed | error=${operation.error.message}`);
        return {
          id: generationId,
          status: 'failed',
          provider: this.id,
          failureReason: operation.error.message || 'Unknown Google API error',
          rawStatus: JSON.stringify(operation.error)
        };
      }

      console.log(`🔍 [VEO POLL] status=${status} | done=${operation.done} | videoUrlFound=${!!videoUrl}`);
      
      return {
        id: generationId,
        status: status,
        progress: operation.done ? 100 : 50, // LRO doesn't always give fine-grained progress
        provider: this.id,
        videoUrl: videoUrl,
        rawStatus: operation.done ? 'DONE' : 'RUNNING'
      };
    } catch (error) {
      console.error('❌ [VEO ERROR] Status check failed:', error.message);
      throw error;
    }
  }

  /**
   * Download content to a local file for post-processing
   */
  async downloadContentToFile(generationId, destPath) {
    try {
      const status = await this.checkStatus(generationId);
      
      if (status.status !== 'completed' || !status.videoUrl) {
        throw new Error(`Cannot download: Video not ready or URL missing (Status: ${status.status})`);
      }

      return await veoService.downloadFile(status.videoUrl, destPath);
    } catch (error) {
      console.error('❌ [VEO ERROR] Download content failed:', error.message);
      throw error;
    }
  }

  /**
   * Get provider information
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: 'Ultra-high quality video generation (Google Gemini)',
      status: this.enabled ? 'active' : 'setup-required',
      mode: this.mode,
      enabled: this.enabled,
      features: ['text-to-video', 'image-to-video'],
      available: this.enabled
    };
  }
}

module.exports = new VeoProvider();
