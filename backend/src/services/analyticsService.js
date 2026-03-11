const Analytics = require('../models/Analytics');
const axios = require('axios');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const { startOfDayUTC } = require('../utils/dateUtils');

/**
 * Analytics Service
 * Fetch and calculate video performance metrics
 */

/**
 * Fetch stats from YouTube Data API
 */
exports.fetchYouTubeStats = async (videoId, accessToken) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const response = await youtube.videos.list({
      id: videoId,
      part: 'statistics,status'
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      return {
        views: 0, likes: 0, comments: 0, shares: 0, revenue: 0,
        unavailable: true,
        reason: "NOT_FOUND_OR_PRIVATE"
      };
    }

    const stats = items[0].statistics;
    return {
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      comments: parseInt(stats.commentCount) || 0,
      shares: 0,
      revenue: 0
    };
  } catch (error) {
    console.error('YouTube stats error:', error.message);
    throw error; // Let technical errors (auth/network) bubbles up
  }
};

/**
 * Fetch insights from Facebook Graph API (Reels focus)
 */
exports.fetchFacebookReelInsights = async (videoId, pageAccessToken) => {
  try {
    const response = await axios.get(`https://graph.facebook.com/v24.0/${videoId}/video_insights`, {
      params: {
        metric: 'blue_reels_play_count,fb_reels_replay_count,post_video_avg_time_watched',
        period: 'lifetime',
        access_token: pageAccessToken
      }
    });

    const data = response.data.data || [];
    if (data.length === 0) {
      return { views: 0, likes: 0, comments: 0, shares: 0, revenue: 0, unavailable: true, reason: "NOT_FOUND_OR_PRIVATE" };
    }

    const metrics = {};
    data.forEach(m => {
      metrics[m.name] = m.values?.[0]?.value || 0;
    });

    let likes = 0, comments = 0;
    try {
      const basic = await axios.get(`https://graph.facebook.com/v24.0/${videoId}`, {
        params: { fields: 'likes.summary(true),comments.summary(true)', access_token: pageAccessToken }
      });
      likes = basic.data.likes?.summary?.total_count || 0;
      comments = basic.data.comments?.summary?.total_count || 0;
    } catch (e) {
      console.warn('Could not fetch FB basic stats:', e.message);
    }

    return {
      views: metrics['blue_reels_play_count'] || 0,
      watchTime: (metrics['post_video_avg_time_watched'] || 0) * 60,
      likes,
      comments,
      shares: 0,
      revenue: 0
    };
  } catch (error) {
    if (error.response?.status === 404 || error.response?.data?.error?.code === 100) {
      return { views: 0, likes: 0, comments: 0, shares: 0, revenue: 0, unavailable: true, reason: "NOT_FOUND_OR_PRIVATE" };
    }
    console.error('Facebook insights error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch stats from TikTok API
 */
exports.fetchTikTokStats = async (videoId, accessToken) => {
  const tiktokService = require('./tiktokService');
  try {
    return await tiktokService.fetchTikTokAnalytics(videoId, accessToken);
  } catch (error) {
    // Check if it's an "unavailable" error code from TikTok
    if (error.message === 'TIKTOK_VIDEO_NOT_FOUND' || error.code === 40006) {
      return { views: 0, likes: 0, comments: 0, shares: 0, revenue: 0, unavailable: true, reason: "NOT_FOUND_OR_PRIVATE" };
    }
    throw error;
  }
};

/**
 * Helper: Compute growth percentage
 */
exports.computeGrowth = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Helper: Build Trend Series for Charts (UTC Consistent)
 */
exports.buildTrendSeries = async (userId, periodDays = 7, platform = 'all') => {
  const startDate = startOfDayUTC();
  startDate.setUTCDate(startDate.getUTCDate() - periodDays);

  const match = {
    userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId,
    date: { $gte: startDate }
  };
  if (platform !== 'all') match.platform = platform;

  const stats = await Analytics.find(match).sort({ date: 1 });

  const series = {};
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().split('T')[0];
    series[key] = { date: key, views: 0, revenue: 0, label: getDayLabelUTC(d) };
  }

  stats.forEach(s => {
    const key = new Date(s.date).toISOString().split('T')[0];
    if (series[key]) {
      series[key].views += s.views || 0;
      series[key].revenue += s.revenue || 0;
    }
  });

  return Object.values(series);
};

/**
 * Helper: Get Day Label from UTC Date
 */
function getDayLabelUTC(date) {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[date.getUTCDay()];
}

/**
 * Calculate engagement rate
 */
exports.calculateEngagement = (analytics) => {
  if (!analytics.views || analytics.views === 0) return 0;
  const totalEngagements = (analytics.likes || 0) + (analytics.shares || 0) + (analytics.comments || 0);
  return parseFloat(((totalEngagements / analytics.views) * 100).toFixed(2));
};

/**
 * Get performance trends over time
 */
exports.getPerformanceTrends = async (userId, period = 30) => {
  return await exports.buildTrendSeries(userId, period);
};

/**
 * Get top performing videos
 */
exports.getTopVideos = async (userId, limit = 10, metric = 'views') => {
  try {
    const analytics = await Analytics.find({ userId })
      .populate('videoId')
      .sort({ [metric]: -1 })
      .limit(limit);

    return analytics;

  } catch (error) {
    console.error('Get top videos error:', error);
    throw new Error('Failed to get top videos');
  }
};
