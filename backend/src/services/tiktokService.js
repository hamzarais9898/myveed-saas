const axios = require('axios');

const AXIOS_TIMEOUT = 30000; // 30 seconds

/**
 * Generate TikTok OAuth URL
 */
exports.getAuthUrl = (state) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI);
  const scope = encodeURIComponent('user.info.basic,video.publish,video.list');
  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
};

/**
 * Exchange authorization code for access token
 */
exports.exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TIKTOK_REDIRECT_URI
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: AXIOS_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ TikTok token exchange error:', error.response?.data || error.message);
    throw new Error('Failed to exchange TikTok code for token');
  }
};

/**
 * Refresh TikTok access token
 */
exports.refreshAccessToken = async (refreshToken) => {
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/',
      new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: AXIOS_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ TikTok token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh TikTok token');
  }
};

/**
 * Get TikTok Creator Info
 */
exports.getCreatorInfo = async (accessToken) => {
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: AXIOS_TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TIKTOK_UNAUTHORIZED');
    if (error.response?.data?.error?.code === 'ok') return error.response.data;
    console.error('❌ TikTok getCreatorInfo error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get User Info
 */
exports.getUserInfo = async (accessToken, fields = ['open_id', 'union_id', 'avatar_url', 'display_name']) => {
  try {
    const fieldsStr = fields.join(',');
    const response = await axios.get(`https://open.tiktokapis.com/v2/user/info/?fields=${fieldsStr}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      timeout: AXIOS_TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TIKTOK_UNAUTHORIZED');
    console.error('❌ TikTok getUserInfo error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Initialize Video Publish from URL (Legacy support if needed)
 */
exports.initVideoPublishFromUrl = async (accessToken, payload) => {
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: AXIOS_TIMEOUT
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TIKTOK_UNAUTHORIZED');
    console.error('❌ TikTok initVideoPublish error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Fetch Post Status
 */
exports.fetchPostStatus = async (accessToken, publishId) => {
  try {
    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/status/fetch/',
      { publish_id: publishId },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: AXIOS_TIMEOUT
      }
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TIKTOK_UNAUTHORIZED');
    console.error('❌ TikTok fetchPostStatus error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Initialize Video Publish from FILE_UPLOAD
 */
exports.initVideoPublishFileUpload = async (accessToken, {
  title, privacy_level, disable_comment, disable_duet, disable_stitch,
  video_cover_timestamp_ms, video_size, chunk_size, total_chunk_count = 1
}) => {
  try {
    const payload = {
      post_info: {
        title: title || 'My Video',
        privacy_level: privacy_level || 'SELF_ONLY',
        disable_comment: !!disable_comment,
        disable_duet: !!disable_duet,
        disable_stitch: !!disable_stitch,
        video_cover_timestamp_ms: video_cover_timestamp_ms || 1000
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: video_size,
        chunk_size: chunk_size || video_size,
        total_chunk_count: total_chunk_count
      }
    };

    const response = await axios.post('https://open.tiktokapis.com/v2/post/publish/video/init/', payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: AXIOS_TIMEOUT
    });

    if (response.data?.error?.code !== 'ok') {
      const { code, message } = response.data.error;
      throw new Error(`TIKTOK_${code}: ${message}`);
    }

    return {
      publishId: response.data.data.publish_id,
      uploadUrl: response.data.data.upload_url
    };
  } catch (error) {
    if (error.response?.status === 401) throw new Error('TIKTOK_UNAUTHORIZED');
    console.error('❌ TikTok initVideoPublish FILE_UPLOAD error:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Upload Video Buffer to TikTok
 */
exports.uploadVideoToTikTok = async (uploadUrl, buffer) => {
  try {
    const size = buffer.length;
    const response = await axios.put(uploadUrl, buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Range': `bytes 0-${size - 1}/${size}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000 // Extended timeout for large file upload
    });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.error('❌ TikTok video upload error:', error.response?.data || error.message);
    throw new Error(`TikTok upload failed: ${error.message}`);
  }
};

/**
 * Download Video from URL as Buffer
 */
exports.downloadVideoAsBuffer = async (videoUrl) => {
  try {
    console.log(`[CHECKPOINT] Downloading video from ${videoUrl.substring(0, 50)}...`);
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'arraybuffer',
      timeout: AXIOS_TIMEOUT
    });

    return {
      buffer: Buffer.from(response.data),
      sizeBytes: parseInt(response.headers['content-length'], 10) || response.data.byteLength,
      mimeType: response.headers['content-type'] || 'video/mp4'
    };
  } catch (error) {
    console.error('❌ Download video error:', error.message);
    throw new Error(`Failed to download video from URL: ${error.message}`);
  }
};

