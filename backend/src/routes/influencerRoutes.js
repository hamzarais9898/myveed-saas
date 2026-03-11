const express = require('express');
const router = express.Router();
const influencerController = require('../controllers/influencerController');
const { protect } = require('../middleware/authMiddleware');

/**
 * AI Influencer Routes
 */

// Get all user influencers
router.get('/', protect, influencerController.getInfluencers);

// Create new influencer
router.post('/', protect, influencerController.createInfluencer);

// Generate preview image
router.post('/preview-image', protect, influencerController.previewGenerateImage);

// Delete influencer
router.delete('/:id', protect, influencerController.deleteInfluencer);

// Bulk generate photos for an influencer
router.post('/:id/generate-photos', protect, influencerController.generatePhotos);

// Generate videos from influencer photos
router.post('/:id/generate-videos', protect, influencerController.generateVideos);

module.exports = router;
