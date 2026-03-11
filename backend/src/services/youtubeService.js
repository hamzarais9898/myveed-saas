const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs');

// Configure ffmpeg to use static binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * YouTube Service
 * Handles YouTube video analysis and download
 */

/**
 * Analyze YouTube video
 * Extract metadata: title, duration, channel, thumbnail, available languages
 */
exports.analyzeYouTubeVideo = async (url) => {
  try {
    console.log('Analyzing YouTube video:', url);

    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = info.videoDetails;

    // Extract available languages from captions
    const availableLanguages = [];
    if (info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
      const tracks = info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks;
      tracks.forEach(track => {
        if (!availableLanguages.includes(track.languageCode)) {
          availableLanguages.push(track.languageCode);
        }
      });
    }

    // Default languages if none found
    if (availableLanguages.length === 0) {
      availableLanguages.push('fr', 'en');
    }

    const analysis = {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      channel: videoDetails.author.name,
      duration: parseInt(videoDetails.lengthSeconds),
      durationFormatted: formatDuration(parseInt(videoDetails.lengthSeconds)),
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1].url,
      description: videoDetails.description,
      viewCount: parseInt(videoDetails.viewCount),
      uploadDate: videoDetails.uploadDate,
      availableLanguages: availableLanguages,
      url: url
    };

    console.log('Video analyzed:', analysis.title);
    return analysis;

  } catch (error) {
    console.error('YouTube analysis error:', error);
    throw new Error('Failed to analyze YouTube video: ' + error.message);
  }
};

/**
 * Download YouTube video segment
 * @param {string} url - YouTube URL
 * @param {object} startTime - { hours, minutes, seconds }
 * @param {number} duration - Duration in seconds
 * @returns {Promise<string>} - Path to downloaded video file
 */
exports.downloadYouTubeVideo = async (url, startTime = { hours: 0, minutes: 0, seconds: 0 }, duration = 60) => {
  try {
    console.log('Downloading YouTube video segment:', { url, startTime, duration });

    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Calculate start time in seconds
    const startSeconds = (startTime.hours * 3600) + (startTime.minutes * 60) + startTime.seconds;

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../../uploads/youtube');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const videoId = ytdl.getVideoID(url);
    const outputPath = path.join(uploadsDir, `${videoId}_${Date.now()}.mp4`);

    // Download video with ytdl-core
    return new Promise((resolve, reject) => {
      const videoStream = ytdl(url, {
        quality: 'highestvideo',
        filter: 'videoandaudio'
      });

      // Use ffmpeg to trim the video
      ffmpeg(videoStream)
        .setStartTime(startSeconds)
        .setDuration(duration)
        .output(outputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .on('end', () => {
          console.log('Video downloaded and trimmed:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error('Failed to process video: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('YouTube download error:', error);
    throw new Error('Failed to download YouTube video: ' + error.message);
  }
};

/**
 * Extract audio from video
 */
exports.extractAudio = async (videoPath) => {
  try {
    console.log('Extracting audio from:', videoPath);

    const audioPath = videoPath.replace('.mp4', '_audio.mp3');

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(audioPath)
        .audioCodec('libmp3lame')
        .noVideo()
        .on('end', () => {
          console.log('Audio extracted:', audioPath);
          resolve(audioPath);
        })
        .on('error', (err) => {
          console.error('Audio extraction error:', err);
          reject(new Error('Failed to extract audio: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Extract audio error:', error);
    throw new Error('Failed to extract audio: ' + error.message);
  }
};

/**
 * Generate transcript for captions
 * TODO: Integrate with speech-to-text API (Google Cloud Speech, Whisper, etc.)
 */
exports.generateTranscript = async (audioPath, language = 'fr') => {
  try {
    console.log('Generating transcript:', { audioPath, language });

    // Simulate transcript generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace with real transcription API
    /*
    // Option 1: Google Cloud Speech-to-Text
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient();
    
    const audio = {
      content: fs.readFileSync(audioPath).toString('base64')
    };
    
    const config = {
      encoding: 'MP3',
      sampleRateHertz: 16000,
      languageCode: language
    };
    
    const [response] = await client.recognize({ audio, config });
    const transcript = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    */

    // Simulated transcript with timestamps
    const mockTranscript = [
      { start: 0, end: 3, text: "Bienvenue dans cette vidéo" },
      { start: 3, end: 6, text: "Aujourd'hui on va parler de" },
      { start: 6, end: 10, text: "quelque chose d'incroyable" },
      { start: 10, end: 14, text: "qui va changer votre vie" },
      { start: 14, end: 18, text: "Restez jusqu'à la fin" }
    ];

    console.log('Transcript generated');
    return mockTranscript;

  } catch (error) {
    console.error('Transcript generation error:', error);
    throw new Error('Failed to generate transcript: ' + error.message);
  }
};

/**
 * Format duration from seconds to HH:MM:SS
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
