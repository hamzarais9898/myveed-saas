const express = require('express');
const router = express.Router();
const publishController = require('../controllers/publishController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Publishing Routes
 * Handles video and photo publishing to various platforms
 */

// POST /publish/instagram
router.post('/publish/instagram', protect, publishController.publishToInstagram);

// POST /publish/tiktok
router.post('/publish/tiktok', protect, publishController.publishToTikTok);

// GET /publish/tiktok/verify
router.get('/publish/tiktok/verify', protect, publishController.verifyTikTok);

// POST /publish/tiktok/status
router.post('/publish/tiktok/status', protect, publishController.fetchTikTokStatus);

// POST /publish/facebook/video
router.post('/publish/facebook/video', protect, publishController.publishFacebookVideo);

// POST /publish/facebook/reel
router.post('/publish/facebook/reel', protect, publishController.publishFacebookReel);

// POST /publish/facebook/photo
router.post('/publish/facebook/photo', protect, publishController.publishFacebookPhoto);

// POST /publish/linkedin
router.post('/publish/linkedin', protect, publishController.publishToLinkedIn);

// POST /publish/youtube
router.post('/publish/youtube', protect, publishController.publishToYouTube);

// GET /publish/youtube/verify
router.get('/publish/youtube/verify', protect, publishController.verifyYouTube);

// GET /publish/instagram/verify
router.get("/publish/instagram/verify", protect, publishController.verifyInstagram);

module.exports = router;
