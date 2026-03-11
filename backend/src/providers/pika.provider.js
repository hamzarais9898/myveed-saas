const BaseVideoProvider = require('./BaseVideoProvider');

/**
 * PIKA Video Generation Provider
 * Placeholder for future PIKA API integration
 * Currently supports manual video upload mode
 */
class PikaProvider extends BaseVideoProvider {
  constructor() {
    const enabled = process.env.ENABLE_PIKA === 'true';
    super('pika', 'PIKA 1.0', 'manual', enabled);
    
    this.description = 'Advanced video generation - Coming Soon';
    this.features = ['text-to-video', 'video-editing', 'motion-control'];
    this.status = 'coming-soon';
    this.waitlist = true;
    this.signupUrl = 'https://pika.art/waitlist';
  }

  isAvailable() {
    // PIKA is always available in manual mode for future API integration
    return true;
  }

  /**
   * Generate video using PIKA
   * For now, returns a pending job (manual mode)
   * @param {object} payload - { promptText, format }
   * @returns {Promise<object>} - Video generation job info
   */
  async generateVideo(payload) {
    const { promptText, format = 'youtube' } = payload;
    
    this.validatePayload(payload);

    console.log(`🎬 PIKA - Job queued (manual mode)`);
    console.log(`📝 Prompt: ${promptText}`);
    console.log(`ℹ️  PIKA API not yet integrated. Video will be uploaded manually.`);

    // Return pending job - user will upload video manually via admin
    return {
      id: `pika_${Date.now()}`,
      status: 'pending',
      provider: 'pika',
      mode: 'manual',
      createdAt: new Date(),
      format: format,
      promptText: promptText,
      message: 'PIKA is in queue. Please upload the video manually.'
    };
  }

  /**
   * Check video generation status
   * In manual mode, status depends on video URL being set
   * @param {string} generationId - The generation job ID
   * @returns {Promise<object>} - Status information
   */
  async checkStatus(generationId) {
    // In manual mode, return pending unless video has been uploaded
    return {
      id: generationId,
      status: 'pending',
      provider: 'pika',
      mode: 'manual',
      message: 'Awaiting manual video upload'
    };
  }

  /**
   * Complete video upload for manual mode
   * @param {string} generationId - Job ID
   * @param {string} videoUrl - Video URL
   * @returns {Promise<object>}
   */
  async completeVideo(generationId, videoUrl) {
    if (!videoUrl) {
      throw new Error('videoUrl is required to complete video');
    }

    console.log(`✅ PIKA - Video uploaded successfully`);
    console.log(`🔗 URL: ${videoUrl}`);

    return {
      id: generationId,
      status: 'completed',
      videoUrl: videoUrl,
      provider: 'pika',
      mode: 'manual',
      completedAt: new Date()
    };
  }
}

module.exports = new PikaProvider();
