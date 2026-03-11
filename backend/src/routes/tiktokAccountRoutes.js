const express = require('express');
const router = express.Router();
const tiktokAccountController = require('../controllers/tiktokAccountController');
const { protect } = require('../middleware/authMiddleware');

/**
 * TikTok Account Routes
 * Handles multi-account TikTok OAuth and management
 */

// Get all TikTok accounts
router.get('/', protect, tiktokAccountController.getTikTokAccounts);

// Disconnect account
router.delete('/:id', protect, tiktokAccountController.disconnectTikTokAccount);

// Refresh token
router.put('/:id/refresh', protect, tiktokAccountController.refreshTikTokToken);

module.exports = router;
