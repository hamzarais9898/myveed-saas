const mongoose = require('mongoose');

/**
 * InstagramAccount Schema
 * Stores Instagram account connections per user
 */
const instagramAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    platform: {
        type: String,
        default: 'instagram'
    },
    accessToken: {
        type: String,
        required: true
    },
    tokenType: {
        type: String,
        default: 'long-lived'
    },
    expiresAt: {
        type: Date,
        required: true
    },
    instagramId: {
        type: String
    },
    username: {
        type: String
    },
    pageId: {
        type: String
    },
    pageName: {
        type: String
    },
    pageAccessToken: {
        type: String,
        default: null
    },
    instagramBusinessAccountId: {
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
instagramAccountSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('InstagramAccount', instagramAccountSchema);