/**
 * Get Valid Access Token (with auto-refresh)
 */
exports.getValidAccessToken = async (tiktokAccount) => {
  const now = new Date();
  // Buffer of 5 minutes
  const buffer = 5 * 60 * 1000;

  if (tiktokAccount.expiresAt && (new Date(tiktokAccount.expiresAt).getTime() - now.getTime() > buffer)) {
    return tiktokAccount.accessToken;
  }

  if (!tiktokAccount.refreshToken) {
    throw new Error('TIKTOK_REFRESH_TOKEN_MISSING');
  }

  console.log(`[TikTok] Refreshing token for user ${tiktokAccount.userId}...`);
  const tokenData = await exports.refreshAccessToken(tiktokAccount.refreshToken);
  const data = tokenData.data || tokenData;

  const { access_token, refresh_token, expires_in, open_id } = data;

  // Update account in DB
  tiktokAccount.accessToken = access_token;
  if (refresh_token) tiktokAccount.refreshToken = refresh_token;
  tiktokAccount.expiresAt = new Date(Date.now() + expires_in * 1000);
  tiktokAccount.openId = open_id;
  await tiktokAccount.save();

  return access_token;
};

/**
 * Resolve TikTok Video ID from Publish ID
 * Strategies:
 * 1. Fetch publish status (official way)
 * 2. Fallback: Search video list and match by time
 */
exports.resolveTikTokVideoId = async ({ publishId, accessToken, startTime }) => {
  if (!publishId) return null;

  try {
    // Strategy 1: Official status fetch
    const statusResult = await exports.fetchPostStatus(accessToken, publishId);
    if (statusResult?.data?.status === 'FAILED') {
      console.warn(`[TikTok] Publish ${publishId} failed according to TikTok`);
      return null;
    }

    if (statusResult?.data?.video_id) {
      console.log(`[TikTok] Resolved video_id ${statusResult.data.video_id} via status fetch`);
      return {
        videoId: statusResult.data.video_id,
        shareUrl: statusResult.data.share_url || null
      };
    }

    if (statusResult?.data?.status === 'PROCESSING') {
      console.log(`[TikTok] Publish ${publishId} is still processing`);
      // We don't throw error here, just return null so caller knows it's not ready
      return null;
    }

    // Strategy 2: Fallback - List videos and match
    console.log(`[TikTok] Fallback: Searching video list for publishId ${publishId}`);
    const videos = await exports.listVideos(accessToken, { max_count: 20 });

    if (!videos || !videos.length) {
      console.warn('[TikTok] No videos found in list for fallback matching');
      return null;
    }

    // Match by creation time (within 10 minutes of initial publish)
    const candidates = videos.filter(v => {
      const vTime = v.create_time * 1000;
      const diff = Math.abs(vTime - (startTime || Date.now()));
      return diff < 10 * 60 * 1000; // 10 minutes tolerance
    });

    if (candidates.length > 0) {
      // Pick the most recent one among candidates
      const bestMatch = candidates.sort((a, b) => b.create_time - a.create_time)[0];
      console.log(`[TikTok] Resolved video_id ${bestMatch.id} via fallback matching`);
      return {
        videoId: bestMatch.id,
        shareUrl: bestMatch.share_url || null
      };
    }

    return null;
  } catch (error) {
    console.error(`[TikTok] Error resolving videoId for ${publishId}:`, error.message);
    return null;
  }
};

/**
 * List User Videos
 */
