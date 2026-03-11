/**
 * buildSafeTitle - Generates a safe title for video platforms
 * @param {Object} params
 * @param {string} params.title - Provided title
 * @param {string} params.promptText - Fallback prompt text
 * @param {string} params.videoId - Fallback video ID
 * @returns {string} - Cleaned and normalized title
 */
function buildSafeTitle({ title, promptText, videoId }) {
    let t = (title ?? "").toString().trim();

    // Fallback if no title provided
    if (!t) t = (promptText ?? "").toString().trim();

    // Fallback final if still empty
    if (!t) t = `MAVEED Video ${String(videoId || "000000").slice(-6)}`;

    // Nettoyage unicode safe (sans supprimer accents)
    t = t
        .normalize("NFKC")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return t;
}

/**
 * clamp - Truncates a string to a maximum length with an ellipsis
 * @param {string} str - String to clamp
 * @param {number} max - Maximum length
 * @returns {string} - Clamped string
 */
function clamp(str, max) {
    const s = (str ?? "").toString();
    return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

/**
 * sanitizePlatformTitle - Applies platform-specific sanitization rules
 * @param {string} str - String to sanitize
 * @param {Object} options - Options including platform
 * @returns {string} - Sanitized string
 */
function sanitizePlatformTitle(str, { platform }) {
    let s = (str ?? "").toString();

    if (platform === 'facebook') {
        // Facebook: slug-safe (letters, digits, space, dash, underscore)
        // Remove special quotes and other non-slug-safe chars
        s = s
            .replace(/[“”‘’"']/g, "") // Remove quotes
            .replace(/[^a-zA-Z0-9\s\-_À-ÿ]/g, " ") // Keep accents but remove other special chars
            .replace(/\s+/g, " ")
            .trim();
        return clamp(s, 80);
    }

    if (platform === 'youtube') {
        return clamp(s, 100);
    }

    if (platform === 'tiktok') {
        return clamp(s, 150);
    }

    return s;
}

/**
 * getPlatformTitle - Unified entry point for getting a title for any platform
 */
function getPlatformTitle({ platform, title, promptText, videoId }) {
    const base = buildSafeTitle({ title, promptText, videoId });
    return sanitizePlatformTitle(base, { platform });
}

module.exports = {
    buildSafeTitle,
    clamp,
    sanitizePlatformTitle,
    getPlatformTitle
};
