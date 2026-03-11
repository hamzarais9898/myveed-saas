const Goal = require('../models/Goal');
const Analytics = require('../models/Analytics');
const Video = require('../models/Video');
const mongoose = require('mongoose');

/**
 * Get all goals for the current user
 */
exports.getGoals = async (req, res) => {
    try {
        const userId = req.user._id;

        // Auto-update expired goals first
        const now = new Date();
        await Goal.updateMany(
            { userId, status: 'active', endDate: { $lt: now } },
            { $set: { status: 'expired' } }
        );

        const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: goals });
    } catch (error) {
        console.error('getGoals error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch goals' });
    }
};

/**
 * Create a new goal
 */
exports.createGoal = async (req, res) => {
    try {
        const userId = req.user._id;
        let { platform, metric, targetValue, startDate, endDate } = req.body;

        // Robust casting and defaults
        targetValue = Number(targetValue);
        if (isNaN(targetValue) || targetValue <= 0) {
            return res.status(400).json({ success: false, message: 'Target value must be a number greater than 0' });
        }

        // Validate platform and metric against enums
        const validPlatforms = ['youtube', 'tiktok', 'facebook', 'global'];
        const validMetrics = ['views', 'revenue', 'subscribers', 'engagement', 'videos'];

        if (!validPlatforms.includes(platform)) {
            return res.status(400).json({ success: false, message: 'Invalid platform' });
        }
        if (!validMetrics.includes(metric)) {
            return res.status(400).json({ success: false, message: 'Invalid metric' });
        }

        if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ success: false, message: 'End date must be after start date' });
        }

        const goal = new Goal({
            userId,
            platform,
            metric,
            targetValue,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : null,
            status: 'active'
        });

        await goal.save();

        // Calculate initial progress
        await exports.updateGoalProgress(userId);

        const updatedGoal = await Goal.findById(goal._id);

        res.status(201).json({ success: true, data: updatedGoal });
    } catch (error) {
        console.error('createGoal error:', error);
        res.status(500).json({ success: false, message: 'Failed to create goal' });
    }
};

/**
 * Delete a goal
 */
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const goal = await Goal.findOneAndDelete({ _id: id, userId });
        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        res.json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('deleteGoal error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete goal' });
    }
};

/**
 * Internal: Update goal progression for a user
 * Optimized approach using grouping to minimize MongoDB aggregations
 * V1.1: Robust date filtering, status re-evaluation, and optimized writes
 */
exports.updateGoalProgress = async (userId) => {
    try {
        // Handle userId robustly (can be string or ObjectId)
        const uid = userId?._id ? userId._id : new mongoose.Types.ObjectId(userId);

        const now = new Date();
        // Load active and completed goals to allow status re-evaluation
        const goals = await Goal.find({
            userId: uid,
            status: { $in: ['active', 'completed'] }
        });

        if (goals.length === 0) return;

        // Cache for aggregation results to avoid redundant calls
        const aggregationCache = new Map();
        // Cache for video counts
        const videoCountCache = new Map();

        for (const goal of goals) {
            let currentValue = 0;

            if (goal.metric === 'videos') {
                // Optimization: Group videos count by platform and date range
                const startStr = goal.startDate ? new Date(goal.startDate).toISOString() : 'none';
                const endStr = goal.endDate ? new Date(goal.endDate).toISOString() : 'none';
                const cacheKey = `${goal.platform}|${startStr}|${endStr}`;

                if (videoCountCache.has(cacheKey)) {
                    currentValue = videoCountCache.get(cacheKey);
                } else {
                    const videoQuery = { userId: uid, status: 'published' };
                    if (goal.platform !== 'global') {
                        if (goal.platform === 'youtube') videoQuery.youtubeVideoId = { $ne: null };
                        if (goal.platform === 'tiktok') videoQuery.tiktokVideoId = { $ne: null };
                        if (goal.platform === 'facebook') videoQuery['metadata.facebookVideoId'] = { $exists: true };
                    }

                    // Safe Date Filtering construction
                    if (goal.startDate || goal.endDate) {
                        videoQuery.createdAt = {};
                        if (goal.startDate) videoQuery.createdAt.$gte = goal.startDate;
                        if (goal.endDate) videoQuery.createdAt.$lte = goal.endDate;
                    }

                    currentValue = await Video.countDocuments(videoQuery);
                    videoCountCache.set(cacheKey, currentValue);
                }
            } else {
                // Optimization: Group metrics aggregation by platform and date range
                const startStr = goal.startDate ? new Date(goal.startDate).toISOString() : 'none';
                const endStr = goal.endDate ? new Date(goal.endDate).toISOString() : 'none';
                const cacheKey = `${goal.platform}|${startStr}|${endStr}`;

                let stats;
                if (aggregationCache.has(cacheKey)) {
                    stats = aggregationCache.get(cacheKey);
                } else {
                    const matchQuery = { userId: uid };
                    if (goal.platform !== 'global') {
                        matchQuery.platform = goal.platform;
                    }

                    // Safe Date Filtering construction
                    if (goal.startDate || goal.endDate) {
                        matchQuery.date = {};
                        if (goal.startDate) matchQuery.date.$gte = goal.startDate;
                        if (goal.endDate) matchQuery.date.$lte = goal.endDate;
                    }

                    const aggregation = await Analytics.aggregate([
                        { $match: matchQuery },
                        {
                            $group: {
                                _id: null,
                                totalViews: { $sum: '$views' },
                                totalLikes: { $sum: '$likes' },
                                totalShares: { $sum: '$shares' },
                                totalComments: { $sum: '$comments' },
                                totalRevenue: { $sum: '$revenue' },
                                avgEngagement: { $avg: '$engagement' }
                            }
                        }
                    ]);

                    stats = aggregation.length > 0 ? aggregation[0] : {
                        totalViews: 0,
                        totalLikes: 0,
                        totalShares: 0,
                        totalComments: 0,
                        totalRevenue: 0,
                        avgEngagement: 0
                    };
                    aggregationCache.set(cacheKey, stats);
                    console.log(`[GOALS] Performance: Cached aggregation for ${cacheKey}`);
                }

                if (goal.metric === 'views') currentValue = stats.totalViews || 0;
                if (goal.metric === 'engagement') currentValue = stats.avgEngagement || 0;
                if (goal.metric === 'revenue') currentValue = stats.totalRevenue || 0;
                // subscribers logic could be added here if tracked in Analytics
            }

            // Status Re-evaluation logic
            let newStatus = goal.status;
            if (currentValue >= goal.targetValue) {
                newStatus = 'completed';
            } else if (goal.endDate && now > goal.endDate) {
                newStatus = 'expired';
            } else {
                newStatus = 'active';
            }

            // Optimized Writes (Conditional Save)
            if (goal.currentValue !== currentValue || goal.status !== newStatus) {
                goal.currentValue = currentValue;
                goal.status = newStatus;
                await goal.save();
                console.log(`[GOALS] Updated goal ${goal._id}: val=${currentValue}, status=${newStatus}`);
            }
        }
    } catch (error) {
        console.error('updateGoalProgress error:', error);
        throw error;
    }
};
