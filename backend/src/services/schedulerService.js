const cron = require('node-cron');
const Video = require('../models/Video');
const TikTokAccount = require('../models/TikTokAccount');
const tiktokService = require('./tiktokService');
const providerRouter = require('../providers');
const transcriptionService = require('./transcriptionService');
const videoEditingService = require('./videoEditingService');
const tempDownloadService = require('./tempDownloadService');
const uploadService = require('./uploadService');
const YouTubeAccount = require('../models/YouTubeAccount');
const FacebookAccount = require('../models/FacebookAccount');
const youtubePublishService = require('./youtubePublishService');
const facebookService = require('./facebookService');
const { getPlatformTitle } = require('../utils/titleBuilder');

/**
 * Scheduler Service
 * Handles automated video publishing based on scheduled dates
 */

let schedulerInitialized = false;

/**
 * Initialize the scheduler
 * Runs a cron job every minute to check for scheduled videos
 */
exports.initScheduler = () => {
  if (schedulerInitialized) {
    console.log('⏰ Scheduler already initialized');
    return;
  }

  // Run every minute: * * * * *
  cron.schedule('* * * * *', async () => {
    try {
      await checkProcessingVideos();
      await checkScheduledVideos();
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  schedulerInitialized = true;
  console.log('⏰ MAVEED Scheduler initialized - checking every minute for scheduled videos');
  console.log('🚀 Scheduler initialized');
};

/**
 * Check for videos that need to be published
 */
const checkScheduledVideos = async () => {
  try {
    const now = new Date();

    if (process.env.DEBUG_SCHEDULER === 'true') {
      console.log(`⏰ [SCHEDULER TICK] ${now.toISOString()}`);
    }

    // Find videos scheduled for publication (checking legacy or new schedules)
    const videosToPublish = await Video.find({
      status: 'scheduled',
      $or: [
        // Legacy check or missing platform dates
        {
          scheduledDate: { $lte: now },
          $or: [
            { schedules: { $exists: false } },
            {
              'schedules.tiktok.date': { $exists: false },
              'schedules.instagram.date': { $exists: false },
              'schedules.youtube.date': { $exists: false }
            }
          ]
        },
        // New multi-platform checks
        { 'schedules.tiktok.date': { $lte: now }, 'schedules.tiktok.status': 'pending' },
        { 'schedules.instagram.date': { $lte: now }, 'schedules.instagram.status': 'pending' },
        { 'schedules.youtube.date': { $lte: now }, 'schedules.youtube.status': 'pending' },
        { 'schedules.facebook.date': { $lte: now }, 'schedules.facebook.status': 'pending' }
      ]
    }).populate('tiktokAccountId');

    if (videosToPublish.length === 0) {
      if (process.env.DEBUG_SCHEDULER === 'true') {
        // Log every 5 iterations to avoid spam if debug is on
        const min = now.getMinutes();
        if (min % 5 === 0) {
          console.log(`[SCHEDULER DEBUG] ${now.toISOString()} - No videos to publish`);
        }
      }
      return;
    }

    console.log(`📅 Found ${videosToPublish.length} video(s) to publish`);

    if (process.env.DEBUG_SCHEDULER === 'true') {
      videosToPublish.forEach(v => {
        console.log(`[SCHEDULER DEBUG] Match: ${v._id}, scheduledDate: ${v.scheduledDate?.toISOString()}, tiktok: ${v.schedules?.tiktok?.date?.toISOString()}, insta: ${v.schedules?.instagram?.date?.toISOString()}`);
      });
    }

    // Publish each video
    for (const video of videosToPublish) {
      await publishScheduledVideo(video);
    }
  } catch (error) {
    console.error('Error checking scheduled videos:', error);
  }
};

/**
 * Check for processing videos (Runway API) and handle post-processing (Subtitles)
 */
const checkProcessingVideos = async () => {
  try {
    // Find videos that are in processing state from API provider (Runway)
    const videos = await Video.find({
      status: { $in: ['processing', 'pending', 'generating'] },
      mode: 'api',
      provider: { $in: ['runway', 'kling'] },
      generationId: { $ne: null }
    });

    if (videos.length === 0) return;

    console.log(`🔄 Checking status for ${videos.length} processing video(s)...`);

    for (const video of videos) {
      try {
        // Check status via provider router
        const statusData = await providerRouter.checkStatus(video.generationId, video.provider);

        // Update progress if available (Scale 0-100% from Runway/Kling to 0-50% in MAVEED)
        if (statusData.progress !== undefined && statusData.progress > 0) {
          video.progress = Math.round(statusData.progress / 2);
        } else if (video.provider === 'runway') {
          // Simulation: Incrémentation lente (+5% par minute) jusqu'à 45% 
          // si Runway ne renvoie pas encore de progression précise
          const currentProgress = video.progress || 0;
          if (currentProgress < 45) {
            video.progress = currentProgress + 5;
          }
        }

        if (statusData.status !== 'completed' && statusData.status !== 'failed') {
          await video.save();
        }

        if (statusData.status === 'completed' && statusData.videoUrl) {
          console.log(`✅ Video ${video._id} generation completed!`);
          video.progress = 100; // Ensure 100% on completion
          let finalUrl = statusData.videoUrl;

          // 1. Handle Audio Merge (SaaS Pro Architecture)
          if (video.metadata && video.metadata.musicTrack && !video.metadata.audioMerged) {
            console.log(`🎵 Merging audio for ${video._id} (Track: ${video.metadata.musicTrack})...`);
            video.status = 'finishing';
            await video.save();

            try {
              const mergedUrl = await videoEditingService.mergeRemoteVideoWithAudio(
                finalUrl,
                video.metadata.musicTrack,
                video.userId,
                video._id
              );
              finalUrl = mergedUrl;
              video.metadata.audioMerged = true;
              video.markModified('metadata');
              console.log(`✅ Audio merged for ${video._id}: ${finalUrl}`);
            } catch (mergeErr) {
              console.error(`❌ Audio merge failed for ${video._id}:`, mergeErr.message);
            }
          }

          // 2. Handle Subtitles if requested in metadata
          if (video.metadata && video.metadata.showSubtitles) {
            console.log(`📝 Processing subtitles for ${video._id}...`);
            video.status = 'transcribing';
            video.progress = 55;
            await video.save();

            // 1. Download to temp
            const localPath = await tempDownloadService.downloadToTemp(finalUrl);
            video.progress = 60;
            await video.save();

            // 2. Transcribe (Whisper)
            const transcript = await transcriptionService.transcribe(localPath);
            video.progress = 70;
            await video.save();

            // 3. Burn Captions (FFmpeg)
            video.status = 'editing';
            video.progress = 75;
            await video.save();

            const style = {
              font: 'Arial',
              fontSize: video.metadata.subtitleSize || 24,
              color: '#ffffff',
              weight: video.metadata.subtitleStyle === 'bold' ? 'bold' : 'normal',
              outline: true,
              outlineWidth: 2,
              shadow: true
            };

            const processedPath = await videoEditingService.addCaptions(localPath, transcript, style);
            console.log(`✅ Subtitles burned: ${processedPath}`);
            video.progress = 85;
            await video.save();

            // 4. Upload Result (Cloudinary)
            video.status = 'finishing';
            video.progress = 90;
            await video.save();

            finalUrl = await uploadService.uploadVideo(processedPath, 'generated', video._id);

            // Cleanup temp files
            try {
              uploadService.deleteLocalFile(localPath);
              if (processedPath !== localPath) uploadService.deleteLocalFile(processedPath);
            } catch (e) {
              console.warn('Cleanup warning:', e.message);
            }
          }

          // Update Video record
          video.status = 'generated';
          video.videoUrl = finalUrl;
          video.progress = 100;
          await video.save();
          console.log(`💾 Video ${video._id} updated and saved.`);

        } else if (statusData.status === 'failed') {
          console.error(`❌ Video ${video._id} generation failed:`, statusData.failureReason);
          video.status = 'failed';
          await video.save();
        }
      } catch (err) {
        console.error(`Error processing video ${video._id}:`, err);
      }
    }
  } catch (error) {
    console.error('Error in checkProcessingVideos:', error);
  }
};

/**
 * Publish a scheduled video
 * @param {Object} video - Video document
 */
const publishScheduledVideo = async (video) => {
  try {
    console.log(`🚀 Processing scheduled video: ${video._id}`);
    const now = new Date();
    let updatesMade = false;

    // --- Legacy / Single Schedule Logic ---
    if (!video.schedules || Object.keys(video.schedules).length === 0) {
      // [Existing logic for backward compatibility]
      let publishSuccess = false;
      if (video.tiktokAccountId && video.tiktokAccountId.accessToken) {
        try {
          console.log(`[SCHEDULER] Legacy publish for video ${video._id} (Account: ${video.tiktokAccountId._id})`);
          await tiktokService.publishVideo(video.tiktokAccountId.accessToken, video.videoUrl, video.promptText);
          video.platformPublished = video.platformPublished === 'instagram' ? 'both' : 'tiktok';
          publishSuccess = true;
          console.log('[SCHEDULER] Legacy TikTok ✅');
        } catch (err) {
          console.error(`[SCHEDULER] Legacy TikTok ❌:`, err.message);
          video.lastError = `TikTok (Legacy): ${err.message}`;
        }
      }
      // ... (Instagram check omitted for brevity in legacy fallback, assuming simplistic) ...

      if (publishSuccess) video.status = 'published';
      else video.status = 'failed';

      await video.save();
      return;
    }

    // --- New Multi-Platform Logic ---
    const schedules = video.schedules;
    let allPlatformsCompleted = true;

    // Helper to log video status
    const logVideoStatus = (platform, dateValue, status) => {
      console.log(`[SCHEDULER] Video: ${video._id}, Platform: ${platform}, Date: ${dateValue}, Status: ${status}, scheduledDate: ${video.scheduledDate}`);
    };

    // 1. TikTok
    if (schedules.tiktok && schedules.tiktok.status === 'pending') {
      const dueDate = schedules.tiktok.date || video.scheduledDate;

      if (dueDate) {
        if (new Date(dueDate) <= now) {
          logVideoStatus('tiktok', dueDate, 'publishing');
          schedules.tiktok.status = 'publishing';
          video.markModified('schedules');
          await video.save();

          try {
            if (!video.tiktokAccountId) {
              throw new Error('Aucun compte TikTok lié à cette planification');
            }

            const tiktokAccount = video.tiktokAccountId;
            let accessToken = tiktokAccount.accessToken;

            // Refresh token if needed
            if (tiktokAccount.expiresAt && new Date(tiktokAccount.expiresAt) <= new Date()) {
              console.log(`[SCHEDULER] TikTok token expired for account ${tiktokAccount._id}, refreshing...`);
              const tokenData = await tiktokService.refreshAccessToken(tiktokAccount.refreshToken);
              accessToken = tokenData.access_token;
              tiktokAccount.accessToken = accessToken;
              tiktokAccount.refreshToken = tokenData.refresh_token || tiktokAccount.refreshToken;
              tiktokAccount.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
              await tiktokAccount.save();
              console.log('[SCHEDULER] TikTok token refreshed successfully');
            }

            // Publish using unified service
            const safeTitle = getPlatformTitle({
              platform: 'tiktok',
              title: '', // No explicit title in scheduler usually
              promptText: video.promptText,
              videoId: video._id
            });

            const { publishId } = await tiktokService.publishVideo(
              accessToken,
              video.videoUrl,
              safeTitle,
              { privacy_level: 'SELF_ONLY' }
            );

            schedules.tiktok.status = 'published';
            video.tiktokPublishId = publishId;
            video.lastError = null;
            console.log(`[SCHEDULER] ✅ TikTok published successfully (ID: ${publishId})`);
          } catch (err) {
            const errorDetail = err.response?.data || err.message || err;
            console.error("[SCHEDULER] ❌ TikTok publish failed:", errorDetail);

            schedules.tiktok.status = 'failed';
            video.lastError = `TikTok: ${err.message}`;
            // We don't throw here to allow other platforms to try
          }
          updatesMade = true;
        } else {
          allPlatformsCompleted = false; // Still waiting for time
        }
      } else {
        // Missing both dates
        console.warn(`[SCHEDULER] ⚠️ No date found for TikTok schedule on video ${video._id}`);
        schedules.tiktok.status = 'failed';
        video.lastError = 'TikTok: No date available for scheduling';
        updatesMade = true;
      }
    }

    // 2. Instagram
    if (schedules.instagram && schedules.instagram.status === 'pending') {
      const dueDate = schedules.instagram.date || video.scheduledDate;

      if (dueDate) {
        if (new Date(dueDate) <= now) {
          logVideoStatus('instagram', dueDate, 'publishing');
          schedules.instagram.status = 'publishing';
          video.markModified('schedules');
          await video.save();

          try {
            const User = require('../models/User');
            const user = await User.findById(video.userId);
            if (user && user.instagramAccessToken) {
              const instagramService = require('./instagramService');
              await instagramService.publishVideo(user.instagramAccessToken, video.videoUrl, video.promptText);
              schedules.instagram.status = 'published';
              console.log('✅ Instagram published');
            } else {
              throw new Error('No Instagram connected');
            }
          } catch (err) {
            console.error('Instagram publish error:', err.message);
            schedules.instagram.status = 'failed';
          }
          updatesMade = true;
        } else {
          allPlatformsCompleted = false;
        }
      } else {
        console.warn(`[SCHEDULER] ⚠️ No date found for Instagram schedule on video ${video._id}`);
        schedules.instagram.status = 'failed';
        updatesMade = true;
      }
    }

    // 3. YouTube
    if (schedules.youtube && schedules.youtube.status === 'pending') {
      const dueDate = schedules.youtube.date || video.scheduledDate;

      if (dueDate) {
        if (new Date(dueDate) <= now) {
          logVideoStatus('youtube', dueDate, 'publishing');

          // Set internal status to prevent double-trigger
          schedules.youtube.status = 'publishing';
          video.markModified('schedules');
          await video.save();

          try {
            const youtubeAccount = await YouTubeAccount.findOne({ userId: video.userId });
            if (!youtubeAccount) throw new Error('YouTube account not connected');

            console.log(`[SCHEDULER] Processing YouTube schedule for video: ${video._id}`);

            const youtubeTitle = getPlatformTitle({
              platform: 'youtube',
              title: '',
              promptText: video.promptText,
              videoId: video._id
            });
            console.log(`[SCHEDULER] Publishing title to YouTube: ${youtubeTitle}`);

            const result = await youtubePublishService.publishVideoFromUrl({
              accessToken: youtubeAccount.accessToken,
              refreshToken: youtubeAccount.refreshToken,
              expiresAt: youtubeAccount.expiresAt,
              videoUrl: video.videoUrl,
              title: youtubeTitle,
              description: video.promptText || '',
              privacyStatus: 'unlisted'
            });

            // Update tokens if refreshed
            if (result.refreshed) {
              youtubeAccount.accessToken = result.newAccessToken;
              youtubeAccount.expiresAt = result.newExpiresAt;
              await youtubeAccount.save();
            }

            schedules.youtube.status = 'published';
            video.youtubeVideoId = result.videoId;
            video.lastError = null;
            console.log(`[SCHEDULER] ✅ YouTube published: ${result.videoId}`);
          } catch (err) {
            console.error("[SCHEDULER] ❌ YouTube failed:", err.message);
            schedules.youtube.status = 'failed';
            video.lastError = `YouTube: ${err.message}`;
          }
          updatesMade = true;
        } else {
          allPlatformsCompleted = false;
        }
      } else {
        console.warn(`[SCHEDULER] ⚠️ No date found for YouTube schedule on video ${video._id}`);
        schedules.youtube.status = 'failed';
        updatesMade = true;
      }
    }

    // 4. Facebook
    if (schedules.facebook && schedules.facebook.status === 'pending') {
      const dueDate = schedules.facebook.date || video.scheduledDate;

      if (dueDate) {
        if (new Date(dueDate) <= now) {
          logVideoStatus('facebook', dueDate, 'publishing');

          schedules.facebook.status = 'publishing';
          video.markModified('schedules');
          await video.save();

          try {
            const facebookAccount = await FacebookAccount.findOne({ userId: video.userId });
            if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
              throw new Error('Facebook Page not connected');
            }

            console.log(`[SCHEDULER] Processing Facebook schedule for video: ${video._id}`);

            const pageId = facebookAccount.pages[0].pageId;
            const pageAccessToken = facebookAccount.pages[0].accessToken;

            const facebookTitle = getPlatformTitle({
              platform: 'facebook',
              title: '',
              promptText: video.promptText,
              videoId: video._id
            });
            console.log(`[SCHEDULER] Publishing title to Facebook: ${facebookTitle}`);

            const result = await facebookService.publishVideoFromUrl({
              pageId,
              pageAccessToken,
              videoUrl: video.videoUrl,
              title: facebookTitle,
              description: video.promptText || ''
            });

            schedules.facebook.status = 'published';
            video.metadata = { ...(video.metadata || {}), facebookVideoId: result.id };
            video.lastError = null;
            console.log(`[SCHEDULER] ✅ Facebook published: ${result.id}`);
          } catch (err) {
            console.error("[SCHEDULER] ❌ Facebook failed:", err.message);
            schedules.facebook.status = 'failed';
            video.lastError = `Facebook: ${err.message}`;
          }
          updatesMade = true;
        } else {
          allPlatformsCompleted = false;
        }
      } else {
        console.warn(`[SCHEDULER] ⚠️ No date found for Facebook schedule on video ${video._id}`);
        schedules.facebook.status = 'failed';
        updatesMade = true;
      }
    }

    if (updatesMade) {
      // Re-calculate allPlatformsCompleted after updates
      const platforms = ['tiktok', 'instagram', 'youtube', 'facebook'].filter(p => schedules[p]);
      const anyStillPending = platforms.some(p => ['pending', 'publishing'].includes(schedules[p].status));
      const anySucceeded = platforms.some(p => schedules[p].status === 'published');

      if (!anyStillPending) {
        video.status = anySucceeded ? 'published' : 'failed';

        // Update platformPublished for frontend compatibility
        const publishedOn = platforms.filter(p => schedules[p].status === 'published');
        if (publishedOn.length > 1) video.platformPublished = 'all';
        else if (publishedOn.length === 1) video.platformPublished = publishedOn[0];
      }

      video.markModified('schedules');
      await video.save();
    }

  } catch (error) {
    console.error(`Error in publishScheduledVideo for ${video._id}:`, error);
  }
};

/**
 * Schedule a video for publication
 * @param {string} videoId - Video ID
 * @param {Date} scheduledDate - When to publish
 * @param {string} tiktokAccountId - TikTok account to use
 */
exports.scheduleVideo = async (videoId, scheduledDate, tiktokAccountId) => {
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    const scheduledDateUTC = new Date(scheduledDate);

    // Validate scheduled date is in the future
    if (scheduledDateUTC <= new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Update video
    video.scheduledDate = scheduledDateUTC;
    video.tiktokAccountId = tiktokAccountId;
    video.status = 'scheduled';

    if (tiktokAccountId) {
      video.schedules = video.schedules || {};
      video.schedules.tiktok = {
        date: scheduledDateUTC,
        status: 'pending'
      };
      video.markModified('schedules');
    }

    await video.save();

    console.log(`📅 Video ${videoId} scheduled for ${scheduledDateUTC.toISOString()}`);
    return video;
  } catch (error) {
    console.error('Error scheduling video:', error);
    throw error;
  }
};

/**
 * Cancel scheduled publication
 * @param {string} videoId - Video ID
 */
exports.cancelSchedule = async (videoId) => {
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    video.scheduledDate = null;
    video.status = 'generated';
    await video.save();

    console.log(`❌ Cancelled schedule for video ${videoId}`);
    return video;
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    throw error;
  }
};

/**
 * Schedule video for a single platform
 * @param {string} videoId - Video ID
 * @param {string} platform - Platform name
 * @param {string} scheduledDate - ISO date string
 * @param {string} tiktokAccountId - Optional TikTok account ID
 */
exports.scheduleOnePlatform = async (videoId, platform, scheduledDate, tiktokAccountId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) throw new Error('Video not found');

    const dateUTC = new Date(scheduledDate);
    if (isNaN(dateUTC.getTime())) throw new Error('Date invalide');
    if (dateUTC <= new Date()) throw new Error('La date doit être dans le futur');

    const schedules = video.schedules || {};

    // Set only the chosen platform
    schedules[platform] = {
      date: dateUTC,
      status: 'pending'
    };

    if (platform === 'tiktok' && tiktokAccountId) {
      video.tiktokAccountId = tiktokAccountId;
    }

    // Recalculate global scheduledDate (earliest of all pending)
    let earliestDate = dateUTC;
    for (const p of ['tiktok', 'instagram', 'youtube', 'facebook']) {
      if (schedules[p] && schedules[p].status === 'pending' && schedules[p].date) {
        const pDate = new Date(schedules[p].date);
        if (pDate < earliestDate) {
          earliestDate = pDate;
        }
      }
    }

    video.schedules = schedules;
    video.scheduledDate = earliestDate;
    video.status = 'scheduled';

    video.markModified('schedules');
    await video.save();

    console.log(`[SCHEDULER] Video ${videoId} scheduled on ${platform} for ${dateUTC.toISOString()}`);
    return video;
  } catch (error) {
    console.error('Error in scheduleOnePlatform:', error);
    throw error;
  }
};

