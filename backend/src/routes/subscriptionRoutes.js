const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication except webhook
router.get('/current', protect, subscriptionController.getCurrentSubscription);
router.get('/plans', protect, subscriptionController.getPlans);
router.get('/usage', protect, subscriptionController.getUsageStats);
router.post('/checkout', protect, subscriptionController.createCheckoutSession);
router.post('/cancel', protect, subscriptionController.cancelSubscription);

// Webhook (no auth - verified by Stripe signature)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

module.exports = router;
