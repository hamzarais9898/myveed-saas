const Subscription = require('../models/Subscription');
const Video = require('../models/Video');
const providerRouter = require('../providers');

/**
 * Transform user video into a "Star" video
 * POST /api/stars/transform
 */
exports.transformToStar = async (req, res) => {
  try {
    const { starId, videoPath, style = 'original', gender = 'male', customPrompt = '' } = req.body;
    const userId = req.user._id;

    if (!starId) {
      return res.status(400).json({ success: false, message: 'Star ID is required' });
    }

    // Check subscription and credits
    let subscription = await Subscription.findOne({ userId });
    if (!subscription) {
      subscription = await Subscription.create({ userId, plan: 'free', credits: 30, ttsCredits: 10 });
    }

    const creditsNeeded = 15; // 15 credits per star transformation

    if (!subscription.hasCredits(creditsNeeded)) {
      return res.status(403).json({
        success: false,
        message: `Crédits insuffisants. Vous avez besoin de ${creditsNeeded} crédits.`,
        creditsNeeded,
        creditsAvailable: subscription.remainingCredits
      });
    }

    // Determine target prompt based on star and customization
    const promptText = `Transform this video into ${starId} with ${style} style. ${customPrompt}`;

    // Start generation (using Sora/Veo3 if available, fallback to default provider)
    const provider = 'veo'; // Default to Veo for high quality
    const generationJob = await providerRouter.generateVideo({
      promptText,
      format: 'short',
      provider,
      metadata: { starId, style, gender }
    });

    // Create video record
    const video = await Video.create({
      userId,
      promptText,
      videoUrl: generationJob.videoUrl || null,
      format: 'short',
      provider,
      status: generationJob.imageUrl ? 'generated' : 'processing',
      metadata: {
        starId,
        style,
        gender,
        transformationType: 'star'
      }
    });

    // Deduct credits
    await subscription.deductCredits(creditsNeeded);

    res.status(201).json({
      success: true,
      message: 'Transformation commencée !',
      video: {
        id: video._id,
        status: video.status,
        createdAt: video.createdAt
      },
      creditsUsed: creditsNeeded,
      creditsRemaining: subscription.remainingCredits
    });

  } catch (error) {
    console.error('Star transformation error:', error);
    res.status(500).json({ success: false, message: 'Échec de la transformation' });
  }
};