/**
 * Schedule video for multiple platforms
 * @param {string} videoId - Video ID
 * @param {Object} platformConfig - Configuration per platform { platform: { startDate } }
 * @param {string} tiktokAccountId - Optional TikTok account
 */
exports.scheduleMultiPlatforms = async (videoId, platformConfig, tiktokAccountId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) throw new Error('Video not found');

    const schedules = video.schedules || {};
    let earliestDate = null;
    let hasSchedule = false;
    const platforms = ['tiktok', 'instagram', 'youtube', 'facebook'];

    // 1. Process new/updated schedules from platformConfig
    for (const [platform, config] of Object.entries(platformConfig)) {
      if (!config.startDate) continue;

      const dateUTC = new Date(config.startDate);
      schedules[platform] = {
        date: dateUTC,
        status: 'pending'
      };

      if (!earliestDate || dateUTC < earliestDate) {
        earliestDate = dateUTC;
      }
      hasSchedule = true;
    }

    // 2. Migration/Auto-fix for existing schedules without dates
    for (const platform of platforms) {
      if (schedules[platform] && schedules[platform].status === 'pending' && !schedules[platform].date) {
        if (video.scheduledDate) {
          console.log(`[SCHEDULER] Auto-fixing missing date for ${platform} on video ${video._id} using scheduledDate`);
          schedules[platform].date = video.scheduledDate;
          hasSchedule = true;
          if (!earliestDate || video.scheduledDate < earliestDate) {
            earliestDate = video.scheduledDate;
          }
        }
      }
    }

    if (hasSchedule) {
      video.schedules = schedules;
      video.status = 'scheduled';
      if (earliestDate) video.scheduledDate = earliestDate;
      if (tiktokAccountId) video.tiktokAccountId = tiktokAccountId;

      video.markModified('schedules');
      await video.save();

      // Read-back verification
      const savedVideo = await Video.findById(videoId).lean();
      console.log(`[SCHEDULER] DB Persistence Verified for ${videoId}:`, JSON.stringify(savedVideo.schedules, null, 2));
    }

    return video;
  } catch (error) {
    console.error('Error in scheduleMultiPlatforms:', error);
    throw error;
  }
};

/**
 * Cancel scheduled publication
 * @param {string} videoId - Video ID
 */
exports.cancelSchedule = async (videoId) => {
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    video.scheduledDate = null;
    video.status = 'generated';
    await video.save();

    console.log(`❌ Cancelled schedule for video ${videoId}`);
    return video;
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    throw error;
  }
};

/**
 * Expose internal check function for testing
 */
exports.runSchedulerOnce = async () => {
  await checkScheduledVideos();
};
