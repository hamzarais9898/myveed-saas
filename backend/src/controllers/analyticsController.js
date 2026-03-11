const Analytics = require('../models/Analytics');
const analyticsService = require('../services/analyticsService');
const Video = require('../models/Video');
const User = require('../models/User');
const TikTokAccount = require('../models/TikTokAccount');
const YouTubeAccount = require('../models/YouTubeAccount');
const FacebookAccount = require('../models/FacebookAccount');
const tiktokService = require('../services/tiktokService');
const youtubePublishService = require('../services/youtubePublishService');
const mongoose = require('mongoose');
const { startOfDayUTC, endOfDayUTC } = require('../utils/dateUtils');
const goalsController = require('./goalsController');

/**
 * Helper: Pool Limit for Concurrency
 */
async function poolLimit(concurrency, tasks) {
  const results = [];
  const executing = new Set();
  for (const task of tasks) {
    const p = Promise.resolve().then(() => task());
    results.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

/**
 * Get public stats for landing page
 */
exports.getPublicStats = async (req, res) => {
  try {
    const realVideosCount = await Video.countDocuments();
    const realCreatorsCount = await User.countDocuments();

    const videosCount = realVideosCount + 1000;
    const creatorsCount = realCreatorsCount + 100;

    const successfulVideos = await Video.countDocuments({ status: { $in: ['generated', 'published', 'scheduled'] } });
    const failedVideos = await Video.countDocuments({ status: 'failed' });
    const totalAttempts = successfulVideos + failedVideos;

    let satisfactionCount = 94.1;
    if (totalAttempts > 0) {
      satisfactionCount = (successfulVideos / totalAttempts) * 100;
      if (satisfactionCount > 99.9) satisfactionCount = 99.9;
    }

    res.json({
      success: true,
      stats: { videosCount, creatorsCount, satisfactionCount }
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to get public stats' });
  }
};

/**
 * Get user overview analytics (Dynamic)
 */
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const period = parseInt(req.query.period) || 7;

    const startDate = startOfDayUTC();
    startDate.setUTCDate(startDate.getUTCDate() - period);

    const prevStartDate = new Date(startDate);
    prevStartDate.setUTCDate(prevStartDate.getUTCDate() - period);

    const currentStats = await Analytics.find({
      userId,
      date: { $gte: startDate }
    });

    const prevStats = await Analytics.find({
      userId,
      date: { $gte: prevStartDate, $lt: startDate }
    });

    const aggregate = (stats) => {
      const res = { views: 0, likes: 0, shares: 0, comments: 0, revenue: 0, platformBreakdown: {} };
      stats.forEach(s => {
        res.views += s.views || 0;
        res.likes += s.likes || 0;
        res.shares += s.shares || 0;
        res.comments += s.comments || 0;
        res.revenue += s.revenue || 0;

        if (!res.platformBreakdown[s.platform]) {
          res.platformBreakdown[s.platform] = { views: 0, likes: 0, videosCount: 0 };
        }
        res.platformBreakdown[s.platform].views += s.views || 0;
        res.platformBreakdown[s.platform].likes += s.likes || 0;
      });
      return res;
    };

    const current = aggregate(currentStats);
    const previous = aggregate(prevStats);

    const platformVideos = await Analytics.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate } } },
      { $group: { _id: "$platform", count: { $addToSet: "$videoId" } } },
      { $project: { platform: "$_id", count: { $size: "$count" } } }
    ]);

    platformVideos.forEach(pv => {
      if (current.platformBreakdown[pv.platform]) {
        current.platformBreakdown[pv.platform].videosCount = pv.count;
      }
    });

    const overview = {
      totalViews: current.views,
      viewsGrowth: analyticsService.computeGrowth(current.views, previous.views),
      totalLikes: current.likes,
      likesGrowth: analyticsService.computeGrowth(current.likes, previous.likes),
      totalShares: current.shares,
      sharesGrowth: analyticsService.computeGrowth(current.shares, previous.shares),
      totalComments: current.comments,
      commentsGrowth: analyticsService.computeGrowth(current.comments, previous.comments),
      totalRevenue: current.revenue,
      revenueGrowth: analyticsService.computeGrowth(current.revenue, previous.revenue),
      totalPublishedVideos: await Video.countDocuments({
        userId,
        status: 'published',
        createdAt: { $gte: startDate }
      }),
      platformBreakdown: current.platformBreakdown
    };

    res.json({ success: true, overview });

  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to get overview' });
  }
};

/**
 * Get performance trends (Dynamic)
 */
exports.getTrends = async (req, res) => {
  try {
    const userId = req.user._id;
    const period = parseInt(req.query.period) || 7;
    const platform = req.query.platform || 'all';

    const trends = await analyticsService.buildTrendSeries(userId, period, platform);

    res.json({
      success: true,
      period,
      platform,
      trends
    });

  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to get trends' });
  }
};

