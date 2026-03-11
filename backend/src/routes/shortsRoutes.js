const express = require('express');
const router = express.Router();
const shortsController = require('../controllers/shortsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/analyze', protect, shortsController.analyzeVideo);
router.get('/caption-styles', protect, shortsController.getCaptionStyles);
router.post('/generate', protect, shortsController.generateShort);

module.exports = router;
