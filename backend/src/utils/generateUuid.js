const crypto = require('crypto');

/**
 * Generates a UUID string.
 * Uses a dynamic import of the 'uuid' package (ESM) with a fallback to 
 * Node.js native crypto.randomUUID() to ensure CommonJS compatibility 
 * and avoid ERR_REQUIRE_ESM on Vercel.
 * 
 * @returns {Promise<string>} A UUID string.
 */
async function generateUuid() {
  try {
    // Try dynamic import of uuid (ESM)
    const { v4: uuidv4 } = await import('uuid');
    return uuidv4();
  } catch (error) {
    // Fallback to native Node.js crypto
    // randomUUID is available in Node 14.17+ and 16+
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Last resort: basic implementation for very old Node versions (should not happen on Vercel)
    console.warn('[UUID-HELPER] uuid package and crypto.randomUUID not found, using fallback.');
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = { generateUuid };
