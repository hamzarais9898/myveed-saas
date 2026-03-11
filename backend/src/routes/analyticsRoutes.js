const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Analytics Routes
 * Base path: /api/analytics
 */

// Public routes
router.get('/public-stats', analyticsController.getPublicStats);

// Protected routes
router.get('/overview', protect, analyticsController.getOverview);
router.get('/trends', protect, analyticsController.getTrends);
router.get('/video/:id', protect, analyticsController.getVideoAnalytics);
router.post('/sync/:videoId', protect, analyticsController.syncAnalytics);
router.post('/sync-all', protect, analyticsController.syncAll);

// TikTok specific sync
router.post('/tiktok/sync/:videoId', protect, analyticsController.syncTikTokAnalytics);

// Dev/Debug routes (Only in development)
if (process.env.NODE_ENV !== 'production') {
    router.get('/dev/tiktok/video/:mongoVideoId', protect, analyticsController.debugTikTokVideo);
}

module.exports = router;
