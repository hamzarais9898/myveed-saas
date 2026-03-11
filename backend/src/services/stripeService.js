const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Subscription = require('../models/Subscription');
const User = require('../models/User');

/**
 * Create or retrieve Stripe customer
 */
const getOrCreateStripeCustomer = async (userId) => {
  const user = await User.findById(userId);
  const subscription = await Subscription.findOne({ userId });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: userId.toString()
    }
  });

  if (subscription) {
    subscription.stripeCustomerId = customer.id;
    await subscription.save();
  }

  return customer.id;
};

/**
 * Create Stripe Checkout Session with 14-day trial
 */
const createCheckoutSession = async (userId, plan, successUrl, cancelUrl) => {
  const customerId = await getOrCreateStripeCustomer(userId);
  
  // Price IDs for each plan (you'll need to create these in Stripe Dashboard)
  const priceIds = {
    creator: process.env.STRIPE_PRICE_CREATOR,
    expert: process.env.STRIPE_PRICE_EXPERT,
    professional: process.env.STRIPE_PRICE_PROFESSIONAL
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new Error('Invalid plan selected');
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        userId: userId.toString(),
        plan: plan
      }
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      plan: plan
    }
  });

  return session;
};

/**
 * Handle Stripe webhook events
 */
const handleWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;
  
  const subscription = await Subscription.findOne({ userId });
  if (subscription) {
    subscription.stripeCustomerId = session.customer;
    subscription.stripeSubscriptionId = session.subscription;
    await subscription.save();
  }
};

const handleSubscriptionCreated = async (stripeSubscription) => {
  const userId = stripeSubscription.metadata.userId;
  const plan = stripeSubscription.metadata.plan;
  
  const subscription = await Subscription.findOne({ userId });
  if (!subscription) return;

  subscription.plan = plan;
  subscription.status = stripeSubscription.status;
  subscription.stripeSubscriptionId = stripeSubscription.id;
  subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  subscription.hasUsedTrial = true;
  
  // Reset credits for new plan
  await subscription.resetCredits();
};

const handleSubscriptionUpdated = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: stripeSubscription.id 
  });
  
  if (!subscription) return;

  subscription.status = stripeSubscription.status;
  subscription.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
  subscription.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
  
  await subscription.save();
};

const handleSubscriptionDeleted = async (stripeSubscription) => {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: stripeSubscription.id 
  });
  
  if (!subscription) return;

  subscription.plan = 'free';
  subscription.status = 'cancelled';
  subscription.stripeSubscriptionId = null;
  
  // Reset to free plan credits
  subscription.credits = 30;
  subscription.creditsUsed = 0;
  subscription.ttsCredits = 10;
  subscription.ttsCreditsUsed = 0;
  
  await subscription.save();
};

const handlePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: invoice.subscription 
  });
  
  if (!subscription) return;

  subscription.lastPaymentDate = new Date();
  subscription.lastPaymentAmount = invoice.amount_paid / 100; // Convert from cents
  subscription.status = 'active';
  
  await subscription.save();
};

const handlePaymentFailed = async (invoice) => {
  const subscription = await Subscription.findOne({ 
    stripeSubscriptionId: invoice.subscription 
  });
  
  if (!subscription) return;

  subscription.status = 'past_due';
  await subscription.save();
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (userId) => {
  const subscription = await Subscription.findOne({ userId });
  
  if (!subscription?.stripeSubscriptionId) {
    throw new Error('No active subscription found');
  }

  await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
  
  subscription.autoRenew = false;
  await subscription.save();
  
  return subscription;
};

/**
 * Get subscription portal URL
 */
const createPortalSession = async (userId, returnUrl) => {
  const subscription = await Subscription.findOne({ userId });
  
  if (!subscription?.stripeCustomerId) {
    throw new Error('No Stripe customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return session.url;
};

module.exports = {
  getOrCreateStripeCustomer,
  createCheckoutSession,
  handleWebhook,
  cancelSubscription,
  createPortalSession
};
