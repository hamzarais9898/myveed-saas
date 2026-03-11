const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goalsController');
const { protect } = require('../middleware/authMiddleware');

/**
 * Goals Routes
 * Base path: /api/goals
 */

router.get('/', protect, goalsController.getGoals);
router.post('/', protect, goalsController.createGoal);
router.delete('/:id', protect, goalsController.deleteGoal);

module.exports = router;
