const Subscription = require('../models/Subscription');
const User = require('../models/User');
const stripeService = require('../services/stripeService');

/**
 * Get current user subscription
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    let subscription = await Subscription.findOne({ userId });

    // Create free subscription if doesn't exist
    if (!subscription) {
      const isAdminEmail = req.user.email === 'othman.mekouar99@gmail.com';
      subscription = await Subscription.create({
        userId,
        plan: isAdminEmail ? 'professional' : 'free',
        credits: isAdminEmail ? -1 : 30,
        ttsCredits: isAdminEmail ? -1 : 10
      });
    } else if (req.user.email === 'othman.mekouar99@gmail.com' && subscription.plan !== 'professional') {
      // Sync admin plan if out of sync
      subscription.plan = 'professional';
      subscription.credits = -1;
      subscription.ttsCredits = -1;
      await subscription.save();
    }

    res.json({
      success: true,
      subscription: {
        id: subscription._id,
        plan: subscription.plan,
        credits: subscription.credits,
        creditsUsed: subscription.creditsUsed,
        remainingCredits: subscription.remainingCredits,
        ttsCredits: subscription.ttsCredits,
        ttsCreditsUsed: subscription.ttsCreditsUsed,
        remainingTtsCredits: subscription.remainingTtsCredits,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription'
    });
  }
};

/**
 * Get all available plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = Subscription.getPlanDetails();

    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get plans'
    });
  }
};

/**
 * Create Stripe checkout session
 */
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user._id;

    // Validate plan
    const validPlans = ['creator', 'expert', 'professional'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      });
    }

    const successUrl = `${process.env.FRONTEND_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing?canceled=true`;

    const session = await stripeService.createCheckoutSession(userId, plan, successUrl, cancelUrl);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
};

/**
 * Handle Stripe webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await stripeService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook error'
    });
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    await stripeService.cancelSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription cancelled. You will be downgraded to free plan at the end of your billing period.'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

/**
 * Get usage statistics
 */
exports.getUsageStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const creditsPercentage = subscription.plan === 'professional' 
      ? 100 
      : (subscription.remainingCredits / subscription.credits) * 100;

    const ttsCreditsPercentage = subscription.plan === 'professional'
      ? 100
      : (subscription.remainingTtsCredits / subscription.ttsCredits) * 100;

    res.json({
      success: true,
      usage: {
        plan: subscription.plan,
        credits: {
          total: subscription.credits,
          used: subscription.creditsUsed,
          remaining: subscription.remainingCredits,
          percentage: creditsPercentage
        },
        ttsCredits: {
          total: subscription.ttsCredits,
          used: subscription.ttsCreditsUsed,
          remaining: subscription.remainingTtsCredits,
          percentage: ttsCreditsPercentage
        },
        periodEnd: subscription.currentPeriodEnd
      }
    });
  } catch (error) {
    console.error('Get usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage stats'
    });
  }
};
