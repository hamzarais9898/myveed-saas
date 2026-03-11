const YouTubeAccount = require('../models/YouTubeAccount');
const InstagramAccount = require('../models/InstagramAccount');
const FacebookAccount = require('../models/FacebookAccount');
const TikTokAccount = require('../models/TikTokAccount');
const User = require('../models/User');
const mongoose = require('mongoose');
const instagramService = require('../services/instagramService');
const facebookService = require('../services/facebookService');
const tiktokService = require('../services/tiktokService');
const { google } = require('googleapis');
const axios = require('axios');

// OAuth2 configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;
const FRONTEND_PLATFORMS_URL = process.env.FRONTEND_PLATFORMS_URL || 'http://localhost:3000/platforms';

/**
 * Initiate YouTube OAuth Connection
 * GET /api/oauth/youtube/connect
 */
exports.connectYouTube = async (req, res) => {
    try {
        const userId = req.user._id;

        // Use googleapis OAuth2 client to generate URL
        const oauth2Client = new google.auth.OAuth2(
            YOUTUBE_CLIENT_ID,
            YOUTUBE_CLIENT_SECRET,
            YOUTUBE_REDIRECT_URI
        );

        const scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.upload'
        ];

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline', // Required for refresh_token
            scope: scopes,
            prompt: 'consent', // Force consent to ensure refresh_token
            state: userId.toString() // Use userId as state for simple CSRF and identification
        });

        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('YouTube Connect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate YouTube connection' });
    }
};

/**
 * Initiate Instagram OAuth Connection
 * GET /api/oauth/instagram/connect
 */
exports.connectInstagram = async (req, res) => {
    try {
        const userId = req.user._id;
        // Use a clear state: userId|platform
        const state = `${userId}|instagram`;
        const authUrl = instagramService.getAuthUrl(state);
        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('❌ Instagram Connect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate Instagram connection' });
    }
};

/**
 * Initiate Facebook OAuth Connection
 * GET /api/platforms/facebook/connect
 */
exports.connectFacebook = async (req, res) => {
    try {
        const userId = req.user._id.toString(); // Ensure string for state
        const authUrl = facebookService.getAuthUrl(userId, "real");
        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('Facebook Connect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate Facebook connection' });
    }
};

/**
 * Initiate TikTok OAuth Connection
 * GET /api/oauth/tiktok/connect
 */
exports.connectTikTok = async (req, res) => {
    try {
        const userId = req.user._id.toString();
        const authUrl = tiktokService.getAuthUrl(userId);
        res.json({ success: true, authUrl });
    } catch (error) {
        console.error('❌ TikTok Connect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to initiate TikTok connection' });
    }
};

exports.facebookCallbackDebug = async (req, res) => {
    const { code, state } = req.query;

    console.log("✅ FB CALLBACK QUERY:", req.query);

    if (!code) return res.status(400).json({ ok: false, error: "no_code", query: req.query });

    try {
        const tokenData = await facebookService.exchangeCodeForToken(code, "debug"); // ✅ ici
        const userAccessToken = tokenData?.access_token;

        // Test immédiat du token
        const me = await facebookService.getFacebookUser(userAccessToken);
        const pages = await facebookService.getFacebookPages(userAccessToken);

        return res.json({
            ok: true,
            received: { code: String(code).slice(0, 15) + "...", state },
            tokenData,                    // ⚠️ contient access_token
            me,
            pagesCount: pages.length,
            firstPage: pages[0] || null,
        });
    } catch (e) {
        console.error("❌ FB DEBUG CALLBACK ERROR:", e.message);
        return res.status(500).json({ ok: false, error: e.message });

    }
};


/**
 * Facebook OAuth Callback (REAL)
 * GET /api/oauth/facebook/callback
 *
 * - Exchanges code -> user access token
 * - Fetches FB user
 * - Tries to fetch pages (SAFE: does not fail if none)
 * - Saves FacebookAccount in MongoDB
 * - Updates User flags even if pages = 0
 * - Redirects to frontend with ?facebook=success&pages=0|1
 */
