const express = require('express');
const router = express.Router();
const starsController = require('../controllers/starsController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Stars Routes
 */

// Transform video to star
router.post('/transform', protect, starsController.transformToStar);

module.exports = router;
