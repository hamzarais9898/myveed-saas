const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// All admin routes require authentication AND admin role
router.use(protect);
router.use(isAdmin);

// ==================== DASHBOARD STATS ====================
router.get('/stats/overview', adminController.getOverviewStats);

// ==================== USER MANAGEMENT ====================
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.post('/users/:id/suspend', adminController.suspendUser);
router.delete('/users/:id', adminController.deleteUser);

// ==================== SUBSCRIPTION MANAGEMENT ====================
router.get('/subscriptions', adminController.getAllSubscriptions);

// ==================== ANALYTICS ====================
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users', adminController.getUserGrowthAnalytics);

// ==================== VIDEO MANAGEMENT ====================
router.get('/videos', adminController.getAllVideos);

module.exports = router;
