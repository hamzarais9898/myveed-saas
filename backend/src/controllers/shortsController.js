const Subscription = require('../models/Subscription');
const youtubeService = require('../services/youtubeService');
const captionService = require('../services/captionService');
const videoEditingService = require('../services/videoEditingService');
const Video = require('../models/Video');
const { uploadVideo } = require('../config/cloudinary');
const fs = require('fs');

/**
 * Analyze YouTube video
 * POST /api/shorts/analyze
 */
exports.analyzeVideo = async (req, res) => {
  try {
    const { youtubeUrl } = req.body;

    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required'
      });
    }

    const analysis = await youtubeService.analyzeYouTubeVideo(youtubeUrl);

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Analyze video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze video',
      error: error.message
    });
  }
};

/**
 * Get caption styles
 * GET /api/shorts/caption-styles
 */
exports.getCaptionStyles = async (req, res) => {
  try {
    const styles = captionService.getCaptionStyles();

    res.json({
      success: true,
      count: styles.length,
      styles
    });

  } catch (error) {
    console.error('Get caption styles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get caption styles'
    });
  }
};

/**
 * Generate MAVEED Short from YouTube video
 * POST /api/shorts/generate
 */
exports.generateShort = async (req, res) => {
  try {
    const {
      youtubeUrl,
      startTime = { hours: 0, minutes: 0, seconds: 0 },
      duration = 60,
      backgroundMusic = null,
      voice = null,
      vibe = 'default',
      captionStyle = 1,
      language = 'fr',
      titleText = null,
      blurredBackground = false,
      blackBars = false
    } = req.body;

    const userId = req.user._id;

    // Validation
    if (!youtubeUrl) {
      return res.status(400).json({
        success: false,
        message: 'YouTube URL is required'
      });
    }

    if (duration < 10 || duration > 180) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 10 and 180 seconds'
      });
    }

    // Check subscription and credits
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found.'
      });
    }

    const creditsNeeded = 10; // 10 credits per MAVEED Short

    if (!subscription.hasCredits(creditsNeeded)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient credits. You need ${creditsNeeded} credits but only have ${subscription.remainingCredits} remaining.`,
        creditsNeeded,
        creditsAvailable: subscription.remainingCredits,
        plan: subscription.plan
      });
    }

    // Start generation process
    console.log('🎬 Starting MAVEED Short generation...');

    // 1. Download YouTube video segment
    console.log('📥 Downloading YouTube video...');
    const videoPath = await youtubeService.downloadYouTubeVideo(youtubeUrl, startTime, duration);

    // 2. Extract audio for transcript
    console.log('🎵 Extracting audio...');
    const audioPath = await youtubeService.extractAudio(videoPath);

    // 3. Generate transcript
    console.log('📝 Generating transcript...');
    const transcript = await youtubeService.generateTranscript(audioPath, language);

    // 4. Generate captions with style
    console.log('💬 Generating captions...');
    const captionStyleObj = captionService.getCaptionStyleById(captionStyle);
    const captions = captionService.generateCaptions(transcript, captionStyle);

    // 5. Compose final video
    console.log('🎞️ Composing final video...');
    const finalVideoPath = await videoEditingService.composeVideo({
      videoPath,
      captions,
      captionStyle: captionStyleObj,
      backgroundMusic,
      ttsAudioPath: null, // TODO: Integrate TTS if voice is provided
      blurredBackground,
      blackBars
    });

    // 6. Upload final video to Cloudinary
    console.log('☁️ Uploading final video to Cloudinary...');
    const finalVideoUrl = await uploadVideo(finalVideoPath, 'remakeit-shorts');

    // Clean up local temporary files
    try {
      const filesToDelete = [
        videoPath,
        finalVideoPath,
        videoPath.replace('.mp4', '.mp3'),
        videoPath.replace('.mp4', '_audio.mp3'),
        videoPath.replace('.mp4', '_trimmed.mp4'),
        videoPath.replace('.mp4', '_with_music.mp4'),
        videoPath.replace('.mp4', '_with_voiceover.mp4'),
        videoPath.replace('.mp4', '_with_captions.mp4'),
        videoPath.replace('.mp4', '.srt'),
        videoPath.replace('.mp4', '_with_bg.mp4'),
        videoPath.replace('.mp4', '_vertical.mp4')
      ];

      for (const file of filesToDelete) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
      
      // Attempt to clean up any other files with the same video ID in the directory
      // This helps catch any variations I might have missed
      if (videoPath) {
        const dir = require('path').dirname(videoPath);
        const basename = require('path').basename(videoPath, '.mp4');
        // Simple heuristic: if filename contains the videoId and ends in mp4 or mp3
        const files = fs.readdirSync(dir);
        for (const file of files) {
           if (file.startsWith(basename) && (file.endsWith('.mp4') || file.endsWith('.mp3') || file.endsWith('.srt'))) {
             const fullPath = require('path').join(dir, file);
             try {
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
             } catch (e) {
                // Ignore
             }
           }
        }
      }

    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    // 7. Create video record
    const video = await Video.create({
      userId,
      promptText: `YouTube Short from: ${youtubeUrl}`,
      videoUrl: finalVideoUrl,
      format: 'short',
      status: 'generated',
      metadata: {
        sourceUrl: youtubeUrl,
        startTime,
        duration,
        captionStyle,
        backgroundMusic,
        language,
        titleText
      }
    });

    // 8. Deduct credits
    await subscription.deductCredits(creditsNeeded);

    console.log('✅ MAVEED Short generated successfully!');

    res.status(201).json({
      success: true,
      message: 'MAVEED Short generated successfully',
      video: {
        id: video._id,
        videoUrl: video.videoUrl,
        format: video.format,
        status: video.status,
        createdAt: video.createdAt
      },
      creditsUsed: creditsNeeded,
      creditsRemaining: subscription.remainingCredits - creditsNeeded
    });

  } catch (error) {
    console.error('Generate short error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate MAVEED Short',
      error: error.message
    });
  }
};
