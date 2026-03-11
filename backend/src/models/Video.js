const mongoose = require('mongoose');

/**
 * Video Schema
 * Stores generated videos with format, batch, and scheduling support
 */
/**
 * Schedule Item Schema
 */
const scheduleItemSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'publishing', 'published', 'failed'],
    default: 'pending'
  },
  publishId: {
    type: String,
    default: null
  },
  lastError: {
    type: String,
    default: null
  }
}, { _id: false });

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  influencerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Influencer',
    default: null
  },
  promptText: {
    type: String,
    required: [true, 'Prompt text is required'],
    trim: true
  },
  videoUrl: {
    type: String,
    required: false
  },
  format: {
    type: String,
    enum: ['youtube', 'short'],
    default: 'youtube',
    required: true
  },
  variantNumber: {
    type: Number,
    default: 1,
    min: 1
  },
  batchId: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 10
  },
  provider: {
    type: String,
    enum: ['luma', 'pika', 'runway', 'sora', 'veo', 'kling', 'manual'],
    default: 'luma'
  },
  mode: {
    type: String,
    enum: ['api', 'manual'],
    default: 'api'
  },
  metadata: {
    type: Object,
    default: {}
  },
  generationId: {
    type: String,
    index: true,
    default: null
  },
  externalId: {
    type: String,
    default: null
  },
  cost: {
    type: Number,
    default: 0
  },
  tokens: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'generating', 'transcribing', 'editing', 'finishing', 'generated', 'scheduled', 'published', 'failed', 'publishing'],
    default: 'pending'
  },
  progress: {
    type: Number,
    default: 0
  },
  platformPublished: {
    type: String,
    enum: ['none', 'instagram', 'tiktok', 'youtube', 'facebook', 'linkedin', 'both', 'all'],
    default: 'none'
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  schedules: {
    tiktok: scheduleItemSchema,
    instagram: scheduleItemSchema,
    youtube: scheduleItemSchema,
    facebook: scheduleItemSchema
  },
  tiktokAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TikTokAccount',
    default: null
  },
  tiktokPublishId: {
    type: String,
    default: null
  },
  tiktokVideoId: {
    type: String,
    default: null
  },
  tiktokShareUrl: {
    type: String,
    default: null
  },
  youtubeVideoId: {
    type: String,
    default: null
  },
  lastError: {
    type: String,
    default: null
  },
  // Detailed Format Info
  outputAspectRatio: {
    type: String,
    default: null
  },
  outputWidth: {
    type: Number,
    default: null
  },
  outputHeight: {
    type: Number,
    default: null
  },
  outputOrientation: {
    type: String,
    enum: ['landscape', 'portrait'],
    default: 'landscape'
  },
  targetPlatformType: {
    type: String,
    enum: ['youtube-long', 'short-form'],
    default: 'youtube-long'
  },
  variantType: {
    type: String,
    enum: ['youtube', 'short'],
    default: 'youtube'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries by user and batch
videoSchema.index({ userId: 1, createdAt: -1 });
videoSchema.index({ batchId: 1 });
videoSchema.index({ status: 1, scheduledDate: 1 });
videoSchema.index({ provider: 1, status: 1 });

module.exports = mongoose.model('Video', videoSchema);

/**
 * --- YOUTUBE INTEGRATION DOCUMENTATION ---
 * 
 * Required ENV Variables:
 * YOUTUBE_CLIENT_ID=<your_client_id>
 * YOUTUBE_CLIENT_SECRET=<your_client_secret>
 * YOUTUBE_REDIRECT_URI=<your_redirect_uri>
 * 
 * Postman Tests:
 * 
 * 1. Verify YouTube Connection (Scopes + Channel Info)
 * GET https://{{ngrok_url}}/api/publish/youtube/verify
 * Header: Authorization: Bearer {{JWT_TOKEN}}
 * 
 * 2. Publish Video to YouTube
 * POST https://{{ngrok_url}}/api/publish/youtube
 * Header: Authorization: Bearer {{JWT_TOKEN}}
 * Body (JSON):
 * {
 *   "videoId": "65d... (Mongo ID)",
 *   "title": "My Amazing Video",
 *   "description": "Published via MyVeed",
 *   "privacyStatus": "unlisted"
 * }
 */
