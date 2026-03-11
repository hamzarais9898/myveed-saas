const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Video = require('../models/Video');
const ActivityLog = require('../models/ActivityLog');

/**
 * Admin Controller
 * Handles all admin dashboard operations
 */

// ==================== DASHBOARD STATS ====================

/**
 * Get dashboard overview statistics
 * GET /api/admin/stats/overview
 */
exports.getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total users
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const usersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth },
      status: { $ne: 'deleted' }
    });
    const usersLastMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      status: { $ne: 'deleted' }
    });

    // Active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ 
      status: 'active',
      plan: { $ne: 'free' }
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const subscriptions = await Subscription.find({ 
      status: 'active',
      plan: { $ne: 'free' }
    });
    
    const mrr = subscriptions.reduce((total, sub) => {
      const planDetails = Subscription.getPlanDetails(sub.plan);
      return total + (planDetails?.price || 0);
    }, 0);

    // Total revenue (sum of all successful payments)
    const totalRevenue = subscriptions.reduce((total, sub) => {
      return total + (sub.lastPaymentAmount || 0);
    }, 0);

    // Revenue this month
    const revenueThisMonth = await Subscription.aggregate([
      {
        $match: {
          lastPaymentDate: { $gte: startOfMonth },
          status: 'active'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$lastPaymentAmount' }
        }
      }
    ]);

    // Plan distribution
    const planDistribution = await Subscription.aggregate([
      {
        $match: { status: { $ne: 'cancelled' } }
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);

    // Total videos created
    const totalVideos = await Video.countDocuments();

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          thisMonth: usersThisMonth,
          lastMonth: usersLastMonth,
          growth: usersLastMonth > 0 
            ? ((usersThisMonth - usersLastMonth) / usersLastMonth * 100).toFixed(1)
            : 0
        },
        subscriptions: {
          active: activeSubscriptions,
          mrr: mrr.toFixed(2),
          distribution: planDistribution
        },
        revenue: {
          total: totalRevenue.toFixed(2),
          thisMonth: revenueThisMonth[0]?.total?.toFixed(2) || 0,
          mrr: mrr.toFixed(2)
        },
        videos: {
          total: totalVideos
        },
        profitability: {
          totalCost: (await Video.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0,
          imageCost: (await require('../models/Image').aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0,
          profit: (totalRevenue - (
            ((await Video.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0) +
            ((await require('../models/Image').aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0)
          )).toFixed(2),
          margin: totalRevenue > 0 ? (
            (totalRevenue - (
              ((await Video.aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0) +
              ((await require('../models/Image').aggregate([{ $group: { _id: null, total: { $sum: "$cost" } } }]))[0]?.total || 0)
            )) / totalRevenue * 100
          ).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard statistics' 
    });
  }
};

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with pagination and filters
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      plan = '', 
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: { $ne: 'deleted' } };

    // Search by name or email
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get subscription info for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const subscription = await Subscription.findOne({ userId: user._id });
        const videoCount = await Video.countDocuments({ userId: user._id });
        
        return {
          ...user,
          subscription: subscription ? {
            plan: subscription.plan,
            status: subscription.status,
            credits: subscription.remainingCredits,
            ttsCredits: subscription.remainingTtsCredits
          } : null,
          videoCount
        };
      })
    );

    // Filter by plan if specified
    let filteredUsers = usersWithDetails;
    if (plan) {
      filteredUsers = usersWithDetails.filter(u => u.subscription?.plan === plan);
    }

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
};

/**
 * Get user details by ID
 * GET /api/admin/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const subscription = await Subscription.findOne({ userId: id });
    const videos = await Video.find({ userId: id }).sort({ createdAt: -1 }).limit(20);
    const activityLogs = await ActivityLog.find({ userId: id })
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        subscription,
        videos,
        activityLogs
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user details' 
    });
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, subscription } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // Update subscription if provided
    if (subscription) {
      const userSub = await Subscription.findOne({ userId: id });
      if (userSub) {
        if (subscription.plan) userSub.plan = subscription.plan;
        if (subscription.credits !== undefined) {
          userSub.credits = subscription.credits;
          userSub.creditsUsed = 0;
        }
        if (subscription.ttsCredits !== undefined) {
          userSub.ttsCredits = subscription.ttsCredits;
          userSub.ttsCreditsUsed = 0;
        }
        await userSub.save();
      }
    }

    // Log admin action
    await ActivityLog.create({
      userId: id,
      action: 'admin_user_updated',
      details: { updatedFields: Object.keys(req.body) },
      performedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating user' 
    });
  }
};

/**
 * Suspend user
 * POST /api/admin/users/:id/suspend
 */
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'suspended' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Log admin action
    await ActivityLog.create({
      userId: id,
      action: 'admin_user_suspended',
      performedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User suspended successfully',
      user
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error suspending user' 
    });
  }
};

/**
 * Delete user (soft delete)
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: 'deleted' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Log admin action
    await ActivityLog.create({
      userId: id,
      action: 'admin_user_deleted',
      performedBy: req.user._id
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting user' 
    });
  }
};

// ==================== SUBSCRIPTION MANAGEMENT ====================

/**
 * Get all subscriptions
 * GET /api/admin/subscriptions
 */
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 50, plan = '', status = '' } = req.query;

    const query = {};
    if (plan) query.plan = plan;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await Subscription.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching subscriptions' 
    });
  }
};

// ==================== ANALYTICS ====================

/**
 * Get revenue analytics
 * GET /api/admin/analytics/revenue
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const revenueData = await Subscription.aggregate([
      {
        $match: {
          lastPaymentDate: { $gte: startDate },
          status: 'active'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$lastPaymentDate' }
          },
          revenue: { $sum: '$lastPaymentAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue analytics' 
    });
  }
};

/**
 * Get user growth analytics
 * GET /api/admin/analytics/users
 */
exports.getUserGrowthAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const userData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'deleted' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user growth analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching user growth analytics' 
    });
  }
};

/**
 * Get all videos with pagination and filters
 * GET /api/admin/videos
 */
exports.getAllVideos = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', provider = '', search = '' } = req.query;
    const query = {};

    if (status) query.status = status;
    if (provider) query.provider = provider.toLowerCase();
    if (search) {
      query.promptText = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin videos:', error);
    res.status(500).json({ success: false, message: 'Error fetching videos' });
  }
};

module.exports = exports;
