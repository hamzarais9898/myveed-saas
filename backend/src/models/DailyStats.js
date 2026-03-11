const mongoose = require('mongoose');

const dailyStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'tiktok', 'instagram', 'total'],
    default: 'total'
  },
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
  }
});

dailyStatsSchema.index({ userId: 1, date: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('DailyStats', dailyStatsSchema);
