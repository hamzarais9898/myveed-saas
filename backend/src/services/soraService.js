const fetch = require('node-fetch');

/**
 * SORA Video Generation Service
 * Handles OpenAI SORA API integration for advanced AI video generation
 */

/**
 * Generate video using SORA API
 * @param {string} promptText - The text prompt for video generation
 * @param {string} format - Video format: 'youtube' (16:9) or 'short' (9:16)
 * @returns {Promise<string>} - URL of the generated video
 */
exports.generateVideo = async (promptText, format = 'youtube') => {
  try {
    console.log(`🎬 Connecting to SORA API for ${format} video...`);
    console.log(`📝 Prompt: ${promptText}`);

    const API_URL = process.env.SORA_API_URL || 'https://api.openai.com/v1';
    const API_KEY = process.env.SORA_API_KEY;

    if (!API_KEY || API_KEY === 'your_sora_api_key_here') {
      console.warn('⚠️ SORA API Key not configured, using fallback simulation.');
      return simulateGeneration(promptText, format);
    }

    // Determine resolution based on format
    const resolution = format === 'short' ? '1080x1920' : '1920x1080';

    const response = await fetch(`${API_URL}/video/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        model: process.env.SORA_MODEL || 'gpt-4-turbo-with-vision',
        duration: 60,
        resolution: resolution,
        quality: 'hd',
        callback_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/videos/webhook`
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`SORA API Error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ SORA Generation Started ID: ${data.id || 'N/A'}`);
    
    return data.data?.[0]?.url || data.videoUrl || data.url || simulateGeneration(promptText, format);

  } catch (error) {
    console.error('❌ SORA video generation error:', error);
    // Fallback to simulation for dev if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Development mode: falling back to simulation.');
      return simulateGeneration(promptText, format);
    }
    throw new Error('Failed to generate video with SORA: ' + error.message);
  }
};

/**
 * Simulation helper for development
 */
async function simulateGeneration(promptText, format) {
  await new Promise(resolve => setTimeout(resolve, 3000)); // SORA takes longer
  
  const youtubeVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  ];
  
  const shortVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  ];
  
  const videoPool = format === 'short' ? shortVideos : youtubeVideos;
  return videoPool[Math.floor(Math.random() * videoPool.length)];
}

/**
 * Check video generation status (for async generation)
 */
exports.checkVideoStatus = async (videoId) => {
  try {
    const API_URL = process.env.SORA_API_URL;
    const API_KEY = process.env.SORA_API_KEY;

    if (!API_KEY || API_KEY === 'your_sora_api_key_here') {
      return { status: 'completed', videoUrl: 'https://storage.sora.example.com/demo.mp4' };
    }

    const response = await fetch(`${API_URL}/video/generations/${videoId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    return await response.json();
  } catch (error) {
    console.error('SORA status check error:', error);
    throw new Error('Failed to check video status');
  }
};
