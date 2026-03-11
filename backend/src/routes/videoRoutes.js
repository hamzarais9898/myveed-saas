const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { protect } = require('../middleware/authMiddleware');

// Get video status
router.get('/:id/status', protect, videoController.getVideoStatus);

/**
 * Video Routes
 * All routes are protected with authentication middleware
 */

// Generate new video(s)
router.post('/generate', protect, videoController.generateVideo);

// Get available video providers
router.get('/providers/available', protect, videoController.getAvailableProviders);

// Complete manual video upload
router.post('/admin/upload-complete/:id', protect, videoController.completeManualUpload);

// Get all user videos
router.get('/', protect, videoController.getVideos);

// Get videos by batch ID
router.get('/batch/:batchId', protect, videoController.getBatchVideos);

// Batch schedule multiple videos
router.post('/batch-schedule', protect, videoController.batchSchedule);

// Download video
router.get('/download/:id', protect, videoController.downloadVideo);

// Schedule video
router.post('/:id/schedule', protect, videoController.scheduleVideo);

// Schedule multi platforms
router.post('/:id/schedule-multi', protect, videoController.scheduleMulti);
router.post('/:id/schedule-platform', protect, videoController.schedulePlatform);

// Cancel schedule
router.delete('/:id/schedule', protect, videoController.cancelSchedule);

// Get Sora content stream
router.get('/:id/sora-content', protect, videoController.getSoraContent);

// Get single video by ID
router.get('/:id', protect, videoController.getVideoById);

// Delete all videos
router.delete('/all', protect, videoController.deleteAllVideos);

// Delete video
router.delete('/:id', protect, videoController.deleteVideo);

// Sora Debug route (admin protected in controller)
router.get('/debug/sora/:videoId', protect, videoController.getSoraDebugInfo);

module.exports = router;
