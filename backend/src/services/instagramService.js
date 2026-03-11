// services/instagramService.js
const axios = require("axios");

const FB_API_VERSION = process.env.META_API_VERSION || "v21.0";
const BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

/* =========================
   OAuth helpers (tu les as déjà)
========================= */

exports.getAuthUrl = (state = "") => {
  const clientId = process.env.INSTAGRAM_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI);

  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_read_engagement",
    "pages_show_list",
    "public_profile",
    "email",
  ].join(",");

  return `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code${state ? `&state=${state}` : ""}`;
};

exports.exchangeCodeForToken = async (code) => {
  const response = await axios.get(`${BASE_URL}/oauth/access_token`, {
    params: {
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
      code,
    },
  });
  return response.data;
};

exports.upgradeToLongLivedToken = async (shortLivedToken) => {
  const response = await axios.get(`${BASE_URL}/oauth/access_token`, {
    params: {
      grant_type: "fb_exchange_token",
      client_id: process.env.INSTAGRAM_CLIENT_ID,
      client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
      fb_exchange_token: shortLivedToken,
    },
  });
  return response.data;
};

/* =========================
   Publishing helpers
========================= */

// 1) List pages + IG business account
exports.getFacebookPages = async (userAccessToken) => {
  const response = await axios.get(`${BASE_URL}/me/accounts`, {
    params: {
      fields: "id,name,access_token,tasks,instagram_business_account{id,username,name}",
      access_token: userAccessToken,
    },
  });
  return response.data.data || [];
};

// 2) Create container
exports.createReelContainer = async ({ accessToken, igUserId, videoUrl, caption }) => {
  const resp = await axios.post(`${BASE_URL}/${igUserId}/media`, {
    media_type: "REELS",
    video_url: videoUrl,
    caption: caption || "",
    access_token: accessToken,
  });

  return resp.data; // { id: containerId }
};

// 3) Container status
exports.getContainerStatus = async ({ accessToken, containerId }) => {
  const resp = await axios.get(`${BASE_URL}/${containerId}`, {
    params: {
      fields: "status_code",
      access_token: accessToken,
    },
  });
  return resp.data; // { status_code: "IN_PROGRESS" | "FINISHED" | ... }
};

// 4) Wait FINISHED (doc: 1/min up to 5 min)
exports.waitUntilContainerFinished = async ({ accessToken, containerId, maxTries = 5 }) => {
  for (let i = 0; i < maxTries; i++) {
    const st = await exports.getContainerStatus({ accessToken, containerId });

    if (st.status_code === "FINISHED" || st.status_code === "PUBLISHED") return st;
    if (st.status_code === "ERROR" || st.status_code === "EXPIRED") {
      throw new Error(`IG_CONTAINER_${st.status_code}`);
    }

    await new Promise((r) => setTimeout(r, 60_000)); // 60 sec
  }

  throw new Error("IG_CONTAINER_TIMEOUT");
};

// 5) Publish container
exports.publishContainer = async ({ accessToken, igUserId, containerId }) => {
  const resp = await axios.post(`${BASE_URL}/${igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });
  return resp.data; // { id: mediaId }
};

// 6) Full publish flow (Reels from URL)
exports.publishReelFromUrl = async ({ accessToken, igUserId, videoUrl, caption }) => {
  if (!igUserId) throw new Error("IG_PRO_REQUIRED_FOR_PUBLISH");
  if (!videoUrl || !videoUrl.startsWith("http")) throw new Error("INVALID_PUBLIC_VIDEO_URL");

  // Create container
  const { id: containerId } = await exports.createReelContainer({
    accessToken,
    igUserId,
    videoUrl,
    caption,
  });

  // Wait processing
  await exports.waitUntilContainerFinished({ accessToken, containerId, maxTries: 5 });

  // Publish
  const published = await exports.publishContainer({
    accessToken,
    igUserId,
    containerId,
  });

  return { containerId, mediaId: published.id };
};