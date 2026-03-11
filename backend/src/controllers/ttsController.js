const Subscription = require('../models/Subscription');
const ttsService = require('../services/ttsService');

/**
 * Get available voices
 * GET /api/tts/voices
 */
exports.getVoices = async (req, res) => {
  try {
    const voices = ttsService.getAvailableVoices();

    res.json({
      success: true,
      count: voices.length,
      voices
    });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get voices'
    });
  }
};

/**
 * Get vibe presets
 * GET /api/tts/vibes
 */
exports.getVibes = async (req, res) => {
  try {
    const vibes = ttsService.getVibePresets();

    res.json({
      success: true,
      count: vibes.length,
      vibes
    });
  } catch (error) {
    console.error('Get vibes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get vibes'
    });
  }
};

/**
 * Generate TTS audio
 * POST /api/tts/generate
 */
exports.generateTts = async (req, res) => {
  try {
    const { text, voice = 'ash', vibe = 'default', customVibe = null } = req.body;
    const userId = req.user._id;

    // Validate text
    try {
      ttsService.validateTextLength(text, 1500);
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }

    // Check subscription and TTS credits
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found.'
      });
    }

    // Calculate cost
    const ttsCost = ttsService.calculateTtsCost(text);

    // Check if user has enough TTS credits
    if (!subscription.hasTtsCredits(ttsCost)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient TTS credits. You need ${ttsCost} TTS credit but only have ${subscription.remainingTtsCredits} remaining.`,
        creditsNeeded: ttsCost,
        creditsAvailable: subscription.remainingTtsCredits,
        plan: subscription.plan
      });
    }

    // Generate TTS audio
    const audioUrl = await ttsService.generateSpeech(text, voice, vibe, customVibe);

    // Deduct TTS credits
    await subscription.deductTtsCredits(ttsCost);

    res.status(201).json({
      success: true,
      message: 'TTS audio generated successfully',
      audioUrl,
      voice,
      vibe,
      textLength: text.length,
      ttsCreditsUsed: ttsCost,
      ttsCreditsRemaining: subscription.remainingTtsCredits - ttsCost
    });

  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate TTS audio',
      error: error.message
    });
  }
};

/**
 * Preview voice (short sample)
 * POST /api/tts/preview
 */
exports.previewVoice = async (req, res) => {
  try {
    const { voice = 'ash', vibe = 'default' } = req.body;

    // Generate short preview (no credits required)
    const previewText = 'Bonjour, je suis une voix de synthèse. Ceci est un aperçu de ma voix.';
    const audioUrl = await ttsService.generateSpeech(previewText, voice, vibe);

    res.json({
      success: true,
      audioUrl,
      voice,
      vibe
    });

  } catch (error) {
    console.error('Voice preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to preview voice'
    });
  }
};
