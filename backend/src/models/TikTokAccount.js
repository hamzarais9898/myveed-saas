const mongoose = require('mongoose');

/**
 * TikTokAccount Schema
 * Stores TikTok account connections per user
 */
const tiktokAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  platform: {
    type: String,
    default: 'tiktok'
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  tokenType: {
    type: String,
    default: 'bearer'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  openId: {
    type: String
  },
  tiktokUsername: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// updatedAt middleware
tiktokAccountSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TikTokAccount', tiktokAccountSchema);