exports.facebookCallback = async (req, res) => {
    const { code, state: userId } = req.query;

    console.log("--- Facebook Callback Start ---");
    console.log("Code Received:", code ? "YES" : "NO");
    console.log("State (UserId) Received:", userId);

    if (!code) {
        console.error("Facebook Callback: No code provided");
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?facebook=error&error=no_code`);
    }

    // Validate state is a valid Mongo ObjectId
    if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
        console.error("Facebook Callback: Invalid or missing state:", userId);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?facebook=error&error=invalid_state`);
    }

    try {
        const validUserId = new mongoose.Types.ObjectId(String(userId));

        // 1) Exchange code -> token (REAL mode)
        const tokenData = await facebookService.exchangeCodeForToken(String(code), "real");
        const userAccessToken = String(tokenData?.access_token || "");
        const expiresIn = Number(tokenData?.expires_in || 0);
        const tokenType = String(tokenData?.token_type || "bearer");

        if (!userAccessToken || userAccessToken === "undefined" || userAccessToken === "null") {
            throw new Error("Invalid access token received from Facebook");
        }

        console.log("✅ Token received (first 20):", userAccessToken.slice(0, 20), "...");
        console.log("✅ Token expiresIn:", expiresIn);

        // 2) Get FB user
        const fbUser = await facebookService.getFacebookUser(userAccessToken);
        console.log("✅ Facebook User:", fbUser?.name, fbUser?.id);

        // 3) Get Pages (SAFE: may be empty)
        let pages = [];
        try {
            pages = await facebookService.getFacebookPages(userAccessToken);
        } catch (e) {
            console.warn("⚠️ Could not fetch pages (continuing anyway):", e.message);
            pages = [];
        }

        const savedPages = (pages || []).map((page) => ({
            pageId: page.id,
            name: page.name,
            accessToken: page.access_token,
            category: page.category,
            tasks: page.tasks,
        }));

        const pageAccessToken = savedPages[0]?.accessToken || null;
        const hasPages = savedPages.length > 0;

        console.log("✅ Pages found:", savedPages.length);

        // 4) Save/Update FacebookAccount (even if pages = [])
        await FacebookAccount.findOneAndUpdate(
            { userId: validUserId },
            {
                userId: validUserId,
                facebookId: String(fbUser?.id || ""),
                name: String(fbUser?.name || ""),
                userAccessToken,
                tokenType,
                expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
                pages: savedPages,
                updatedAt: new Date(),
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 5) Update User connection flags (even if no pages)
        await User.findByIdAndUpdate(validUserId, {
            facebook_connected: true,
            facebookAccessToken: userAccessToken,
            facebookPageAccessToken: pageAccessToken, // null if no pages
        });

        console.log("✅ Facebook Account saved and User updated successfully");
        console.log("--- Facebook Callback End (Success) ---");

        // Redirect to frontend with a pages flag (no tokens in URL)
        console.log("✅ Redirecting to:", `${FRONTEND_PLATFORMS_URL}?facebook=success&pages=${hasPages ? 1 : 0}`);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?facebook=success&pages=${hasPages ? 1 : 0}`);
    } catch (error) {
        console.error("❌ Facebook Callback Error:", error.response?.data || error.message);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?facebook=error&error=auth_failed`);
    }
};






/**
 * YouTube OAuth Callback
 * ...
 */
