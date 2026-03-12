const Image = require('../models/Image');
const Subscription = require('../models/Subscription');
const geminiProvider = require('../providers/gemini.provider');
const bananaProvider = require('../providers/banana.provider');

/**
 * Generate new image(s)
 * POST /api/images/generate
 */
exports.generateImage = async (req, res) => {
  try {
    const { promptText, resolution = '1024x1024', style = 'cinematic', variants = 1, provider = 'gemini' } = req.body;
    const userId = req.user._id;

    // Validation
    if (!promptText || promptText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Prompt text is required'
      });
    }

    if (!['512x512', '768x768', '1024x1024', '1024x1792', '1792x1024'].includes(resolution)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resolution'
      });
    }

    if (!['realistic', 'cinematic', 'illustration', 'anime', 'painting', 'photorealistic'].includes(style)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid style'
      });
    }

    const variantsCount = parseInt(variants);
    if (variantsCount < 1 || variantsCount > 10) {
      return res.status(400).json({
        success: false,
        message: 'Variants must be between 1 and 10'
      });
    }

    // Check subscription and credits
    let subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found. Please contact support.',
        requiresSubscription: true
      });
    }

    const creditsNeeded = variantsCount * 2; // 2 credits per image variant

    if (!subscription.hasCredits(creditsNeeded)) {
      return res.status(403).json({
        success: false,
        message: `Crédits insuffisants. Vous avez besoin de ${creditsNeeded} crédits mais il ne vous en reste que ${subscription.remainingCredits}.`,
        creditsNeeded,
        creditsAvailable: subscription.remainingCredits,
        plan: subscription.plan
      });
    }

    const generatedImages = [];

    // Select provider client
    const providerClient = provider === 'banana' ? bananaProvider : geminiProvider;
    const providerName = provider === 'banana' ? 'banana' : 'gemini';

    // Generate images
    for (let i = 1; i <= variantsCount; i++) {
      try {
        const generationJob = await providerClient.generateImage(promptText, resolution, style, req.body.quality || 'standard');

        // Create image record
        const image = await Image.create({
          userId,
          promptText: promptText.trim(),
          imageUrl: generationJob.imageUrl || null,
          provider: providerName,
          resolution: resolution,
          style: style,
          generationId: generationJob.id,
          cost: providerName === 'banana' ? 0.05 : 0.02, // Banana is more premium
          tokens: 500,
          status: generationJob.imageUrl ? 'generated' : 'processing'
        });

        generatedImages.push({
          id: image._id,
          promptText: image.promptText,
          imageUrl: image.imageUrl,
          resolution: image.resolution,
          style: image.style,
          provider: image.provider,
          generationId: image.generationId,
          status: image.status,
          createdAt: image.createdAt
        });

        console.log(`✅ Generated image variant ${i}/${variantsCount} via ${providerName}`);
      } catch (error) {
        console.error(`❌ Failed to generate image variant ${i} via ${providerName}:`, error);
      }
    }

    if (generatedImages.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate any images'
      });
    }

    // Deduct credits
    await subscription.deductCredits(creditsNeeded);

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedImages.length} image(s)`,
      count: generatedImages.length,
      images: generatedImages,
      creditsUsed: creditsNeeded,
      creditsRemaining: subscription.remainingCredits
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate images'
    });
  }
};

/**
 * Get all user images
 * GET /api/images
 */
exports.getImages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0, status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Image.countDocuments(query);

    res.json({
      success: true,
      images: images.map(img => ({
        id: img._id,
        imageUrl: img.imageUrl,
        promptText: img.promptText,
        resolution: img.resolution,
        style: img.style,
        provider: img.provider,
        status: img.status,
        createdAt: img.createdAt
      })),
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve images'
    });
  }
};

/**
 * Get single image by ID
 * GET /api/images/:id
 */
exports.getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const image = await Image.findOne({ _id: id, userId });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      image
    });

  } catch (error) {
    console.error('Get image by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve image'
    });
  }
};

/**
 * Check image generation status
 * GET /api/images/:id/status
 */
exports.checkImageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const image = await Image.findOne({ _id: id, userId });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // If still processing, check provider status
    if (image.status === 'processing') {
      try {
        const statusInfo = await geminiProvider.checkImageStatus(image.generationId);
        
        if (statusInfo.status === 'completed' && statusInfo.imageUrl) {
          image.imageUrl = statusInfo.imageUrl;
          image.status = 'generated';
          await image.save();
        }
      } catch (error) {
        console.warn('Provider status check failed:', error.message);
      }
    }

    res.json({
      success: true,
      image: {
        id: image._id,
        status: image.status,
        imageUrl: image.imageUrl,
        promptText: image.promptText,
        provider: image.provider,
        createdAt: image.createdAt
      }
    });

  } catch (error) {
    console.error('Check image status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check image status'
    });
  }
};

/**
 * Delete image
 * DELETE /api/images/:id
 */
exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const image = await Image.findOneAndDelete({ _id: id, userId });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image'
    });
  }
};

/**
 * Get available image styles
 * GET /api/images/styles/available
 */
exports.getAvailableStyles = async (req, res) => {
  res.json({
    success: true,
    styles: [
      { id: 'realistic', name: 'Realistic', description: 'Photorealistic style' },
      { id: 'cinematic', name: 'Cinematic', description: 'Movie-like cinematography' },
      { id: 'illustration', name: 'Illustration', description: 'Digital illustration' },
      { id: 'anime', name: 'Anime', description: 'Anime/manga style' },
      { id: 'painting', name: 'Painting', description: 'Oil painting style' },
      { id: 'photorealistic', name: 'Photorealistic', description: 'Ultra-photorealistic' }
    ],
    resolutions: [
      { id: '512x512', name: 'Small', size: '512x512' },
      { id: '768x768', name: 'Medium', size: '768x768' },
      { id: '1024x1024', name: 'Large (Square)', size: '1024x1024' },
      { id: '1024x1792', name: 'Portrait', size: '1024x1792' },
      { id: '1792x1024', name: 'Landscape', size: '1792x1024' }
    ]
  });
};

  /**
   * Preview generate image without authentication and without saving to DB
   * POST /api/images/generate/preview
   */
  exports.previewGenerate = async (req, res) => {
    try {
      const { promptText, resolution = '1024x1024', style = 'cinematic', provider = 'gemini' } = req.body;

      if (!promptText || promptText.trim().length === 0) {
        return res.status(400).json({ success: false, message: 'Prompt text is required' });
      }

      const providerClient = provider === 'banana' ? require('../providers/banana.provider') : require('../providers/gemini.provider');
      const providerName = provider === 'banana' ? 'banana' : 'gemini';

      const generationJob = await providerClient.generateImage(promptText, resolution, style);

      if (!generationJob) {
        return res.status(500).json({ success: false, message: 'Provider failed to generate image' });
      }

      return res.json({
        success: true,
        image: {
          imageUrl: generationJob.imageUrl || null,
          provider: providerName,
          generationId: generationJob.id || null
        }
      });

    } catch (error) {
      console.error('Preview generate error:', error);
      res.status(500).json({ success: false, message: 'Failed to preview generate image' });
    }
  };
