const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public route to submit message
// We can optionally use 'protect' to attach user info if a token is present, 
// but usually contact forms are public. If we want to capture user ID ONLY if logged in,
// we can make a middleware that blindly decodes token but doesn't error if missing.
// For simplicity, let's make it public. If the frontend sends a token, we can handle it 
// by using a "softAuth" middleware, or just trust the frontend to send user data if needed.
// Update: Let's use a custom middleware inline to check token without requiring it.
const softAuth = (req, res, next) => {
    // Logic to decode token if present, but ignore errors
    // Since current authMiddleware might strictly require it, we'll keep it simple:
    // This route is PUBLIC.
    next();
};

router.post('/', softAuth, contactController.submitContactForm);

// Admin routes
router.get('/', protect, authorize('admin', 'superadmin'), contactController.getAllMessages);
router.put('/:id/status', protect, authorize('admin', 'superadmin'), contactController.updateMessageStatus);

module.exports = router;
