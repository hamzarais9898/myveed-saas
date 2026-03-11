const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Public route: Subscribe
router.post('/subscribe', newsletterController.subscribe);

// Public route: Unsubscribe
router.post('/unsubscribe', newsletterController.unsubscribe);

// Admin route: Get all subscribers
router.get('/subscribers', protect, isAdmin, newsletterController.getAllSubscribers);

// Admin route: Send bulk email
router.post('/send-bulk', protect, isAdmin, newsletterController.sendBulkEmail);

module.exports = router;
