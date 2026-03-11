const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['tiktok', 'instagram', 'youtube', 'facebook'],
    required: true
  },
  // Performance metrics
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  watchTime: {
    type: Number, // in seconds
    default: 0
  },
  engagement: {
    type: Number, // percentage
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  // Date tracking (Normalized to UTC 00:00:00)
  date: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Production-Ready Unique Index: One record per video/platform/day
analyticsSchema.index({ userId: 1, videoId: 1, platform: 1, date: 1 }, { unique: true });

// Supporting indexes for queries
analyticsSchema.index({ userId: 1, date: -1 });
analyticsSchema.index({ platform: 1, date: -1 });

// Calculate engagement rate
analyticsSchema.methods.calculateEngagement = function () {
  if (this.views === 0) return 0;
  const totalEngagements = this.likes + this.shares + this.comments;
  this.engagement = (totalEngagements / this.views) * 100;
  return this.engagement;
};

module.exports = mongoose.model('Analytics', analyticsSchema);
