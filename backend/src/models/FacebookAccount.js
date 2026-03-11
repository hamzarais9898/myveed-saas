const mongoose = require('mongoose');

/**
 * FacebookAccount Schema
 * Stores Facebook account connections and Page tokens
 */
const facebookAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    facebookId: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    email: { // Optional, might not get it depending on scopes
        type: String
    },
    userAccessToken: {
        type: String,
        required: true
    },
    tokenType: {
        type: String,
        default: 'bearer'
    },
    expiresAt: {
        type: Date
    },
    pages: [{
        pageId: { type: String, required: true },
        name: { type: String, required: true },
        accessToken: { type: String, required: true }, // Page Access Token
        category: { type: String },
        tasks: [{ type: String }] // tasks allowed on this page (e.g. MANAGE, PUBLISH)
    }],
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
facebookAccountSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('FacebookAccount', facebookAccountSchema);
