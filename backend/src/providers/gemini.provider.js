const axios = require('axios');

const GEMINI_API_BASE = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';
const API_KEY = process.env.GEMINI_API_KEY;

async function generateImage(promptText, resolution = '1024x1024', style = 'photorealistic', model = process.env.GEMINI_MODEL || 'models/nano-banana-pro') {
  if (!API_KEY) return simulateImageGeneration(promptText, resolution, style);

  const url = `${GEMINI_API_BASE}/${model}:generateImage?key=${API_KEY}`;
  try {
    const payload = { prompt: { text: promptText }, imageConfig: { mimeType: 'image/png', resolution } };
    const resp = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' }, timeout: 120000 });
    const data = resp.data || {};
    if (data?.image?.imageBytes) return { id: data?.id || null, imageUrl: `data:image/png;base64,${data.image.imageBytes}`, status: 'completed', raw: data };
    if (data?.image?.uri) return { id: data?.id || null, imageUrl: data.image.uri, status: 'completed', raw: data };
    if (Array.isArray(data?.artifacts) && data.artifacts.length > 0) {
      const first = data.artifacts[0];
      if (first?.imageBytes) return { id: data?.id || null, imageUrl: `data:image/png;base64,${first.imageBytes}`, status: 'completed', raw: data };
      if (first?.uri) return { id: data?.id || null, imageUrl: first.uri, status: 'completed', raw: data };
    }
    return { id: data?.id || null, imageUrl: null, status: 'failed', raw: data };
  } catch (err) {
    console.error('Gemini provider error:', err?.response?.data || err.message || err);
    if (process.env.NODE_ENV === 'development') return simulateImageGeneration(promptText, resolution, style);
    throw err;
  }
}

async function checkImageStatus(generationId) {
  return { id: generationId, status: 'completed', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop', provider: 'gemini' };
}

async function getImageUrl(generationId) {
  const status = await checkImageStatus(generationId);
  if (status.status !== 'completed') throw new Error(`Image is still ${status.status}`);
  return status.imageUrl;
}

async function simulateImageGeneration(promptText, resolution, style) {
  await new Promise(r => setTimeout(r, 800));
  const imageUrls = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1469474937318-56ceb5ff4e0b?w=1024&h=1024&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=1024&h=1024&fit=crop'
  ];
  const url = imageUrls[Math.floor(Math.random() * imageUrls.length)];
  return { id: `sim_${Date.now()}`, imageUrl: url, status: 'completed', provider: 'gemini', promptText, resolution, style };
}

module.exports = { generateImage, checkImageStatus, getImageUrl };
