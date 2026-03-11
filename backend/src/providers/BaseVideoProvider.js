/**
 * BaseVideoProvider
 * Abstract base class for all video generation providers
 * Defines the interface that all providers must implement
 */

class BaseVideoProvider {
  /**
   * Constructor
   * @param {string} id - Provider identifier (luma, pika, runway, veo, sora)
   * @param {string} name - Human-readable provider name
   * @param {string} mode - "api" or "manual"
   * @param {boolean} enabled - Is this provider enabled?
   */
  constructor(id, name, mode = 'api', enabled = false) {
    this.id = id;
    this.name = name;
    this.mode = mode; // 'api' or 'manual'
    this.enabled = enabled;
    this.description = '';
    this.features = [];
    this.status = enabled ? 'active' : 'coming-soon';
    this.waitlist = false;
    this.signupUrl = null;
  }

  /**
   * Generate a video
   * @param {object} payload - { promptText, format, ... }
   * @returns {Promise<object>} - { id, status, mode, ... }
   */
  async generateVideo(payload) {
    if (!this.isAvailable()) {
      throw new Error(`Provider ${this.id} is not available`);
    }
    throw new Error('generateVideo() not implemented in ' + this.constructor.name);
  }

  /**
   * Check generation status
   * @param {string} generationId - Job ID
   * @returns {Promise<object>} - { status, videoUrl, ... }
   */
  async checkStatus(generationId) {
    throw new Error('checkStatus() not implemented in ' + this.constructor.name);
  }

  /**
   * Is this provider available?
   * @returns {boolean}
   */
  isAvailable() {
    return this.enabled;
  }

  /**
   * Get provider info (for frontend)
   * @returns {object}
   */
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      mode: this.mode,
      enabled: this.enabled,
      status: this.status,
      features: this.features,
      waitlist: this.waitlist,
      signupUrl: this.signupUrl,
      available: this.isAvailable()
    };
  }

  /**
   * Handle video completion (for manual mode)
   * @param {string} generationId - Job ID
   * @param {string} videoUrl - Video URL
   * @returns {Promise<object>}
   */
  async completeVideo(generationId, videoUrl) {
    if (this.mode !== 'manual') {
      throw new Error('completeVideo() only available for manual mode providers');
    }
    return {
      id: generationId,
      status: 'completed',
      videoUrl: videoUrl,
      completedAt: new Date()
    };
  }

  /**
   * Validate payload
   * @param {object} payload - Generation payload
   * @throws {Error} if invalid
   */
  validatePayload(payload) {
    if ((!payload.promptText || payload.promptText.trim().length === 0) && !payload.image) {
      throw new Error('promptText or image is required');
    }
    if (!['youtube', 'short', 'both'].includes(payload.format)) {
      throw new Error('format must be youtube, short, or both');
    }
  }
}

module.exports = BaseVideoProvider;
