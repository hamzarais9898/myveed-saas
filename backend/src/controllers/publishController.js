const User = require('../models/User');
const Video = require('../models/Video');
const FacebookAccount = require('../models/FacebookAccount');
const InstagramAccount = require('../models/InstagramAccount');
const instagramService = require('../services/instagramService');
const tiktokService = require('../services/tiktokService');
const facebookService = require('../services/facebookService');
const linkedinService = require('../services/linkedinService');
const youtubePublishService = require('../services/youtubePublishService');
const YouTubeAccount = require('../models/YouTubeAccount');
const TikTokAccount = require('../models/TikTokAccount');
const axios = require('axios');
const { getPlatformTitle } = require('../utils/titleBuilder');

/**
 * Publish video to YouTube
 */
exports.publishToYouTube = async (req, res) => {
  try {
    const { videoId, title, description, privacyStatus = 'unlisted' } = req.body;
    const userId = req.user._id;

    // 1. Get user's YouTube account connection
    const youtubeAccount = await YouTubeAccount.findOne({ userId });

    if (!youtubeAccount) {
      return res.status(400).json({ success: false, message: 'YouTube not connected' });
    }

    // 2. Get video and validate
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (video.status !== 'generated' || !video.videoUrl) {
      return res.status(400).json({ success: false, message: 'Video not ready or missing URL' });
    }

    // 3. Publish to YouTube
    const youtubeTitle = getPlatformTitle({
      platform: 'youtube',
      title: title,
      promptText: video.promptText,
      videoId: video._id
    });
    console.log("Publishing title to YouTube:", youtubeTitle, youtubeTitle.length);

    const result = await youtubePublishService.publishVideoFromUrl({
      accessToken: youtubeAccount.accessToken,
      refreshToken: youtubeAccount.refreshToken,
      expiresAt: youtubeAccount.expiresAt,
      videoUrl: video.videoUrl,
      title: youtubeTitle,
      description: description || video.promptText || '',
      privacyStatus
    });

    // 4. Update tokens if refreshed
    if (result.refreshed) {
      youtubeAccount.accessToken = result.newAccessToken;
      youtubeAccount.expiresAt = result.newExpiresAt;
      await youtubeAccount.save();
    }

    // 5. Update video status
    video.status = 'published';
    if (!video.platformPublished || video.platformPublished === 'none') {
      video.platformPublished = 'youtube';
    } else if (video.platformPublished !== 'youtube' && video.platformPublished !== 'both') {
      video.platformPublished = 'both'; // Simplified logic, considering other platforms
    }

    video.youtubeVideoId = result.videoId;
    await video.save();

    res.json({
      success: true,
      message: 'Published to YouTube',
      result: {
        youtubeVideoId: result.videoId,
        url: result.url
      }
    });
  } catch (error) {
    console.error('Publish to YouTube error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish to YouTube', error: error.message });
  }
};

/**
 * Verify YouTube connection and scopes (Debug endpoint)
 */
exports.verifyYouTube = async (req, res) => {
  try {
    const userId = req.user._id;
    const youtubeAccount = await YouTubeAccount.findOne({ userId });

    if (!youtubeAccount) {
      return res.status(400).json({ success: false, message: 'YouTube not connected' });
    }

    // 1. Verify token and scopes
    const verification = await youtubePublishService.verifyYouTubeToken({
      accessToken: youtubeAccount.accessToken,
      refreshToken: youtubeAccount.refreshToken,
      expiresAt: youtubeAccount.expiresAt
    });

    // 2. Update DB if refreshed
    if (verification.refreshed) {
      youtubeAccount.accessToken = verification.newAccessToken;
      youtubeAccount.expiresAt = verification.newExpiresAt;
      await youtubeAccount.save();
    }

    if (!verification.ok) {
      return res.status(200).json({
        ok: false,
        message: 'YouTube connected but lacks required scopes (upload)',
        verification
      });
    }

    // 3. Get Channel Info
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: verification.newAccessToken || youtubeAccount.accessToken,
      refresh_token: youtubeAccount.refreshToken
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['id', 'snippet'],
      mine: true
    });

    const channel = channelResponse.data.items && channelResponse.data.items[0];

    res.json({
      ok: true,
      scopes: verification.scopes,
      hasUploadScope: verification.hasUploadScope,
      channelId: channel?.id,
      channelTitle: channel?.snippet?.title,
      expiresAt: verification.newExpiresAt || youtubeAccount.expiresAt
    });
  } catch (error) {
    console.error('Verify YouTube error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify YouTube connection', error: error.message });
  }
};

