const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const uploadService = require('./uploadService');

// Configure ffmpeg to use static binaries
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Video Editing Service
 * Edit and compose final video with captions, music, voice-over
 */

/**
 * Trim video to specific segment
 */
exports.trimVideo = async (videoPath, startTime, endTime) => {
  try {
    console.log('Trimming video:', { videoPath, startTime, endTime });

    const outputPath = videoPath.replace('.mp4', '_trimmed.mp4');
    const duration = endTime - startTime;

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .setStartTime(startTime)
        .setDuration(duration)
        .output(outputPath)
        .on('end', () => {
          console.log('Video trimmed:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error('Failed to trim video: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Trim video error:', error);
    throw error;
  }
};

/**
 * Add background music to video
 */
exports.addBackgroundMusic = async (videoPath, musicTrack, volume = 0.3) => {
  try {
    console.log('Adding background music:', { videoPath, musicTrack, volume });

    const outputPath = videoPath.replace('.mp4', '_with_music.mp4');

    // TODO: Get music file path from music library
    const musicPath = path.join(__dirname, '../../assets/music', `${musicTrack}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(musicPath)
        .complexFilter([
          `[1:a]volume=${volume}[music]`,
          `[0:a][music]amix=inputs=2:duration=first[aout]`
        ])
        .outputOptions(['-map 0:v', '-map [aout]'])
        .output(outputPath)
        .on('end', () => {
          console.log('Background music added:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Add music error:', err);
          // If music file not found, just copy original
          resolve(videoPath);
        })
        .run();
    });

  } catch (error) {
    console.error('Add background music error:', error);
    return videoPath; // Return original if fails
  }
};

/**
 * Replace voice-over with TTS audio
 */
exports.replaceVoiceOver = async (videoPath, ttsAudioPath) => {
  try {
    console.log('Replacing voice-over:', { videoPath, ttsAudioPath });

    const outputPath = videoPath.replace('.mp4', '_with_voiceover.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .input(ttsAudioPath)
        .outputOptions([
          '-map 0:v',  // Video from first input
          '-map 1:a',  // Audio from second input (TTS)
          '-c:v copy', // Copy video codec
          '-c:a aac',  // AAC audio codec
          '-shortest'  // Match shortest stream
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('Voice-over replaced:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error('Failed to replace voice-over: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Replace voice-over error:', error);
    throw error;
  }
};

/**
 * Add captions to video (burn-in)
 */
exports.addCaptions = async (videoPath, captions, style) => {
  try {
    console.log('Adding captions to video:', { videoPath, captionsCount: captions.length });

    const outputPath = videoPath.replace('.mp4', '_with_captions.mp4');

    // Generate SRT subtitle file
    const srtPath = videoPath.replace('.mp4', '.srt');
    const srtContent = generateSRT(captions);
    fs.writeFileSync(srtPath, srtContent);

    // Build ffmpeg subtitle filter
    const subtitleFilter = buildSubtitleFilter(style);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .outputOptions([
          `-vf subtitles=${srtPath}:force_style='${subtitleFilter}'`
        ])
        .output(outputPath)
        .on('end', () => {
          console.log('Captions added:', outputPath);
          // Clean up SRT file
          fs.unlinkSync(srtPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error('Failed to add captions: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Add captions error:', error);
    throw error;
  }
};

/**
 * Apply background (blurred or black bars)
 */
exports.applyBackground = async (videoPath, type = 'blurred') => {
  try {
    console.log('Applying background:', { videoPath, type });

    const outputPath = videoPath.replace('.mp4', '_with_bg.mp4');

    let filter;
    if (type === 'blurred') {
      // Blurred background
      filter = [
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,boxblur=20:5[bg]',
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease[fg]',
        '[bg][fg]overlay=(W-w)/2:(H-h)/2'
      ];
    } else {
      // Black bars
      filter = [
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black'
      ];
    }

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .complexFilter(filter)
        .output(outputPath)
        .on('end', () => {
          console.log('Background applied:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error('Failed to apply background: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Apply background error:', error);
    throw error;
  }
};

/**
 * Convert to vertical format (9:16)
 */
exports.convertToVertical = async (videoPath) => {
  try {
    console.log('Converting to vertical format:', videoPath);

    const outputPath = videoPath.replace('.mp4', '_vertical.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .size('1080x1920')
        .aspect('9:16')
        .output(outputPath)
        .on('end', () => {
          console.log('Converted to vertical:', outputPath);
          resolve(outputPath);
        })
        .on('error', (err) => {
          reject(new Error('Failed to convert to vertical: ' + err.message));
        })
        .run();
    });

  } catch (error) {
    console.error('Convert to vertical error:', error);
    throw error;
  }
};

/**
 * Compose final video with all edits
 */
exports.composeVideo = async (options) => {
  try {
    console.log('Composing final video:', options);

    let currentPath = options.videoPath;

    // 1. Apply background if needed
    if (options.blurredBackground || options.blackBars) {
      const bgType = options.blurredBackground ? 'blurred' : 'blackbars';
      currentPath = await exports.applyBackground(currentPath, bgType);
    }

    // 2. Add captions if provided
    if (options.captions && options.captionStyle) {
      currentPath = await exports.addCaptions(currentPath, options.captions, options.captionStyle);
    }

    // 3. Add background music if provided
    if (options.backgroundMusic) {
      currentPath = await exports.addBackgroundMusic(currentPath, options.backgroundMusic, 0.3);
    }

    // 4. Replace voice-over if provided
    if (options.ttsAudioPath) {
      currentPath = await exports.replaceVoiceOver(currentPath, options.ttsAudioPath);
    }

    // 5. Convert to vertical format
    currentPath = await exports.convertToVertical(currentPath);

    console.log('Final video composed:', currentPath);
    return currentPath;

  } catch (error) {
    console.error('Compose video error:', error);
    throw new Error('Failed to compose video: ' + error.message);
  }
};

/**
 * Merge a remote video with an audio track and upload to Cloudinary
 * @param {string} videoUrl - URL of the video (usually from Kling)
 * @param {string} audioInput - ID of music track or direct URL to audio
 * @param {string} userId - For naming the file
 * @param {string} videoId - Optional Video ID for Cloudinary public_id
 */
exports.mergeRemoteVideoWithAudio = async (videoUrl, audioInput, userId, videoId = null) => {
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const tempId = Date.now();
  const rawVideoPath = path.join(tempDir, `raw_${tempId}.mp4`);
  const rawAudioPath = path.join(tempDir, `audio_${tempId}.mp3`);
  const mergedVideoPath = path.join(tempDir, `merged_${tempId}.mp4`);

  try {
    console.log(`📥 Downloading original video from: ${videoUrl}`);

    // 1. Download Video
    const videoResponse = await axios({ method: 'get', url: videoUrl, responseType: 'stream' });
    const videoWriter = fs.createWriteStream(rawVideoPath);
    videoResponse.data.pipe(videoWriter);
    await new Promise((resolve, reject) => { videoWriter.on('finish', resolve); videoWriter.on('error', reject); });

    console.log(`✅ Downloaded raw video: ${rawVideoPath}`);

    // 2. Identify and Download Audio
    let audioPath = '';
    const isUrl = audioInput && (audioInput.startsWith('http://') || audioInput.startsWith('https://'));

    if (isUrl) {
      console.log(`📥 Downloading audio from URL: ${audioInput}`);
      const audioResponse = await axios({ method: 'get', url: audioInput, responseType: 'stream' });
      const audioWriter = fs.createWriteStream(rawAudioPath);
      audioResponse.data.pipe(audioWriter);
      await new Promise((resolve, reject) => { audioWriter.on('finish', resolve); audioWriter.on('error', reject); });
      audioPath = rawAudioPath;
    } else {
      // Fallback to local assets if it's an ID
      audioPath = path.join(__dirname, '../../assets/music', `${audioInput}.mp3`);
    }

    // If audio doesn't exist, just upload the raw video as is
    if (!fs.existsSync(audioPath)) {
      console.warn(`⚠️ Audio source not found. Skipping merge.`);
      return await uploadService.uploadVideo(rawVideoPath, 'processed_videos', videoId);
    }

    console.log(`🎵 Merging with audio: ${audioPath}`);

    // 3. Perform the merge
    await new Promise((resolve, reject) => {
      ffmpeg(rawVideoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-map 0:v:0',
          '-map 1:a:0',
          '-shortest'
        ])
        .output(mergedVideoPath)
        .on('end', resolve)
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    console.log(`✅ Merge complete: ${mergedVideoPath}`);

    // 4. Upload to Cloudinary
    const finalUrl = await uploadService.uploadVideo(mergedVideoPath, 'processed_videos', videoId);

    return finalUrl;

  } catch (error) {
    console.error('❌ Merge error:', error);
    throw error;
  } finally {
    // Cleanup
    uploadService.deleteLocalFile(rawVideoPath);
    uploadService.deleteLocalFile(rawAudioPath);
    uploadService.deleteLocalFile(mergedVideoPath);
  }
};

/**
 * Generate SRT subtitle file content
 */
function generateSRT(captions) {
  return captions.map((caption, index) => {
    const startTime = formatSRTTime(caption.start);
    const endTime = formatSRTTime(caption.end);
    return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
  }).join('\n');
}

/**
 * Format time for SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Build subtitle filter for ffmpeg
 */
function buildSubtitleFilter(style) {
  const filters = [];

  if (style.font) filters.push(`FontName=${style.font}`);
  if (style.fontSize) filters.push(`FontSize=${style.fontSize}`);
  if (style.color) filters.push(`PrimaryColour=${hexToAss(style.color)}`);
  if (style.outline) filters.push(`Outline=${style.outlineWidth || 2}`);
  if (style.shadow) filters.push(`Shadow=1`);
  if (style.weight === 'bold') filters.push(`Bold=1`);

  return filters.join(',');
}

/**
 * Convert hex color to ASS format
 */
function hexToAss(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `&H00${b.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}`;
}
