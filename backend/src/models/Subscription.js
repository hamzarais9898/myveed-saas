const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'creator', 'expert', 'professional'],
    default: 'free',
    required: true
  },
  // MAVEED Shorts credits
  credits: {
    type: Number,
    default: 30 // Free plan default
  },
  creditsUsed: {
    type: Number,
    default: 0
  },
  // Text to Speech credits
  ttsCredits: {
    type: Number,
    default: 10 // Free plan default
  },
  ttsCreditsUsed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'past_due'],
    default: 'active'
  },
  // Stripe integration
  stripeCustomerId: {
    type: String,
    default: null
  },
  stripeSubscriptionId: {
    type: String,
    default: null
  },
  // Billing period
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Payment history
  lastPaymentDate: {
    type: Date,
    default: null
  },
  lastPaymentAmount: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for remaining credits
subscriptionSchema.virtual('remainingCredits').get(function() {
  if (this.plan === 'professional') return -1; // Unlimited
  return Math.max(0, this.credits - this.creditsUsed);
});

subscriptionSchema.virtual('remainingTtsCredits').get(function() {
  if (this.plan === 'professional') return -1; // Unlimited
  return Math.max(0, this.ttsCredits - this.ttsCreditsUsed);
});

// Method to check if user has enough credits
subscriptionSchema.methods.hasCredits = function(amount = 10) {
  if (this.plan === 'professional') return true; // Unlimited
  return this.remainingCredits >= amount;
};

subscriptionSchema.methods.hasTtsCredits = function(amount = 1) {
  if (this.plan === 'professional') return true; // Unlimited
  return this.remainingTtsCredits >= amount;
};

// Method to deduct credits
subscriptionSchema.methods.deductCredits = async function(amount = 10) {
  if (this.plan !== 'professional') {
    this.creditsUsed += amount;
    await this.save();
  }
  return this.remainingCredits;
};

subscriptionSchema.methods.deductTtsCredits = async function(amount = 1) {
  if (this.plan !== 'professional') {
    this.ttsCreditsUsed += amount;
    await this.save();
  }
  return this.remainingTtsCredits;
};

// Method to reset credits (monthly renewal)
subscriptionSchema.methods.resetCredits = async function() {
  const planLimits = {
    free: { credits: 30, ttsCredits: 10 },
    creator: { credits: 10, ttsCredits: 5 },
    expert: { credits: 600, ttsCredits: 120 },
    professional: { credits: -1, ttsCredits: -1 }
  };

  const limits = planLimits[this.plan];
  this.credits = limits.credits;
  this.creditsUsed = 0;
  this.ttsCredits = limits.ttsCredits;
  this.ttsCreditsUsed = 0;
  this.currentPeriodStart = new Date();
  this.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await this.save();
};

// Static method to get plan details
subscriptionSchema.statics.getPlanDetails = function() {
  return {
    free: {
      name: 'Free',
      price: 0,
      credits: 30,
      ttsCredits: 10,
      features: [
        '30 MAVEED Shorts credits',
        '10 Text to Speech credits',
        'Watermark on videos',
        'Community support'
      ]
    },
    creator: {
      name: 'Creator',
      price: 5.99,
      credits: 10,
      ttsCredits: 5,
      trial: false,
      features: [
        'No watermark',
        '10 MAVEED Shorts credits (5s=1, 10s=2)',
        '5 Text to Speech credits',
        '3 background music tracks',
        'Prompt to Video (Veo3)',
        'Auto publish (Scheduling)',
        'Priority support'
      ]
    },
    expert: {
      name: 'Expert',
      price: 39,
      credits: 600,
      ttsCredits: 120,
      trial: false,
      features: [
        'All Creator features',
        '600 MAVEED Shorts credits',
        '120 Text to Speech credits',
        'All background music tracks',
        'Advanced analytics',
        'Auto publish (Scheduling)',
        'Priority support'
      ]
    },
    professional: {
      name: 'Professional',
      price: 89,
      credits: -1, // Unlimited
      ttsCredits: -1, // Unlimited
      trial: false,
      features: [
        'All Expert features',
        'Unlimited Auto publish',
        'Unlimited MAVEED Shorts',
        'Unlimited Text to Speech',
        'White label option',
        'Dedicated support',
        'API access',
        'Custom integrations'
      ]
    }
  };
};

// Index for efficient queries
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Ensure virtuals are included in JSON
subscriptionSchema.set('toJSON', { virtuals: true });
subscriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