/**
 * Publish Video to Facebook Page
 * POST /api/publish/facebook/video
 */
exports.publishFacebookVideo = async (req, res) => {
  try {
    const { videoId, title, description } = req.body;
    const userId = req.user._id;

    const facebookAccount = await FacebookAccount.findOne({ userId });
    if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
      return res.status(400).json({ success: false, message: 'Facebook Page not connected' });
    }

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const pageId = facebookAccount.pages[0].pageId;
    const pageAccessToken = facebookAccount.pages[0].accessToken;

    const facebookTitle = getPlatformTitle({
      platform: 'facebook',
      title: title,
      promptText: video.promptText,
      videoId: video._id
    });
    console.log("Publishing title to Facebook:", facebookTitle, facebookTitle.length);

    const result = await facebookService.publishVideoFromUrl({
      pageId,
      pageAccessToken,
      videoUrl: video.videoUrl,
      title: facebookTitle,
      description: description || video.promptText || ''
    });

    res.json({ success: true, message: 'Published to Facebook Video', result });
  } catch (error) {
    console.error('Publish Facebook Video error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Publish Reel to Facebook Page
 * POST /api/publish/facebook/reel
 */
exports.publishFacebookReel = async (req, res) => {
  try {
    const { videoId, description } = req.body;
    const userId = req.user._id;

    const facebookAccount = await FacebookAccount.findOne({ userId });
    if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
      return res.status(400).json({ success: false, message: 'Facebook Page not connected' });
    }

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    // Validation Reel: 3 to 90 seconds, mp4 format
    // Assuming video.duration exists in seconds
    if (video.duration && (video.duration < 3 || video.duration > 90)) {
      return res.status(400).json({ success: false, message: 'Reel duration must be between 3 and 90 seconds' });
    }

    // Check format (basic check)
    if (video.videoUrl && !video.videoUrl.toLowerCase().endsWith('.mp4') && !video.videoUrl.includes('mp4')) {
      // Many URLs might not end with .mp4 but contain it or be mp4, but let's be strict if needed
      // return res.status(400).json({ success: false, message: 'Video must be in MP4 format' });
    }

    const pageId = facebookAccount.pages[0].pageId;
    const pageAccessToken = facebookAccount.pages[0].accessToken;

    const result = await facebookService.publishReelFromUrl({
      pageId,
      pageAccessToken,
      videoUrl: video.videoUrl,
      description: description || video.promptText || ''
    });

    res.json({ success: true, message: 'Published to Facebook Reel', result });
  } catch (error) {
    console.error('Publish Facebook Reel error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Publish Photo to Facebook Page
 * POST /api/publish/facebook/photo
 */
exports.publishFacebookPhoto = async (req, res) => {
  try {
    const { imageUrl, caption } = req.body; // Can take from req.body or a "Photo" model if exists
    const userId = req.user._id;

    const facebookAccount = await FacebookAccount.findOne({ userId });
    if (!facebookAccount || !facebookAccount.pages || facebookAccount.pages.length === 0) {
      return res.status(400).json({ success: false, message: 'Facebook Page not connected' });
    }

    const pageId = facebookAccount.pages[0].pageId;
    const pageAccessToken = facebookAccount.pages[0].accessToken;

    const result = await facebookService.publishPhotoFromUrl({
      pageId,
      pageAccessToken,
      imageUrl,
      caption: caption || ''
    });

    res.json({ success: true, message: 'Published to Facebook Photo', result });
  } catch (error) {
    console.error('Publish Facebook Photo error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Publish video to LinkedIn
 */
exports.publishToLinkedIn = async (req, res) => {
  try {
    const { videoId, caption } = req.body;
    const user = await User.findById(req.user._id);
    if (!user.linkedinAccessToken) return res.status(400).json({ success: false, message: 'LinkedIn not connected' });
    const video = await Video.findOne({ _id: videoId, userId: req.user._id });
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });
    const result = await linkedinService.publishVideo(user.linkedinAccessToken, video.videoUrl, caption || video.promptText);
    res.json({ success: true, message: 'Published to LinkedIn', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to publish to LinkedIn', error: error.message });
  }
};

/**
 * Publish video to Instagram
 * POST /api/publish/instagram
 */
exports.publishToInstagram = async (req, res) => {
  try {
    const { videoId, caption } = req.body;
    const userId = req.user._id;

    const instagramAccount = await InstagramAccount.findOne({ userId });
    if (!instagramAccount) {
      return res.status(400).json({
        success: false,
        message: "Instagram not connected. Please connect your account in Platforms first.",
      });
    }

    // ✅ Si pas prêt -> message clair
    if (!instagramAccount.instagramBusinessAccountId) {
      return res.status(400).json({
        success: false,
        code: "IG_PRO_REQUIRED_FOR_PUBLISH",
        message:
          "instagramBusinessAccountId is null. Call GET /api/publish/instagram/verify (and link a Pro IG to a Facebook Page) before publishing.",
      });
    }

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) return res.status(404).json({ success: false, message: "Video not found" });

    if (video.status !== "generated" || !video.videoUrl) {
      return res.status(400).json({ success: false, message: "Video not ready or missing URL" });
    }

    // ✅ Instagram Graph API: souvent meilleur avec pageAccessToken
    const tokenToUse = instagramAccount.pageAccessToken || instagramAccount.accessToken;

    const result = await instagramService.publishReelFromUrl({
      accessToken: tokenToUse,
      igUserId: instagramAccount.instagramBusinessAccountId,
      videoUrl: video.videoUrl,
      caption: caption || video.promptText || "",
    });

    video.platformPublished = video.platformPublished === "tiktok" ? "both" : "instagram";
    video.status = "published";
    video.metadata = { ...(video.metadata || {}), instagramMediaId: result.mediaId, instagramContainerId: result.containerId };
    await video.save();

    return res.json({
      success: true,
      message: "Video published to Instagram successfully",
      result,
    });
  } catch (error) {
    console.error("❌ Publish to Instagram error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to publish video to Instagram",
      error: error.message,
      meta_error: error.response?.data,
    });
  }
};

/**
 * Verify TikTok connection and creator info
 * GET /api/publish/tiktok/verify
 */
exports.verifyTikTok = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get TikTok account
    let tiktokAccount = await TikTokAccount.findOne({ userId });
    if (!tiktokAccount) {
      return res.status(400).json({ success: false, message: 'TikTok not connected' });
    }

    // 2. Refresh token if expired
    let accessToken = tiktokAccount.accessToken;
    if (tiktokAccount.expiresAt && new Date(tiktokAccount.expiresAt) <= new Date()) {
      const tokenData = await tiktokService.refreshAccessToken(tiktokAccount.refreshToken);
      accessToken = tokenData.access_token;
      tiktokAccount.accessToken = accessToken;
      tiktokAccount.refreshToken = tokenData.refresh_token || tiktokAccount.refreshToken;
      tiktokAccount.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await tiktokAccount.save();
    }

    // 3. Get Creator Info
    const creatorInfo = await tiktokService.getCreatorInfo(accessToken);

    if (!creatorInfo) {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch TikTok creator info (empty response)'
      });
    }

    // TikTok returns error object even for success (code: "ok")
    if (creatorInfo.error && creatorInfo.error.code && creatorInfo.error.code !== 'ok') {
      return res.status(400).json({
        success: false,
        message: 'Failed to fetch TikTok creator info',
        error: creatorInfo.error
      });
    }

    const creator = creatorInfo.data;
    if (!creator) {
      return res.status(400).json({ success: false, message: 'TikTok creator_info data missing' });
    }

    // Update username if present
    if (creator.creator_username) {
      tiktokAccount.tiktokUsername = creator.creator_username;
      await tiktokAccount.save();
    }

    res.json({
      ok: true,
      creator: {
        username: creator.creator_username,
        nickname: creator.creator_nickname,
        privacy_level_options: creator.privacy_level_options,
        max_video_post_duration_sec: creator.max_video_post_duration_sec
      },
      expiresAt: tiktokAccount.expiresAt
    });
  } catch (error) {
    console.error('Verify TikTok error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify TikTok connection', error: error.message });
  }
};

