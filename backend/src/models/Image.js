const mongoose = require('mongoose');

/**
 * Image Schema
 * Stores AI-generated images that can be used for video generation
 */
const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  promptText: {
    type: String,
    required: [true, 'Prompt text is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['gemini', 'dall-e', 'midjourney', 'banana'],
    default: 'gemini'
  },
  generationId: {
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
    enum: ['pending', 'processing', 'generated', 'failed'],
    default: 'pending'
  },
  resolution: {
    type: String,
    enum: ['512x512', '768x768', '1024x1024', '1024x1792', '1792x1024'],
    default: '1024x1024'
  },
  style: {
    type: String,
    enum: ['realistic', 'cinematic', 'illustration', 'anime', 'painting', 'photorealistic'],
    default: 'cinematic'
  },
  generationTime: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  usedForVideos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video'
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

// Index for faster queries
imageSchema.index({ userId: 1, createdAt: -1 });
imageSchema.index({ provider: 1, status: 1 });
imageSchema.index({ generationId: 1 });

module.exports = mongoose.model('Image', imageSchema);
