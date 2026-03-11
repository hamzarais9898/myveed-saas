const express = require('express');
const router = express.Router();
const platformController = require('../controllers/platformController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Platform Connectivity Routes
 */

// Route to get auth URL for YouTube
router.get('/oauth/youtube/connect', protect, platformController.connectYouTube);

// Route to get auth URL for Instagram
router.get('/oauth/instagram/connect', protect, platformController.connectInstagram);

// Callback route for YouTube
router.get('/oauth/youtube/callback', platformController.youtubeCallback);

// Callback route for Instagram (as requested by user, can be / or specific)
router.get('/oauth/instagram/callback', platformController.instagramCallback);

// Status of platforms (YouTube, Instagram, etc)
router.get('/platforms/status', protect, platformController.getPlatformStatus);

// Disconnect YouTube
router.post('/platforms/youtube/disconnect', protect, platformController.disconnectYouTube);

// Route to get auth URL for Facebook
router.get('/platforms/facebook/connect', protect, platformController.connectFacebook);

// Callback route for Facebook
router.get('/oauth/facebook/callback', platformController.facebookCallback);

// Disconnect Facebook
router.post('/platforms/facebook/disconnect', protect, platformController.disconnectFacebook);

// Disconnect Instagram
router.post('/platforms/instagram/disconnect', protect, platformController.disconnectInstagram);

router.get('/oauth/facebook/callback-debug', platformController.facebookCallbackDebug);

// TikTok Routes
router.get('/oauth/tiktok/connect', protect, platformController.connectTikTok);
router.get('/oauth/tiktok/callback', platformController.tiktokCallback);
router.post('/platforms/tiktok/disconnect', protect, platformController.disconnectTikTok);


module.exports = router;
