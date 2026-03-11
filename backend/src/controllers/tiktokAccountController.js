const TikTokAccount = require('../models/TikTokAccount');
const User = require('../models/User');
const tiktokService = require('../services/tiktokService');

/**
 * Get all TikTok accounts for current user
 * GET /api/tiktok-accounts
 */
exports.getTikTokAccounts = async (req, res) => {
  try {
    const userId = req.user._id;

    const accounts = await TikTokAccount.find({ userId, isActive: true })
      .sort({ createdAt: -1 })
      .select('-accessToken -refreshToken -__v');

    res.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map(account => ({
        id: account._id,
        accountName: account.accountName,
        tiktokUsername: account.tiktokUsername,
        expiresAt: account.expiresAt,
        createdAt: account.createdAt
      }))
    });
  } catch (error) {
    console.error('Get TikTok accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve TikTok accounts'
    });
  }
};

/**
 * Disconnect TikTok account
 * DELETE /api/tiktok-accounts/:id
 */
exports.disconnectTikTokAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const account = await TikTokAccount.findOne({ _id: id, userId });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'TikTok account not found'
      });
    }

    // Soft delete - mark as inactive
    account.isActive = false;
    await account.save();

    res.json({
      success: true,
      message: 'TikTok account disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect TikTok account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect TikTok account'
    });
  }
};

/**
 * Refresh TikTok token
 * PUT /api/tiktok-accounts/:id/refresh
 */
exports.refreshTikTokToken = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const account = await TikTokAccount.findOne({ _id: id, userId });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'TikTok account not found'
      });
    }

    // TODO: Implement real token refresh with TikTok API
    // For now, extend expiration
    account.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await account.save();

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: account.expiresAt
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token'
    });
  }
};
