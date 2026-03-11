const express = require('express');
const router = express.Router();
const ttsController = require('../controllers/ttsController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.get('/voices', protect, ttsController.getVoices);
router.get('/vibes', protect, ttsController.getVibes);
router.post('/generate', protect, ttsController.generateTts);
router.post('/preview', protect, ttsController.previewVoice);

module.exports = router;
