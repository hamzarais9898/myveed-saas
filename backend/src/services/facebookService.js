const axios = require("axios");
const FormData = require("form-data");


const FB_GRAPH_VERSION = "v24.0";

function getRedirectUri(mode = "real") {
  const uri =
    mode === "debug"
      ? process.env.FACEBOOK_REDIRECT_URI_DEBUG
      : process.env.FACEBOOK_REDIRECT_URI;

  if (!uri) throw new Error("FACEBOOK_REDIRECT_URI missing in .env");
  return uri;
}

exports.getAuthUrl = (state = "", mode = "real") => {
  const appId = process.env.FACEBOOK_CLIENT_ID;
  const redirectUri = getRedirectUri(mode);

  const scope = [
    "email",
    "public_profile",
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "read_insights"
  ].join(",");

  return `https://www.facebook.com/dialog/oauth` +
    `?client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(String(state))}` +
    `&response_type=code` +
    `&auth_type=rerequest`; // ✅ force re-consent
};

exports.exchangeCodeForToken = async (code, mode = "real") => {
  const appId = process.env.FACEBOOK_CLIENT_ID;
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET;
  const redirectUri = getRedirectUri(mode);

  const response = await axios.get(`https://graph.facebook.com/v24.0/oauth/access_token`, {
    params: { client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code }
  });

  return response.data;
};




/**
 * Get Facebook User Details
 * @param {string} accessToken - User Access Token
 * @returns {Promise<object>} - User data (id, name)
 */
exports.getFacebookUser = async (accessToken) => {
  try {
    const response = await axios.get('https://graph.facebook.com/v24.0/me', {
      params: {
        fields: 'id,name',
        access_token: accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get Facebook user error:', error.response?.data || error.message);
    throw new Error('Failed to get Facebook user info');
  }
};

/**
 * Get Facebook Pages with Page Access Tokens
 * @param {string} userAccessToken - User Access Token
 * @returns {Promise<Array>} - List of pages with tokens
 */
exports.getFacebookPages = async (userAccessToken) => {
  try {
    const response = await axios.get('https://graph.facebook.com/v24.0/me/accounts', {
      params: {
        fields: 'name,access_token,category,tasks',
        access_token: userAccessToken
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Get Facebook Pages error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Facebook Pages');
  }
};

/**
 * Publish Reel From URL (3-step process)
 */
exports.publishReelFromUrl = async ({ pageId, pageAccessToken, videoUrl, description }) => {
  try {
    // STEP 1: Start Reel Upload
    const startResponse = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/video_reels`, {
      upload_phase: "start",
      access_token: pageAccessToken
    });

    const video_id = startResponse.data.video_id;

    // STEP 2: Hosted Upload (via rupload)
    await axios.post(`https://rupload.facebook.com/video-upload/${FB_GRAPH_VERSION}/${video_id}`, null, {
      headers: {
        Authorization: `OAuth ${pageAccessToken}`,
        file_url: videoUrl
      }
    });

    // STEP 3: Finish Reel Upload
    const finishResponse = await axios.post(`https://graph.facebook.com/${FB_GRAPH_VERSION}/${pageId}/video_reels`, null, {
      params: {
        access_token: pageAccessToken,
        video_id: video_id,
        upload_phase: "finish",
        video_state: "PUBLISHED",
        description: description
      }
    });

    return finishResponse.data;
  } catch (error) {
    console.error("Facebook Reel Publish Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to publish Reel to Facebook");
  }
};

/**
 * Publish Photo From URL
 */


exports.publishPhotoFromUrl = async ({ pageId, pageAccessToken, imageUrl, caption }) => {
  try {
    const form = new FormData();
    form.append("url", imageUrl);
    if (caption) form.append("caption", caption);
    form.append("access_token", pageAccessToken);

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      form,
      { headers: form.getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error("Facebook Photo Publish Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to publish Photo to Facebook");
  }
};


/**
 * Publish Video Resumable Upload (3-step process)
 */
exports.publishVideoFromUrl = async ({ pageId, pageAccessToken, videoUrl, title, description }) => {
  const makeRequest = async (currentTitle) => {
    const params = {
      access_token: pageAccessToken,
      file_url: videoUrl,
      description: description || ""
    };
    if (currentTitle) params.title = currentTitle;

    return axios.post(`https://graph-video.facebook.com/${FB_GRAPH_VERSION}/${pageId}/videos`, null, { params });
  };

  try {
    const resp = await makeRequest(title);
    return resp.data;
  } catch (error) {
    const errorData = error.response?.data?.error || {};
    // Error 1363143: "File name too long" - retry without title
    if (errorData.error_subcode === 1363143 || errorData.code === 100 && errorData.error_subcode === 1363143) {
      console.warn("⚠️ Facebook Error 1363143 (File name too long). Retrying without title...");
      try {
        const retryResp = await makeRequest(null);
        return retryResp.data;
      } catch (retryError) {
        console.error("❌ Facebook Video Retry Failed:", retryError.response?.data || retryError.message);
        throw new Error(retryError.response?.data?.error?.message || "Failed to publish video to Facebook (retry)");
      }
    }

    console.error("Facebook Video URL Publish Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || "Failed to publish video to Facebook (file_url)");
  }
};