/**
 * Publish video to TikTok (Posting API v2 - FILE_UPLOAD)
 * POST /api/publish/tiktok
 */
exports.publishToTikTok = async (req, res) => {
  try {
    const {
      videoId,
      tiktokAccountId: bodyTiktokAccountId,
      title,
      privacy_level,
      disable_comment = false,
      disable_duet = false,
      disable_stitch = false,
      video_cover_timestamp_ms = 1000
    } = req.body;
    const userId = req.user._id;

    console.log(`[CHECKPOINT] Controller: Starting TikTok FILE_UPLOAD for video ${videoId}`);

    // 1. Get TikTok account (specific or default)
    let tiktokAccount;
    if (bodyTiktokAccountId) {
      console.log(`[CHECKPOINT] Controller: Using specified tiktokAccountId: ${bodyTiktokAccountId}`);
      tiktokAccount = await TikTokAccount.findOne({ _id: bodyTiktokAccountId, userId });
    } else {
      console.log(`[CHECKPOINT] Controller: Using default TikTok account for user ${userId}`);
      tiktokAccount = await TikTokAccount.findOne({ userId });
    }

    if (!tiktokAccount) {
      const errorMsg = bodyTiktokAccountId ? 'Compte TikTok spécifié non trouvé' : 'Compte TikTok non connecté';
      return res.status(400).json({ success: false, message: errorMsg });
    }
    console.log(`[CHECKPOINT] Controller: TikTok Account found: ${tiktokAccount.tiktokUsername || tiktokAccount._id}`);

    // 2. Refresh token if needed
    let accessToken = tiktokAccount.accessToken;
    if (tiktokAccount.expiresAt && new Date(tiktokAccount.expiresAt) <= new Date()) {
      console.log('[CHECKPOINT] Controller: TikTok token expired, refreshing...');
      try {
        const tokenData = await tiktokService.refreshAccessToken(tiktokAccount.refreshToken);
        accessToken = tokenData.access_token;
        tiktokAccount.accessToken = accessToken;
        tiktokAccount.refreshToken = tokenData.refresh_token || tiktokAccount.refreshToken;
        tiktokAccount.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
        await tiktokAccount.save();
        console.log('[CHECKPOINT] Controller: TikTok token refreshed successfully');
      } catch (refreshErr) {
        console.error('[CHECKPOINT] Controller: TikTok token refresh failed:', refreshErr.message);
        throw new Error(`Échec du rafraîchissement du jeton TikTok: ${refreshErr.message}`);
      }
    }

    // 3. Get video and validate
    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }
    console.log(`[CHECKPOINT] Controller: Video found: ${video.promptText?.substring(0, 30)}...`);

    if (!video.videoUrl) {
      return res.status(400).json({ success: false, message: 'Video metadata missing URL' });
    }

    // 4. Use unified service to publish
    console.log('[CHECKPOINT] Controller: Handing over to tiktokService.publishVideo');

    const safeTitle = getPlatformTitle({
      platform: 'tiktok',
      title: title,
      promptText: video.promptText,
      videoId: video._id
    });

    const { publishId } = await tiktokService.publishVideo(
      accessToken,
      video.videoUrl,
      safeTitle,
      {
        privacy_level: 'SELF_ONLY', // Constraint for unaudited apps
        disable_comment,
        disable_duet,
        disable_stitch,
        video_cover_timestamp_ms
      }
    );

    // 5. Update Video status
    video.status = 'publishing';
    video.tiktokPublishId = publishId;
    video.tiktokAccountId = tiktokAccount._id;
    video.lastError = null; // Clear previous errors

    // Platform published logic
    if (!video.platformPublished || video.platformPublished === 'none') {
      video.platformPublished = 'tiktok';
    } else if (!['tiktok', 'both', 'all'].includes(video.platformPublished)) {
      video.platformPublished = 'both';
    }

    await video.save();
    console.log(`[CHECKPOINT] Controller: Video status updated to publishing. PublishID: ${publishId}`);

    res.json({
      success: true,
      message: 'TikTok upload complete, processing started',
      publishId,
      next: 'Call /api/publish/tiktok/status to check status'
    });
  } catch (error) {
    console.error('[CHECKPOINT] Controller: Publish to TikTok error:', error);

    // Attempt to store error in video if possible
    try {
      if (req.body.videoId) {
        await Video.findByIdAndUpdate(req.body.videoId, {
          status: 'failed',
          lastError: error.message
        });
      }
    } catch (dbErr) {
      console.error('[CHECKPOINT] Controller: Failed to update video error status:', dbErr.message);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to publish to TikTok',
      error: error.message,
      tiktok_error_details: error.response?.data?.error || error.response?.data
    });
  }
};