exports.youtubeCallback = async (req, res) => {
    // ... existing youtube code ...
    const { code, state: userId } = req.query;

    if (!code) {
        console.error('YouTube Callback: No code provided');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?youtube=0&error=no_code`);
    }

    try {
        // Exchange code for tokens
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: YOUTUBE_CLIENT_ID,
            client_secret: YOUTUBE_CLIENT_SECRET,
            redirect_uri: YOUTUBE_REDIRECT_URI,
            grant_type: 'authorization_code',
            code
        });

        const { access_token, refresh_token, expires_in } = response.data;

        const expiresAt = new Date(Date.now() + expires_in * 1000);

        // Save or update YouTube account in DB
        const updateData = {
            accessToken: access_token,
            expiresAt: expiresAt
        };

        if (refresh_token) {
            updateData.refreshToken = refresh_token;
        }

        await YouTubeAccount.findOneAndUpdate(
            { userId },
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.redirect(`${FRONTEND_PLATFORMS_URL}?youtube=1`);
    } catch (error) {
        console.error('YouTube Callback Error:', error.response?.data || error.message);
        res.redirect(`${FRONTEND_PLATFORMS_URL}?youtube=0&error=auth_failed`);
    }
};

/**
 * Instagram OAuth Callback
 * GET /api/oauth/instagram/callback
 */
exports.instagramCallback = async (req, res) => {
    const { code, state, error: queryError } = req.query;

    console.log('--- Instagram Callback Start ---');

    if (queryError) {
        console.error('❌ Instagram Callback Query Error:', queryError);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?instagram=error&error=${queryError}`);
    }

    if (!code) {
        console.error('❌ Instagram Callback: No code provided');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?instagram=error&error=no_code`);
    }

    if (!state) {
        console.error('❌ Instagram Callback: No state provided');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?instagram=error&error=no_state`);
    }

    // Parse state: "userId|platform"
    const [userId, platform] = state.includes('|') ? state.split('|') : [state, 'instagram'];

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('❌ Instagram Callback: Invalid userId in state');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?instagram=error&error=invalid_user`);
    }

    try {
        // Step 1: Exchange code for Short-Lived Token
        console.log('🔄 Exchanging code for short-lived token...');
        const tokenData = await instagramService.exchangeCodeForToken(code);
        const shortToken = tokenData.access_token;

        // Step 2: Upgrade to Long-Lived Token
        console.log('🔄 Upgrading to long-lived token...');
        const longLivedData = await instagramService.upgradeToLongLivedToken(shortToken);
        const accessToken = longLivedData.access_token;
        const expiresIn = longLivedData.expires_in;

        console.log(`✅ Long-lived token obtained for User: ${userId}`);

        // Step 3: Fetch Pages to find Linked Instagram Account
        console.log('🔄 Fetching Facebook Pages...');
        const pages = await instagramService.getFacebookPages(accessToken);
        console.log(`ℹ️ Found ${pages.length} Pages linked to this user.`);

        let linkedPage = null;
        let igBusinessId = null;
        let igUsername = null;

        // Find the first page with a connected Instagram Business Account
        for (const page of pages) {
            if (page.instagram_business_account) {
                linkedPage = page;
                igBusinessId = page.instagram_business_account.id;
                igUsername = page.instagram_business_account.username || page.instagram_business_account.name;
                console.log(`✅ Found Instagram Business Account: ${igUsername} (${igBusinessId}) on Page: ${page.name}`);
                break;
            }
        }

        // Even if no IG Business account found, we proceed to save the token and page info
        if (!igBusinessId && pages.length > 0) {
            linkedPage = pages[0];
            console.warn(`⚠️ No Instagram Business Account found. Using first Page: ${linkedPage.name}`);
        }

        // Step 4: Save or Update InstagramAccount
        const accountData = {
            userId,
            accessToken,
            expiresAt: new Date(Date.now() + expiresIn * 1000),
            tokenType: 'long-lived',
            pageId: linkedPage?.id || null,
            pageName: linkedPage?.name || null,
            instagramBusinessAccountId: igBusinessId || null,
            instagramId: igBusinessId || null, // fallback/legacy
            username: igUsername || linkedPage?.name || 'Instagram User',
            updatedAt: new Date()
        };

        await InstagramAccount.findOneAndUpdate(
            { userId },
            accountData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Step 5: Update User record
        await User.findByIdAndUpdate(userId, {
            instagram_connected: true,
            instagramAccessToken: accessToken // Optional but kept for compatibility
        });

        console.log('✅ Instagram connection saved successfully');
        console.log('--- Instagram Callback End (Success) ---');

        // Step 6: Redirect to frontend
        const successUrl = `${FRONTEND_PLATFORMS_URL}?instagram=success${!igBusinessId ? '&warning=IG_PRO_REQUIRED_FOR_PUBLISH' : ''}`;
        return res.redirect(successUrl);

    } catch (error) {
        console.error('❌ Instagram Callback Error:', error.message);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?instagram=error&error=auth_failed`);
    }
};

/**
 * TikTok OAuth Callback
 * GET /api/oauth/tiktok/callback
 */