/**
 * Sync all recent videos
 */
exports.syncAll = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 20;

    const videos = await Video.find({
      userId,
      $or: [
        { tiktokVideoId: { $ne: null } },
        { tiktokPublishId: { $ne: null } },
        { youtubeVideoId: { $ne: null } },
        { "metadata.facebookVideoId": { $exists: true } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    const syncTasks = videos.map(video => async () => {
      const result = { processed: 1, failedVideo: 0, synced: { tiktok: 0, youtube: 0, facebook: 0 }, skipped: { tiktok: 0, youtube: 0, facebook: 0 } };
      let videoHasTechnicalError = false;

      try {
        // TikTok
        if (video.tiktokVideoId || video.tiktokPublishId) {
          try {
            const syncStatus = await syncTikTok(video, userId);
            if (syncStatus === 'skipped') result.skipped.tiktok = 1;
            else result.synced.tiktok = 1;
          } catch (e) {
            console.error(`TikTok sync failed for ${video._id}:`, e.message);
            videoHasTechnicalError = true;
          }
        }
        // YouTube
        if (video.youtubeVideoId) {
          try {
            const syncStatus = await syncYouTube(video, userId);
            if (syncStatus === 'skipped') result.skipped.youtube = 1;
            else result.synced.youtube = 1;
          } catch (e) {
            console.error(`YouTube sync failed for ${video._id}:`, e.message);
            videoHasTechnicalError = true;
          }
        }
        // Facebook
        if (video.metadata?.facebookVideoId) {
          try {
            const syncStatus = await syncFacebook(video, userId);
            if (syncStatus === 'skipped') result.skipped.facebook = 1;
            else result.synced.facebook = 1;
          } catch (e) {
            console.error(`Facebook sync failed for ${video._id}:`, e.message);
            videoHasTechnicalError = true;
          }
        }
      } catch (globalError) {
        console.error(`Global sync error for ${video._id}:`, globalError.message);
        videoHasTechnicalError = true;
      }

      if (videoHasTechnicalError) result.failedVideo = 1;
      return result;
    });

    const taskResults = await poolLimit(3, syncTasks);

    const summary = taskResults.reduce((acc, curr) => ({
      processedVideos: acc.processedVideos + curr.processed,
      failedVideos: acc.failedVideos + curr.failedVideo,
      syncedPlatforms: {
        tiktok: acc.syncedPlatforms.tiktok + curr.synced.tiktok,
        youtube: acc.syncedPlatforms.youtube + curr.synced.youtube,
        facebook: acc.syncedPlatforms.facebook + curr.synced.facebook
      },
      skipped: {
        tiktok: acc.skipped.tiktok + curr.skipped.tiktok,
        youtube: acc.skipped.youtube + curr.skipped.youtube,
        facebook: acc.skipped.facebook + curr.skipped.facebook
      }
    }), {
      processedVideos: 0,
      failedVideos: 0,
      syncedPlatforms: { tiktok: 0, youtube: 0, facebook: 0 },
      skipped: { tiktok: 0, youtube: 0, facebook: 0 }
    });

    // Update goals progress after sync
    await goalsController.updateGoalProgress(userId);

    res.json({ success: true, results: summary });
  } catch (error) {
    console.error('Sync all error:', error);
    res.status(500).json({ success: false, message: 'Batch sync failed' });
  }
};

/**
 * Sync analytics for a specific video
 */
exports.syncAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    let synced = false;
    if (video.tiktokVideoId || video.tiktokPublishId) { await syncTikTok(video, userId); synced = true; }
    if (video.youtubeVideoId) { await syncYouTube(video, userId); synced = true; }
    if (video.metadata?.facebookVideoId) { await syncFacebook(video, userId); synced = true; }

    if (!synced) return res.status(400).json({ success: false, message: 'No platform IDs found for this video' });

    res.json({ success: true, message: 'Analytics synced successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncTikTokAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    await syncTikTok(video, userId);
    const analytics = await Analytics.findOne({ videoId: video._id, platform: 'tiktok' }).sort({ date: -1 });
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.debugTikTokVideo = async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { mongoVideoId } = req.params;
    const video = await Video.findById(mongoVideoId);
    const tiktokAccount = await TikTokAccount.findOne({ userId: video.userId });
    const accessToken = await tiktokService.getValidAccessToken(tiktokAccount);
    const resolved = await tiktokService.resolveTikTokVideoId({
      publishId: video.tiktokPublishId,
      accessToken,
      startTime: video.createdAt
    });
    res.json({ mongoId: mongoVideoId, resolved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVideoAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const video = await Video.findOne({ _id: id, userId });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    const analytics = await Analytics.find({ videoId: id });
    res.json({ success: true, video, analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get video analytics' });
  }
};