/**
 * Fetch TikTok publish status
 * POST /api/publish/tiktok/status
 */
exports.fetchTikTokStatus = async (req, res) => {
  try {
    const { publishId } = req.body;
    const userId = req.user._id;

    // 1. Get TikTok account
    const tiktokAccount = await TikTokAccount.findOne({ userId });
    if (!tiktokAccount) return res.status(400).json({ success: false, message: 'TikTok not connected' });

    // 2. Refresh token if expired
    let accessToken = tiktokAccount.accessToken;
    if (tiktokAccount.expiresAt && new Date(tiktokAccount.expiresAt) <= new Date()) {
      const tokenData = await tiktokService.refreshAccessToken(tiktokAccount.refreshToken);
      accessToken = tokenData.access_token;
      tiktokAccount.accessToken = accessToken;
      tiktokAccount.expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
      await tiktokAccount.save();
    }

    // 3. Fetch status
    const statusResult = await tiktokService.fetchPostStatus(accessToken, publishId);

    // DEBUG LOG
    console.log(`[TikTok Status] publishId: ${publishId}, Raw:`, JSON.stringify(statusResult));

    // 4. Update Video
    // TikTok V2 response: { data: { status: 'SUCCESS'|'FAILED'|'PROCESSING', ... }, error: { code: 'ok', ... } }
    const tiktokData = statusResult?.data || {};
    const tiktokStatus = tiktokData.status || tiktokData.publish_status || tiktokData.state;

    const video = await Video.findOne({ tiktokPublishId: publishId });

    if (video) {
      if (tiktokStatus === 'SUCCESS') {
        video.status = 'published';

        // Ensure tiktok is in platformPublished
        if (!video.platformPublished || video.platformPublished === 'none') {
          video.platformPublished = 'tiktok';
        } else if (Array.isArray(video.platformPublished)) {
          if (!video.platformPublished.includes('tiktok')) {
            video.platformPublished.push('tiktok');
          }
        } else if (typeof video.platformPublished === 'string' && !video.platformPublished.includes('tiktok')) {
          video.platformPublished = video.platformPublished === 'youtube' || video.platformPublished === 'facebook'
            ? 'both'
            : video.platformPublished;
        }

        // Save metadata if provided
        if (tiktokData.public_url) {
          video.metadata = { ...(video.metadata || {}), tiktokPublicUrl: tiktokData.public_url };
        }

        await video.save();
        console.log(`[TikTok Status] Video ${video._id} marked as published.`);
      } else if (tiktokStatus === 'FAILED') {
        video.status = 'failed';
        await video.save();
        console.log(`[TikTok Status] Video ${video._id} marked as failed.`);
      }
    }

    res.json(statusResult);
  } catch (error) {
    console.error('Fetch TikTok Status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch TikTok status', error: error.message });
  }
};