exports.listVideos = async (accessToken, options = {}) => {
  try {
    const fields = 'id,create_time,share_url,video_description,duration';
    const response = await axios.post('https://open.tiktokapis.com/v2/video/list/',
      {
        max_count: options.max_count || 10,
        cursor: options.cursor || 0
      },
      {
        params: { fields },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: AXIOS_TIMEOUT
      }
    );

    if (response.data?.error?.code === 'scope_not_authorized') {
      throw new Error('TIKTOK_MISSING_SCOPE_VIDEO_LIST');
    }

    return response.data?.data?.videos || [];
  } catch (error) {
    if (error.message === 'TIKTOK_MISSING_SCOPE_VIDEO_LIST') throw error;
    console.error('❌ TikTok listVideos error:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Query Video Analytics
 */
exports.fetchTikTokAnalytics = async (videoId, accessToken) => {
  try {
    const fields = 'id,create_time,share_url,view_count,like_count,comment_count,share_count';
    const response = await axios.post('https://open.tiktokapis.com/v2/video/query/',
      {
        filters: { video_ids: [videoId] }
      },
      {
        params: { fields },
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: AXIOS_TIMEOUT
      }
    );

    if (response.data?.error?.code !== 'ok') {
      const { code, message, log_id } = response.data.error;
      console.error(`[TikTok API Error] Code: ${code}, Msg: ${message}, LogID: ${log_id}`);
      throw new Error(`TIKTOK_API_ERROR: ${message} (log_id: ${log_id})`);
    }

    const videoInfo = response.data?.data?.videos?.[0];
    if (!videoInfo) {
      throw new Error('TIKTOK_MISSING_VIDEO_ID');
    }

    return {
      videoId: videoInfo.id,
      views: videoInfo.view_count || 0,
      likes: videoInfo.like_count || 0,
      comments: videoInfo.comment_count || 0,
      shares: videoInfo.share_count || 0,
      shareUrl: videoInfo.share_url
    };
  } catch (error) {
    if (error.message.startsWith('TIKTOK_')) throw error;
    console.error('❌ TikTok fetchTikTokAnalytics error:', error.response?.data || error.message);
    throw new Error('TIKTOK_API_ERROR');
  }
};

/**
 * UNIFIED ORCHESTRATION: Publish video to TikTok (FILE_UPLOAD flow)
 * This function is used by both controller and scheduler for consistency.
 */
exports.publishVideo = async (accessToken, videoUrl, title = 'My Video', options = {}) => {
  console.log('[CHECKPOINT] Starting unified TikTok publishVideo flow');

  // 1. Download
  console.log('[CHECKPOINT] Downloading video...');
  const { buffer, sizeBytes } = await exports.downloadVideoAsBuffer(videoUrl);
  console.log(`[CHECKPOINT] Video downloaded (${sizeBytes} bytes)`);

  // 2. Initialize
  console.log('[CHECKPOINT] Initializing TikTok upload...');
  const { publishId, uploadUrl } = await exports.initVideoPublishFileUpload(accessToken, {
    title,
    video_size: sizeBytes,
    privacy_level: options.privacy_level || 'SELF_ONLY',
    disable_comment: options.disable_comment,
    disable_duet: options.disable_duet,
    disable_stitch: options.disable_stitch,
    video_cover_timestamp_ms: options.video_cover_timestamp_ms
  });
  console.log(`[CHECKPOINT] TikTok upload initialized (PublishID: ${publishId})`);

  // 3. Upload
  console.log('[CHECKPOINT] Uploading buffer to TikTok...');
  await exports.uploadVideoToTikTok(uploadUrl, buffer);
  console.log('[CHECKPOINT] TikTok upload completed successfully');

  // 4. Resolve Video ID (Optional attempt)
  let tiktokVideoId = null;
  let tiktokShareUrl = null;
  try {
    console.log('[CHECKPOINT] Attempting to resolve video ID immediately...');
    const resolved = await exports.resolveTikTokVideoId({
      publishId,
      accessToken,
      startTime: Date.now()
    });
    if (resolved) {
      tiktokVideoId = resolved.videoId;
      tiktokShareUrl = resolved.shareUrl;
    }
  } catch (e) {
    console.warn('[CHECKPOINT] Immediate video ID resolution failed (normal for processing):', e.message);
  }

  return { publishId, tiktokVideoId, tiktokShareUrl };
};
