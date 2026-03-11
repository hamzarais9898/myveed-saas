const { google } = require('googleapis');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

/**
 * Verify YouTube token, refresh if necessary, and check scopes
 */
exports.verifyYouTubeToken = async ({ accessToken, refreshToken, expiresAt }) => {
  try {
    let currentAccessToken = accessToken;
    let currentExpiresAt = expiresAt;
    let refreshed = false;

    // Check if token is expired (or close to expiring - within 5 mins)
    const isExpired = !currentExpiresAt || new Date(currentExpiresAt).getTime() <= Date.now() + 5 * 60 * 1000;

    if (isExpired && refreshToken) {
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      currentAccessToken = credentials.access_token;
      currentExpiresAt = new Date(credentials.expiry_date);
      refreshed = true;
    }

    // Verify scopes via Google API
    const tokenInfoResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?access_token=${currentAccessToken}`);
    const scopes = tokenInfoResponse.data.scope ? tokenInfoResponse.data.scope.split(' ') : [];

    const hasUploadScope = scopes.includes('https://www.googleapis.com/auth/youtube.upload');
    const hasReadonlyScope = scopes.includes('https://www.googleapis.com/auth/youtube.readonly');

    return {
      ok: hasUploadScope,
      scopes,
      hasUploadScope,
      hasReadonlyScope,
      refreshed,
      newAccessToken: refreshed ? currentAccessToken : undefined,
      newExpiresAt: refreshed ? currentExpiresAt : undefined
    };
  } catch (error) {
    console.error('Error verifying YouTube token:', error.response?.data || error.message);
    return {
      ok: false,
      error: error.message,
      refreshed: false
    };
  }
};

/**
 * Download video from URL to a temporary file
 */
const downloadVideoToTemp = async (videoUrl) => {
  const tmpDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const fileName = `yt_upload_${Date.now()}.mp4`;
  const tmpPath = path.join(tmpDir, fileName);

  const response = await axios({
    method: 'GET',
    url: videoUrl,
    responseType: 'stream',
    timeout: 300000 // 5 minutes timeout for download
  });

  const contentType = response.headers['content-type'];
  if (contentType && !contentType.includes('video/mp4')) {
    // We could log a warning but many URLs might be valid anyway
  }

  const writer = fs.createWriteStream(tmpPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tmpPath));
    writer.on('error', (err) => {
      fs.unlink(tmpPath, () => { });
      reject(err);
    });
  });
};

/**
 * Publish video from a public URL to YouTube
 */
exports.publishVideoFromUrl = async ({
  accessToken,
  refreshToken,
  expiresAt,
  videoUrl,
  title,
  description,
  privacyStatus = 'unlisted'
}) => {
  let tmpPath = null;
  try {
    // 1. Verify/Refresh token
    const verification = await exports.verifyYouTubeToken({ accessToken, refreshToken, expiresAt });
    if (!verification.ok) {
      throw new Error('YouTube token verification failed or missing upload scope');
    }

    const effectiveAccessToken = verification.newAccessToken || accessToken;

    // 2. Download to local temp
    tmpPath = await downloadVideoToTemp(videoUrl);

    // 3. Upload to YouTube
    const localOauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );
    localOauth2Client.setCredentials({
      access_token: effectiveAccessToken,
      refresh_token: refreshToken
    });

    const youtube = google.youtube({ version: 'v3', auth: localOauth2Client });

    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: title || 'New Video',
          description: description || ''
        },
        status: {
          privacyStatus: privacyStatus
        }
      },
      media: {
        body: fs.createReadStream(tmpPath)
      }
    });

    return {
      videoId: response.data.id,
      url: `https://www.youtube.com/watch?v=${response.data.id}`,
      refreshed: verification.refreshed,
      newAccessToken: verification.newAccessToken,
      newExpiresAt: verification.newExpiresAt
    };
  } catch (error) {
    console.error('YouTube upload error:', error.message);
    throw error;
  } finally {
    // 4. Cleanup
    if (tmpPath && fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
};

/**
 * Left for compatibility or mock if needed
 */
exports.getAuthUrl = () => {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;
  const scope = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scope,
    prompt: 'consent'
  });
};
