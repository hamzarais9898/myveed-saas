const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

/**
 * Google Veo (Gemini API) Service
 * Implements predictLongRunning for video generation
 */

const API_KEY = process.env.VEO_API_KEY;
const API_URL = process.env.VEO_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = process.env.VEO_MODEL || 'veo-2.0-generate-001';

/**
 * Helper to get a safe fingerprint of the API key
 */
const getFingerprint = (key) => {
  if (!key) return 'MISSING';
  if (key.length < 12) return '******';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
};

/**
 * Helper to convert remote image URL to base64
 */
async function imageToBase64(imageUrl) {
  try {
    console.log(`📡 [VEO] Fetching remote image for conversion: ${imageUrl}`);
    const response = await fetch(imageUrl, { timeout: 15000 });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error(`❌ [VEO ERROR] Image conversion failed:`, error.message);
    throw new Error(`Could not process remote image: ${error.message}`);
  }
}

/**
 * Generate Video Operation (LRO)
 */
exports.generateVideoOp = async (payload) => {
  if (!API_KEY) {
    console.error(`❌ [VEO ERROR] VEO_API_KEY is not configured`);
    throw new Error('VEO_API_KEY is not configured');
  }

  const { promptText, image, format, aspectRatio: payloadAspectRatio, duration = 8 } = payload;
  const aspectRatio = payloadAspectRatio || (format === 'short' ? '9:16' : '16:9');
  const url = `${API_URL}/models/${MODEL}:predictLongRunning?key=${API_KEY}`;
  
  // Base instance
  const instance = { prompt: promptText };

  // Handle Image (Image-to-Video)
  if (image) {
    let base64Data = null;
    if (image.startsWith('data:')) {
      base64Data = image.split(',')[1];
    } else if (image.startsWith('http')) {
      base64Data = await imageToBase64(image);
    } else {
      base64Data = image;
    }

    if (base64Data) {
      instance.image = { bytesBase64Encoded: base64Data };
    }
  }

  const body = {
    instances: [instance],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectRatio,
      durationSeconds: parseInt(duration) || 8
    }
  };

  // 1. Log Request Call
  console.log(`--------------------------------------------------`);
  console.log(`📡 [VEO REQ] POST ${API_URL}/models/${MODEL}:predictLongRunning`);
  console.log(`📡 [VEO REQ] model=${MODEL} | aspect=${aspectRatio} | duration=${duration}s | mode=${image ? 'image-to-video' : 'text-to-video'} | hasImage=${!!image} | key=${getFingerprint(API_KEY)}`);
  
  const startTime = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeout: parseInt(process.env.VEO_REQUEST_TIMEOUT_MS) || 120000
  });

  const durationMs = Date.now() - startTime;

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [VEO ERROR] Request failed | status=${response.status} | time=${durationMs}ms | message=${errorText}`);
    throw new Error(`Veo API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.name) {
    console.error(`❌ [VEO ERROR] Missing operation name in response:`, JSON.stringify(data));
    throw new Error('Invalid Veo API response: Missing operation name');
  }

  // 2. Log Response Success
  console.log(`✅ [VEO RES] HTTP ${response.status} | time=${durationMs}ms | operation=${data.name}`);
  return data;
};

/**
 * Get Operation Status
 */
exports.getOperation = async (operationName) => {
  if (!API_KEY) throw new Error('VEO_API_KEY is not configured');

  const url = `${API_URL}/${operationName}?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [VEO ERROR] Status check failed | operation=${operationName} | status=${response.status}`);
    throw new Error(`Veo Status error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Robust Video URL Extraction for Veo/Gemini
 */
exports.extractVideoUrl = (operation) => {
  if (!operation.done || !operation.response) return null;
  
  const res = operation.response;
  const getUri = (val) => (typeof val === 'string' ? val : val?.uri);
  
  try {
    let url = null;
    if (res.generatedVideos?.[0]?.video) url = getUri(res.generatedVideos[0].video);
    else if (res.generated_videos?.[0]?.video) url = getUri(res.generated_videos[0].video);
    else if (res.generateVideoResponse?.generatedSamples?.[0]?.video) url = getUri(res.generateVideoResponse.generatedSamples[0].video);
    else if (res.outputs?.[0]?.video) url = getUri(res.outputs[0].video);
    else if (res.video) url = getUri(res.video);

    if (url) {
      console.log(`🔗 [VEO] Extracted video URL: ${url.substring(0, 50)}...`);
    } else {
      console.warn('⚠️ [VEO] Could not find video URL/URI in any known path:', JSON.stringify(res).substring(0, 200));
    }
    return url;
  } catch (e) {
    console.error('❌ [VEO ERROR] Parsing extracted URL failed:', e.message);
    return null;
  }
};

/**
 * Download Video File
 */
exports.downloadFile = async (url, destPath) => {
  console.log(`📡 [VEO DOWNLOAD] Start | url=${url.substring(0, 50)}...`);
  const startTime = Date.now();
  
  const response = await fetch(url, {
    timeout: parseInt(process.env.VEO_DOWNLOAD_TIMEOUT_MS) || 300000
  });
  
  if (!response.ok) {
    console.error(`❌ [VEO DOWNLOAD] HTTP Error | status=${response.status} | url=${url}`);
    throw new Error(`Failed to download video (${response.status}): ${url}`);
  }

  await streamPipeline(response.body, fs.createWriteStream(destPath));
  
  const stats = fs.statSync(destPath);
  const durationMs = Date.now() - startTime;
  console.log(`✅ [VEO DOWNLOAD] Complete | size=${(stats.size/1024/1024).toFixed(2)}MB | time=${durationMs}ms | path=${destPath}`);
  return destPath;
};
