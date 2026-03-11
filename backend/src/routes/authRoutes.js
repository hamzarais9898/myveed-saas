const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * Authentication Routes
 */

// Register new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Google login
router.post('/google', authController.googleLogin);

// Verify email
router.post('/verify-email', authController.verifyEmail);

// Resend verification code
router.post('/resend-code', authController.resendCode);

// Update profile (protected + file upload)
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
router.put('/profile', protect, upload.single('photo'), authController.updateProfile);

module.exports = router;
