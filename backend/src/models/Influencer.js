const mongoose = require('mongoose');

/**
 * Influencer Schema
 * Stores AI-generated influencers with granular facial and physical parameters
 * allowing for ultra-realistic reproductions and consistency.
 */
const influencerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Influencer name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['man', 'woman'],
    required: true
  },
  bodyType: {
    type: String,
    enum: ['calme', 'athletic', 'muscular', 'heavy'],
    default: 'athletic'
  },
  hair: {
    color: { type: String, default: 'blonde' },
    style: { type: String, default: 'long' }
  },
  skin: {
    tone: { type: String, default: 'fair' }
  },
  eyes: {
    color: { type: String, default: 'blue' }
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  avatarUrl: {
    type: String,
    required: true
  },
  // No longer using Ready Player Me
  // rpmAvatarUrl: { type: String, default: null },
  // Facial and Physical Configuration
  config: {
    eyes: {
      color: { type: String, default: 'brown' }, // blue, green, brown, hazel, etc.
      shape: { type: String, default: 'almond' }, // almond, round, hooded, etc.
      details: { type: String, default: '' } // long lashes, intense look
    },
    smile: {
      type: { type: String, default: 'natural' }, // natural, wide, subtle
      teeth: { type: String, default: 'white' }
    },
    skin: {
      tone: { type: String, default: 'fair' },
      features: { type: String, default: 'smooth' }, // freckles, moles, wrinkles
      freckles: { type: Boolean, default: false },
      frecklesIntensity: { type: Number, default: 0 } // 0-100
    },
    hair: {
      color: { type: String, default: 'brown' },
      style: { type: String, default: 'straight' }, // straight, wavy, curly, braids
      length: { type: String, default: 'medium' },
      highlights: { type: String, default: '' }
    },
    body: {
      type: { type: String, default: 'average' }, // slim, athletic, average, curvy
      height: { type: String, default: 'average' }
    },
    ethnicity: { type: String, default: 'european' },
    aesthetic: { type: String, default: 'realistic' } // realistic, cinematic, anime
  },
  photos: [{
    imageUrl: String,
    prompt: String,
    cost: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  videos: [{
    videoUrl: String,
    originalImageUrl: String,
    prompt: String,
    cost: { type: Number, default: 0 },
    tokens: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'draft'],
    default: 'active',
    index: true
  }
});

// Index for faster queries
influencerSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Influencer', influencerSchema);
