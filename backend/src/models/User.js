const mongoose = require('mongoose');

/**
 * User Schema
 * Stores user authentication data and social media tokens
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: {
    type: String
  },
  picture: {
    type: String
  },
  instagramAccessToken: {
    type: String,
    default: null
  },
  instagram_connected: {
    type: Boolean,
    default: false
  },
  tiktokAccessToken: {
    type: String,
    default: null
  },
  tiktok_connected: {
    type: Boolean,
    default: false
  },
  youtubeAccessToken: {
    type: String,
    default: null
  },
  facebookAccessToken: {
    type: String,
    default: null
  },
  facebook_connected: {
    type: Boolean,
    default: false
  },
  facebookPageAccessToken: {
    type: String,
    default: null
  },
  linkedinAccessToken: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  city: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationExpires: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    select: false // Hide by default
  },
  deviceId: {
    type: String,
    select: false // Hide by default
  }
});

module.exports = mongoose.model('User', userSchema);
