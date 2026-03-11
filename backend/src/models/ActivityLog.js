const mongoose = require('mongoose');

/**
 * Activity Log Schema
 * Tracks all user and admin actions for audit purposes
 */
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User actions
      'user_registered',
      'user_login',
      'video_created',
      'video_deleted',
      'subscription_upgraded',
      'subscription_cancelled',
      'payment_succeeded',
      'payment_failed',
      // Admin actions
      'admin_user_updated',
      'admin_user_suspended',
      'admin_user_deleted',
      'admin_subscription_updated',
      'admin_payment_refunded',
      'admin_credits_added'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // For admin actions
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
