const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Image Routes
 * All routes are protected with authentication middleware
 */

// Generate new image(s)
// Generate new image(s)
router.post('/generate', protect, imageController.generateImage);

// Preview generate without auth (used for client-side preview)
router.post('/generate/preview', imageController.previewGenerate);

// Get all user images
router.get('/', protect, imageController.getImages);

// Get available styles and resolutions
router.get('/styles/available', protect, imageController.getAvailableStyles);

// Get single image by ID
router.get('/:id', protect, imageController.getImageById);

// Check image generation status
router.get('/:id/status', protect, imageController.checkImageStatus);

// Delete image
router.delete('/:id', protect, imageController.deleteImage);

module.exports = router;