exports.tiktokCallback = async (req, res) => {
    const { code, state, error: queryError } = req.query;

    console.log('--- TikTok Callback query:', req.query);

    if (queryError) {
        console.error('❌ TikTok Callback Query Error:', queryError);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?tiktok=error&error=${queryError}`);
    }

    if (!code) {
        console.error('❌ TikTok Callback: No code provided');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?tiktok=error&error=no_code`);
    }

    // state directly as userId
    const userId = state;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        console.error('❌ TikTok Callback: Invalid userId in state:', state);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?tiktok=error&error=invalid_user`);
    }

    try {
        // Step 1: Exchange code for tokens
        const tokenData = await tiktokService.exchangeCodeForToken(code);
        const data = tokenData.data || tokenData;

        const {
            access_token,
            refresh_token,
            expires_in,
            open_id,
            token_type
        } = data;

        if (!access_token) {
            throw new Error('No access token received from TikTok');
        }

        // Step 2: Try to get optionally creator info for username
        let tiktokUsername = null;
        try {
            const creatorInfo = await tiktokService.getCreatorInfo(access_token);
            const creatorData = creatorInfo?.data || creatorInfo;
            tiktokUsername = creatorData?.creator_nickname || creatorData?.creator_username;
        } catch (e) {
            console.warn('⚠️ Could not fetch TikTok creator info:', e.message);
        }

        // Step 3: Save or Update TikTokAccount
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        await TikTokAccount.findOneAndUpdate(
            { userId },
            {
                userId,
                accessToken: access_token,
                refreshToken: refresh_token,
                tokenType: token_type || 'bearer',
                expiresAt,
                openId: open_id,
                tiktokUsername,
                updatedAt: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Step 4: Update User flags
        await User.findByIdAndUpdate(userId, {
            tiktok_connected: true,
            tiktokAccessToken: access_token
        });

        console.log('✅ TikTok connection saved successfully');
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?tiktok=success`);

    } catch (error) {
        console.error('❌ TikTok Callback Error:', error.message);
        return res.redirect(`${FRONTEND_PLATFORMS_URL}?tiktok=error&error=auth_failed`);
    }
};

/**
 * Get platforms status
 * GET /api/platforms/status
 */
exports.getPlatformStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const youtubeAccount = await YouTubeAccount.findOne({ userId }).lean();
        const instagramAccount = await InstagramAccount.findOne({ userId }).lean();
        const facebookAccount = await FacebookAccount.findOne({ userId }).lean();
        const tiktokAccount = await TikTokAccount.findOne({ userId }).lean();

        res.json({
            success: true,
            youtube: youtubeAccount ? { connected: true } : null,
            instagram: instagramAccount ? {
                connected: true,
                username: instagramAccount.username || null,
                pageName: instagramAccount.pageName || null
            } : null,
            facebook: facebookAccount ? {
                connected: true,
                name: facebookAccount.name || null,
                firstPageName: facebookAccount.pages?.[0]?.name || null
            } : null,
            tiktok: tiktokAccount ? {
                _id: tiktokAccount._id,
                connected: true,
                username: tiktokAccount.tiktokUsername || null,
                accountName: tiktokAccount.accountName || 'TikTok'
            } : null
        });
    } catch (error) {
        console.error('❌ Platform Status Error:', error);
        res.status(500).json({ success: false, message: 'Failed to get platform status' });
    }
};

/**
 * Disconnect YouTube
 * POST /api/platforms/youtube/disconnect
 */
exports.disconnectYouTube = async (req, res) => {
    try {
        const userId = req.user._id;
        await YouTubeAccount.findOneAndDelete({ userId });
        res.json({ success: true, message: 'YouTube disconnected successfully' });
    } catch (error) {
        console.error('YouTube Disconnect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect YouTube' });
    }
};

/**
 * Disconnect Instagram
 * POST /api/platforms/instagram/disconnect
 */
exports.disconnectInstagram = async (req, res) => {
    try {
        const userId = req.user._id;
        await InstagramAccount.findOneAndDelete({ userId });
        await User.findByIdAndUpdate(userId, { instagram_connected: false, instagramAccessToken: null });
        res.json({ success: true, message: 'Instagram disconnected successfully' });
    } catch (error) {
        console.error('Instagram Disconnect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect Instagram' });
    }
};

/**
 * Disconnect Facebook
 * POST /api/platforms/facebook/disconnect
 */
exports.disconnectFacebook = async (req, res) => {
    try {
        const userId = req.user._id;
        await FacebookAccount.findOneAndDelete({ userId });
        await User.findByIdAndUpdate(userId, { facebook_connected: false, facebookAccessToken: null });
        res.json({ success: true, message: 'Facebook disconnected successfully' });
    } catch (error) {
        console.error('Facebook Disconnect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect Facebook' });
    }
};

/**
 * Disconnect TikTok
 * POST /api/platforms/tiktok/disconnect
 */
exports.disconnectTikTok = async (req, res) => {
    try {
        const userId = req.user._id;
        await TikTokAccount.findOneAndDelete({ userId });
        await User.findByIdAndUpdate(userId, { tiktok_connected: false, tiktokAccessToken: null });
        res.json({ success: true, message: 'TikTok disconnected successfully' });
    } catch (error) {
        console.error('❌ TikTok Disconnect Error:', error);
        res.status(500).json({ success: false, message: 'Failed to disconnect TikTok' });
    }
};
