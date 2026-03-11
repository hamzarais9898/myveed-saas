const mongoose = require('mongoose');

/**
 * YouTubeAccount Schema
 * Stores YouTube account connections per user
 */
const youtubeAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One YouTube account per user for now
    },
    platform: {
        type: String,
        default: 'youtube'
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
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
youtubeAccountSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('YouTubeAccount', youtubeAccountSchema);