// GET /api/publish/instagram/verify
exports.verifyInstagram = async (req, res) => {
  try {
    const userId = req.user._id;
    const instagramAccount = await InstagramAccount.findOne({ userId });

    if (!instagramAccount) {
      return res.status(400).json({ success: false, message: "Instagram not connected" });
    }

    const pages = await instagramService.getFacebookPages(instagramAccount.accessToken);

    const pageWithIG = pages.find((p) => p.instagram_business_account?.id);

    if (!pageWithIG) {
      return res.status(200).json({
        success: false,
        code: "IG_PRO_REQUIRED",
        message:
          "Aucune Page liée à un Instagram Professional Account. Il faut un compte Instagram Pro lié à une Page Facebook pour publier.",
        pages: pages.map((p) => ({ id: p.id, name: p.name, hasIG: !!p.instagram_business_account })),
      });
    }

    instagramAccount.pageId = pageWithIG.id;
    instagramAccount.pageName = pageWithIG.name;
    instagramAccount.pageAccessToken = pageWithIG.access_token; // ✅ important
    instagramAccount.instagramBusinessAccountId = pageWithIG.instagram_business_account.id;
    instagramAccount.instagramId = pageWithIG.instagram_business_account.id;
    instagramAccount.username =
      pageWithIG.instagram_business_account.username || instagramAccount.username || "Instagram User";

    await instagramAccount.save();

    return res.json({
      success: true,
      message: "Instagram publish is ready",
      page: { id: pageWithIG.id, name: pageWithIG.name },
      ig: {
        id: pageWithIG.instagram_business_account.id,
        username: pageWithIG.instagram_business_account.username,
        name: pageWithIG.instagram_business_account.name,
      },
    });
  } catch (error) {
    console.error("verifyInstagram error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to verify Instagram",
      error: error.message,
      meta_error: error.response?.data,
    });
  }
};