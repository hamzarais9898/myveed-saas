const Video = require('../models/Video');
const Subscription = require('../models/Subscription');
const Image = require('../models/Image');
const mongoose = require('mongoose');
const Influencer = require('../models/Influencer');
const providerRouter = require('../providers');
const { generateUuid } = require('../utils/generateUuid');
const fs = require('fs');
const path = require('path');
const uploadService = require('../services/uploadService');
const videoEditingService = require('../services/videoEditingService');
const formatResolver = require('../utils/formatResolver');

/**
 * Helper to normalize statuses from different providers
 */
const normalizeStatus = (status) => {
  const s = (status || '').toLowerCase();
  if (['completed', 'success', 'generated', 'succeeded'].includes(s)) return 'generated';
  if (['processing', 'generating', 'in_progress', 'queued'].includes(s)) return 'generating';
  if (['failed', 'canceled', 'error'].includes(s)) return 'failed';
  return 'generating';
};

/**
 * Shared Veo Post-processing logic
 */
const processVeoVideo = async (video, statusInfo) => {
  // 0. Protection & Idempotency
  if (video.provider !== 'veo') return statusInfo.videoUrl;
  if (video.videoUrl && video.metadata?.veoPostProcessed) {
    console.log(`[VEO] Video ${video._id} already has URL and is post-processed.`);
    return video.videoUrl;
  }

  // 1. Atomic Lock: Acquire lock
  const lockedVideo = await Video.findOneAndUpdate(
    {
      _id: video._id,
      "metadata.veoPostProcessing": { $ne: true },
      "metadata.veoPostProcessed": { $ne: true }
    },
    {
      $set: { "metadata.veoPostProcessing": true }
    },
    { new: true }
  );

  if (!lockedVideo) {
    console.warn(`⚠️ [VEO] Race condition detected for ${video._id}. Lock already held.`);
    return video.videoUrl || null;
  }

  const tempDir = path.resolve(__dirname, '..', '..', 'temp');
  const tempFileName = `veo_${video.generationId.replace(/\//g, '_')}_${video._id}.mp4`;
  const tempFilePath = path.join(tempDir, tempFileName);
  const fixedFilePath = path.join(tempDir, `fixed_${tempFileName}`);

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const veoProvider = providerRouter.AVAILABLE_PROVIDERS?.veo;
    if (!veoProvider) throw new Error('Veo provider not available');

    console.log(`🎬 [VEO POST] Starting post-processing for ${video._id} (Op: ${video.generationId})`);

    // 1. Download Content
    await veoProvider.downloadContentToFile(video.generationId, tempFilePath);

    if (!fs.existsSync(tempFilePath)) {
      throw new Error(`Download failed: File not found at ${tempFilePath}`);
    }

    // 2. Fix MP4 Playback (Faststart / Remux)
    console.log(`🎬 [VEO POST] Optimizing MP4 for web streaming (faststart)...`);
    let finalProcessPath = tempFilePath;
    try {
      await uploadService.remuxForFaststart(tempFilePath, fixedFilePath);
      if (fs.existsSync(fixedFilePath)) {
        finalProcessPath = fixedFilePath;
        console.log(`✅ [VEO POST] Remux success.`);
      }
    } catch (remuxErr) {
      console.warn(`⚠️ [VEO POST] Remux failed, using original:`, remuxErr.message);
    }

    // 3. Upload to Cloudinary
    console.log(`📤 [VEO CLOUDINARY] Upload start | videoId=${video._id}`);
    const finalUrl = await uploadService.uploadVideo(finalProcessPath, 'veo_videos', video._id);

    if (!finalUrl) throw new Error('Cloudinary upload failed');
    console.log(`✅ [VEO CLOUDINARY] Upload success | url=${finalUrl}`);

    // 4. Cleanup
    await uploadService.deleteLocalFile(tempFilePath);
    if (fs.existsSync(fixedFilePath)) await uploadService.deleteLocalFile(fixedFilePath);

    // 5. Finalize Video
    console.log(`✅ [VEO POST] Video finalized | videoId=${video._id}`);
    await Video.updateOne(
      { _id: video._id },
      {
        $set: {
          videoUrl: finalUrl,
          status: 'generated',
          progress: 100,
          "metadata.veoPostProcessing": false,
          "metadata.veoPostProcessed": true
        }
      }
    );

    return finalUrl;
  } catch (error) {
    console.error(`❌ [VEO] Post-processing failed for ${video._id}:`, error.message);

    await Video.updateOne(
      { _id: video._id },
      {
        $set: {
          "metadata.veoPostProcessing": false,
          status: 'failed',
          lastError: `Post-processing failed: ${error.message}`
        }
      }
    ).catch(e => console.error('Failed to release Veo lock:', e.message));

    // Cleanup attempt
    try {
      if (fs.existsSync(tempFilePath)) await uploadService.deleteLocalFile(tempFilePath);
      if (fs.existsSync(fixedFilePath)) await uploadService.deleteLocalFile(fixedFilePath);
    } catch (cleanErr) {}

    throw error;
  }
};

/**
 * Shared Sora Post-processing logic
 */
const processSoraVideo = async (video, statusInfo) => {
  // 0. Protection & Idempotency
  if (video.provider !== 'sora') return statusInfo.videoUrl;
  if (video.videoUrl && video.metadata?.soraPostProcessed) {
    console.log(`[SORA] Video ${video._id} already has URL and is post-processed.`);
    return video.videoUrl;
  }

  // 1. Atomic Lock: Acquire lock using findOneAndUpdate
  // We check that it's not already processed and not currently processing
  const lockedVideo = await Video.findOneAndUpdate(
    {
      _id: video._id,
      "metadata.soraPostProcessing": { $ne: true },
      "metadata.soraPostProcessed": { $ne: true }
    },
    {
      $set: { "metadata.soraPostProcessing": true }
    },
    { new: true }
  );

  if (!lockedVideo) {
    console.warn(`⚠️ [SORA] Race condition detected for ${video._id}. Lock already held or video processed.`);
    return video.videoUrl || null;
  }

  const tempDir = path.resolve(__dirname, '..', '..', 'temp');
  const tempFileName = `sora_${video.generationId || video._id}.mp4`;
  const tempFilePath = path.join(tempDir, tempFileName);
  const fixedFilePath = path.join(tempDir, `fixed_${tempFileName}`);

  try {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const soraProvider = providerRouter.AVAILABLE_PROVIDERS?.sora;
    if (!soraProvider) throw new Error('Sora provider not available');

    console.log(`🎬 [SORA] Starting post-processing for ${video._id} (GenID: ${video.generationId})`);
    console.log(`📡 [SORA] Downloading content to: ${tempFilePath}`);

    // 1. Download Content
    await soraProvider.downloadContentToFile(video.generationId, tempFilePath);

    if (!fs.existsSync(tempFilePath)) {
      throw new Error(`Download failed: File not found at ${tempFilePath}`);
    }
    const stats = fs.statSync(tempFilePath);
    console.log(`✅ [SORA] Download complete. Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // 2. Fix MP4 Playback (Faststart / Remux)
    console.log(`🎬 [SORA] Optimizing MP4 for web streaming (faststart)...`);
    let finalProcessPath = tempFilePath;
    try {
      await uploadService.remuxForFaststart(tempFilePath, fixedFilePath);
      if (fs.existsSync(fixedFilePath)) {
        finalProcessPath = fixedFilePath;
        console.log(`✅ [SORA] Remux successful.`);
      }
    } catch (remuxErr) {
      console.warn(`⚠️ [SORA] Faststart remux failed, falling back to original:`, remuxErr.message);
    }

    // 3. Upload to Cloudinary
    console.log(`📤 [SORA] Uploading to Cloudinary...`);
    const finalUrl = await uploadService.uploadVideo(finalProcessPath, 'sora_videos', video._id);

    if (!finalUrl) {
      throw new Error('Cloudinary upload returned undefined URL');
    }
    console.log(`✅ [SORA] Upload successful: ${finalUrl}`);

    // 4. Delete Local Files
    await uploadService.deleteLocalFile(tempFilePath);
    if (fs.existsSync(fixedFilePath)) await uploadService.deleteLocalFile(fixedFilePath);

    // 5. Update video metadata and release lock
    await Video.updateOne(
      { _id: video._id },
      {
        $set: {
          videoUrl: finalUrl,
          status: 'generated',
          progress: 100,
          "metadata.soraPostProcessing": false,
          "metadata.soraPostProcessed": true,
          "metadata.store": { originalProvider: 'sora', openaiVideoId: video.generationId },
          "metadata.audioMerged": video.metadata?.audioMerged || false
        }
      }
    );

    return finalUrl;
  } catch (error) {
    console.error(`❌ [SORA] Post-processing failed for ${video._id}:`, error.message);

    // Release lock on error
    await Video.updateOne(
      { _id: video._id },
      {
        $set: {
          "metadata.soraPostProcessing": false,
          status: 'failed',
          lastError: `Post-processing failed: ${error.message}`
        }
      }
    ).catch(e => console.error('Failed to release Sora lock:', e.message));

    // Cleanup attempt
    try {
      if (fs.existsSync(tempFilePath)) await uploadService.deleteLocalFile(tempFilePath);
      if (fs.existsSync(fixedFilePath)) await uploadService.deleteLocalFile(fixedFilePath);
    } catch (cleanErr) { }

    throw error;
  }
};

/**
 * Generate new video(s)
 * POST /api/videos/generate
 */
exports.generateVideo = async (req, res) => {
  const { 
    promptText, format = 'youtube', variants = 1, duration = 10, provider = 'auto', image, 
    influencerId, sourceType, 
    preserveIdentity, preservePhotorealism, preserveFace, noStyleTransformation 
  } = req.body;
  const userId = req.user._id;

  console.log(`--------------------------------------------------`);
  console.log(`🚀 [VIDEO ROUTE] POST /api/videos/generate | user=${userId} | provider=${provider} | format=${format} | duration=${duration} | variants=${variants} | hasPrompt=${!!promptText} | hasImage=${!!image}`);
  if (sourceType === 'influencer') {
    console.log(`🚀 [VIDEO ROUTE] sourceType=influencer | influencerId=${influencerId} | identityLock=enabled`);
  }

  try {

    // Validation
    if ((!promptText || promptText.trim().length === 0) && !image) {
      return res.status(400).json({
        success: false,
        message: 'Prompt text or image is required'
      });
    }

    if (!['youtube', 'short', 'both'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Format must be youtube, short, or both'
      });
    }

    const variantsCount = parseInt(variants);
    if (variantsCount < 1 || variantsCount > 20) {
      return res.status(400).json({
        success: false,
        message: 'Variants must be between 1 and 20'
      });
    }

    // Validate provider choice
    if (provider && provider !== 'auto' && !['luma', 'pika', 'runway', 'sora', 'veo'].includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'provider must be "auto", "luma", "pika", "runway", "sora", or "veo"'
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

    // BLOCK FREE USERS - Require any paid subscription
    // Admin bypass: checks if user email is othman.mekouar99@gmail.com
    const isAdmin = req.user.email === 'othman.mekouar99@gmail.com';

    if (subscription.plan === 'free' && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required. Please upgrade your plan to generate videos.',
        requiresSubscription: true
      });
    }

    // Resolve the provider to use
    const selectedProvider = provider === 'auto'
      ? (process.env.DEFAULT_PROVIDER || 'runway')
      : provider;

    // Calculate credits based on provider and duration
    let creditsPerVideo = 0;
    if (selectedProvider.toLowerCase() === 'sora') {
      // Sora: 4s=1, 8s=2, 12s=3
      const soraSeconds = parseInt(duration);
      if (![4, 8, 12].includes(soraSeconds)) {
        return res.status(400).json({
          success: false,
          message: 'Sora duration must be 4, 8, or 12 seconds'
        });
      }
      creditsPerVideo = Math.ceil(soraSeconds / 4);
    } else {
      // Others (Runway, Luma, etc.): 5s=1, 10s=2
      creditsPerVideo = duration <= 5 ? 1 : 2;
    }

    // Resolve all configs to generate
    const configsToGenerate = formatResolver.resolveAllConfigs(format, selectedProvider);
    const totalVideos = configsToGenerate.length * variantsCount;
    const creditsNeeded = totalVideos * creditsPerVideo;

    // Check if user has enough credits
    if (!subscription.hasCredits(creditsNeeded)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient credits. You need ${creditsNeeded} credits but only have ${subscription.remainingCredits} remaining.`,
        creditsNeeded,
        creditsAvailable: subscription.remainingCredits,
        plan: subscription.plan
      });
    }

    // Generate batch ID for grouping
    const batchId = await generateUuid();

    // configsToGenerate already declared above
    const generatedVideos = [];

    // selectedProvider already declared above


    // Generate videos for each config and variant
    for (const outputConfig of configsToGenerate) {
      const videoFormat = outputConfig.variantType;
      for (let i = 1; i <= variantsCount; i++) {
        try {
          // 1. Resolve image if provided or influencer
          let resolvedImage = null;
          let inputImageId = null;

          if (sourceType === 'influencer' && influencerId) {
            const influencer = await Influencer.findOne({ _id: influencerId, userId });
            if (!influencer) {
              return res.status(404).json({ success: false, message: 'Influencer not found' });
            }
            console.log(`🚀 [VIDEO ROUTE] influencer trouvé=${influencer.name}`);
            
            // Priority: image from body > influencer photos[0] > influencer avatarUrl
            resolvedImage = image || (influencer.photos && influencer.photos.length > 0 ? influencer.photos[0].imageUrl : influencer.avatarUrl);
            console.log(`🚀 [VIDEO ROUTE] influencer image resolved=${resolvedImage}`);
          } else if (image) {
            if (mongoose.Types.ObjectId.isValid(image)) {
              const img = await Image.findOne({ _id: image, userId });
              if (!img) {
                return res.status(400).json({
                  success: false,
                  message: 'Image not found'
                });
              }
              resolvedImage = img.imageUrl;
              inputImageId = img._id;
            } else {
              resolvedImage = image; // URL or DataURI
            }
          }

          // Generate video using selected provider
          const generationJob = await providerRouter.generateVideo({
            promptText,
            format: videoFormat,
            provider: selectedProvider,
            duration,
            image: resolvedImage,
            outputConfig // Pass the full resolved config
          });

          // Log full generationJob
          console.log(`📊 ${selectedProvider.toUpperCase()} Generation Job:`, JSON.stringify(generationJob, null, 2));

          // Strict validation: check that generationJob.id exists
          if (!generationJob.id) {
            const errorMsg = `CRITICAL: GenerationJob ID is missing for provider: ${selectedProvider}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
          }

          // Get provider info to determine mode
          const availableProviders = providerRouter.getAvailableProviders();
          const providerInfo = availableProviders.find(p => p.id === selectedProvider.toLowerCase());
          const mode = providerInfo?.mode || 'api';

          const dur = Number(duration);
          const safeDuration = Number.isFinite(dur) ? dur : 0;

          // Instrumentation: Log schema paths to verify generationId existence
          console.log(`🔍 Video Schema Paths:`, Object.keys(Video.schema.paths));
          console.log(`🔍 Has generationId in Schema:`, !!Video.schema.paths.generationId);

          // Create video record with generation job info
          let video = await Video.create({
            userId,
            promptText: promptText ? promptText.trim() : 'Image-to-Video Generation',
            videoUrl: generationJob.videoUrl || null,
            format: videoFormat,
            variantNumber: i,
            duration: safeDuration,
            provider: selectedProvider,
            mode: mode,
            influencerId: influencerId || null,
            metadata: {
              providerRequestId: generationJob.requestId,
              generationType: resolvedImage ? 'image-to-video' : 'text-to-video',
              sourceType: influencerId ? 'influencer' : (inputImageId ? 'image' : (image ? 'direct' : null)),
              sourceInfluencerId: influencerId || null,
              inputImage: resolvedImage || null,
              inputImageId: inputImageId || null,
              // Identity Lock Flags
              preserveIdentity: influencerId ? true : !!preserveIdentity,
              preservePhotorealism: influencerId ? true : !!preservePhotorealism,
              preserveFace: influencerId ? true : !!preserveFace,
              noStyleTransformation: influencerId ? true : !!noStyleTransformation,
              // Format Specific Prompt Hint
              promptHint: outputConfig.promptHint
            },
            // Format Info
            outputAspectRatio: outputConfig.aspectRatio,
            outputWidth: outputConfig.width,
            outputHeight: outputConfig.height,
            outputOrientation: outputConfig.orientation,
            targetPlatformType: outputConfig.targetPlatformType,
            variantType: outputConfig.variantType,
            generationId: generationJob.id,
            batchId: variantsCount > 1 || configsToGenerate.length > 1 ? batchId : null,
            status: normalizeStatus(generationJob.status),
            cost: creditsPerVideo,
            tokens: safeDuration * 1000 // Placeholder for token tracking
          });
          
          if (influencerId) {
            console.log(`💾 [VIDEO DB] linked influencerId=${influencerId}`);
          }
          console.log(`💾 [VEO DB] Video saved | videoId=${video._id} | generationId=${video.generationId} | provider=${video.provider} | status=${video.status}`);

          // Re-validate video.generationId after DB creation
          if (!video.generationId) {
            console.error(`❌ CRITICAL: Persisted Video has no generationId! VideoID: ${video._id}`);
            throw new Error('Database persistence failure: generationId is missing');
          }

          // SPECIAL CASE: SORA/VEO background wait
          const skipDirectPollingProviders = ['runway', 'luma', 'pika'];
          if (['sora', 'veo'].includes(selectedProvider.toLowerCase())) {
            const genId = generationJob.id;
            console.log(`🚀 [${selectedProvider.toUpperCase()}] Launched background processing for ${genId}`);
            
            const providerInstance = providerRouter.AVAILABLE_PROVIDERS?.[selectedProvider.toLowerCase()];
            if (providerInstance) {
              (async () => {
                try {
                  const onProgress = async (progress) => {
                    await Video.findByIdAndUpdate(video._id, { progress }).catch(() => {});
                  };
                  
                  // For Veo, we use a slightly different retry strategy if needed, but the provider interface hides it
                  let completedData;
                  if (selectedProvider.toLowerCase() === 'sora') {
                    completedData = await providerInstance.waitForCompletion(genId, {}, onProgress);
                  } else {
                    // Manual polling loop for Veo if waitForCompletion not implemented, 
                    // or just rely on lazy update. Here we implement a small one or rely on lazy update.
                    // Let's rely on LAZY UPDATE in getVideos for Veo for now to keep it simple, 
                    // OR add a quick poll here.
                    console.log(`[VEO] Will be finalized via lazy update or dedicated webhook.`);
                    return;
                  }

                  if (['completed', 'succeeded', 'generated'].includes(completedData.status)) {
                    if (selectedProvider.toLowerCase() === 'sora') {
                      await processSoraVideo(video, completedData);
                    } else if (selectedProvider.toLowerCase() === 'veo') {
                      await processVeoVideo(video, completedData);
                    }
                  }
                } catch (bgErr) {
                  console.error(`❌ [${selectedProvider.toUpperCase()}] Background failed:`, bgErr.message);
                  await Video.findByIdAndUpdate(video._id, { status: 'failed', lastError: bgErr.message }).catch(() => {});
                }
              })();
            }
          }

          generatedVideos.push({
            id: video._id,
            promptText: video.promptText,
            videoUrl: video.videoUrl,
            format: video.format,
            provider: video.provider,
            mode: video.mode,
            generationId: video.generationId,
            variantNumber: video.variantNumber,
            batchId: video.batchId,
            status: video.status,
            createdAt: video.createdAt
          });

          console.log(`✅ Generated ${videoFormat} video variant ${i}/${variantsCount} using ${selectedProvider.toUpperCase()}`);
        } catch (error) {
          console.error(`❌ Failed to generate ${videoFormat} variant ${i}:`, error.response?.data || error.message);

          // Enhanced error reporting to frontend
          const errorMessage = error.response?.data?.message || error.message;
          const errorCode = error.response?.data?.code;

          return res.status(error.response?.status || 500).json({
            success: false,
            message: `Generation failed: ${errorMessage}`,
            errorCode: errorCode,
            provider: selectedProvider
          });
        }
      }
    }

    if (generatedVideos.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate any videos'
      });
    }

    // Deduct credits after successful generation
    await subscription.deductCredits(creditsNeeded);

    // Re-fetch subscription to get accurate remaining credits
    const updatedSubscription = await Subscription.findOne({ userId });

    res.status(201).json({
      success: true,
      message: `Successfully generated ${generatedVideos.length} video(s)`,
      batchId: generatedVideos.length > 1 ? batchId : null,
      count: generatedVideos.length,
      videos: generatedVideos,
      provider: selectedProvider,
      creditsUsed: creditsNeeded,
      creditsRemaining: updatedSubscription ? updatedSubscription.remainingCredits : 0
    });

  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate video',
      error: error.message
    });
  }
};

/**
 * Get all videos for current user
 * GET /api/videos
 */
exports.getVideos = async (req, res) => {
  try {
    const userId = req.user._id;

    const videos = await Video.find({ userId })
      .sort({ createdAt: -1 })
      .select('-__v')
      .populate('tiktokAccountId', 'accountName tiktokUsername');

    // LAZY UPDATE: Check status of pending videos (asynchronously in background)
    const pendingVideos = videos.filter(v => normalizeStatus(v.status) === 'generating');

    if (pendingVideos.length > 0) {
      console.log(`🔄 Checking status for ${pendingVideos.length} pending videos in background...`);

      Promise.all(pendingVideos.map(async (video) => {
        try {
          if (!video.generationId) return;

          const statusInfo = await providerRouter.checkStatus(video.generationId, video.provider);
          const normalizedStatus = normalizeStatus(statusInfo.status);

          if (normalizedStatus === 'generated') {
            let finalUrl = statusInfo.videoUrl;

            // SPECIAL CASE: Provider async download and upload (SORA/VEO)
            if (['sora', 'veo'].includes(video.provider) && !finalUrl) {
              const prefix = video.provider.toUpperCase();
              const isProcessing = video.metadata?.[`${video.provider}PostProcessing`] === true;
              const alreadyProcessed = video.metadata?.[`${video.provider}PostProcessed`] === true;
              
              if (alreadyProcessed || video.videoUrl) return;
              if (isProcessing) return;

              try {
                console.log(`🔄 [${prefix} LAZY] Entering post-processing for ${video._id}`);
                if (video.provider === 'sora') {
                  finalUrl = await processSoraVideo(video, statusInfo);
                } else {
                  finalUrl = await processVeoVideo(video, statusInfo);
                }
              } catch (err) {
                console.error(`❌ [${prefix} LAZY] Post-processing failed:`, err.message);
                return;
              }
            }

            // Handle Audio Merge if requested in metadata (Lazy Update)
            if (video.metadata && video.metadata.musicTrack && !video.metadata.audioMerged) {
              console.log(`🎵 Lazy Merging audio for ${video._id}...`);
              try {
                const mergedUrl = await videoEditingService.mergeRemoteVideoWithAudio(
                  finalUrl,
                  video.metadata.musicTrack,
                  video.userId,
                  video._id
                );
                finalUrl = mergedUrl;
                video.metadata.audioMerged = true;
                video.markModified('metadata');
              } catch (mergeErr) {
                console.error(`❌ Lazy Audio merge failed for ${video._id}:`, mergeErr.message);
              }
            }

            video.status = 'generated';
            video.videoUrl = finalUrl;
            video.progress = 100;
            video.lastError = null; // Clear error on success
            await video.save();
            console.log(`✅ Video ${video._id} completed!`);
          } else if (normalizedStatus === 'failed') {
            video.status = 'failed';
            video.lastError = statusInfo.failureReason || 'Generation failed';
            await video.save();
            console.log(`❌ Video ${video._id} failed.`);
          } else {
            // Update progress if available
            const rawProgress = statusInfo.progress;
            if (rawProgress !== undefined) {
              video.progress = rawProgress <= 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
              await video.save();
            }
          }
        } catch (err) {
          const status = err.response?.status;
          const isTransient = status === 429 || status >= 500;

          if (isTransient) {
            console.warn(`⚠️ [LAZY UPDATE] Transient error (${status}) for video ${video._id}. Keeping status as 'generating'.`);
          } else {
            console.error(`❌ [LAZY UPDATE] Permanent error checking status for video ${video._id}:`, err.message);
            // Optionally mark as failed if it's a 404 or other non-retryable error
            if (status === 404) {
              video.status = 'failed';
              video.lastError = 'Video not found on provider';
              await video.save();
            }
          }
        }
      })).catch(err => console.error("Background video check error:", err));
    }

    res.json({
      success: true,
      count: videos.length,
      videos: videos.map(video => ({
        id: video._id,
        promptText: video.promptText,
        videoUrl: video.videoUrl,
        format: video.format,
        variantNumber: video.variantNumber,
        batchId: video.batchId,
        status: video.status,
        progress: video.progress || 0,
        platformPublished: video.platformPublished,
        scheduledDate: video.scheduledDate,
        tiktokAccount: video.tiktokAccountId ? {
          id: video.tiktokAccountId._id,
          name: video.tiktokAccountId.accountName,
          username: video.tiktokAccountId.tiktokUsername
        } : null,
        createdAt: video.createdAt
      }))
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve videos'
    });
  }
};

/**
 * Get videos by batch ID
 * GET /api/videos/batch/:batchId
 */
exports.getBatchVideos = async (req, res) => {
  try {
    const { batchId } = req.params;
    const userId = req.user._id;

    const videos = await Video.find({ batchId, userId })
      .sort({ format: 1, variantNumber: 1 })
      .select('-__v');

    if (videos.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No videos found in this batch'
      });
    }

    res.json({
      success: true,
      batchId,
      count: videos.length,
      videos: videos.map(video => ({
        id: video._id,
        promptText: video.promptText,
        videoUrl: video.videoUrl,
        format: video.format,
        variantNumber: video.variantNumber,
        status: video.status,
        createdAt: video.createdAt
      }))
    });
  } catch (error) {
    console.error('Get batch videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve batch videos'
    });
  }
};

/**
 * Get single video by ID
 * GET /api/videos/:id
 */
exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ _id: id, userId })
      .populate('tiktokAccountId', 'accountName tiktokUsername');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      video: {
        id: video._id,
        promptText: video.promptText,
        videoUrl: video.videoUrl,
        format: video.format,
        variantNumber: video.variantNumber,
        batchId: video.batchId,
        status: video.status,
        platformPublished: video.platformPublished,
        scheduledDate: video.scheduledDate,
        tiktokAccount: video.tiktokAccountId ? {
          id: video.tiktokAccountId._id,
          name: video.tiktokAccountId.accountName,
          username: video.tiktokAccountId.tiktokUsername
        } : null,
        createdAt: video.createdAt
      }
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve video'
    });
  }
};

/**
 * Download video
 * GET /api/videos/download/:id
 */
exports.downloadVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const downloadService = require('../services/downloadService');
    const downloadInfo = await downloadService.getVideoDownloadUrl(id, userId);

    res.json({
      success: true,
      ...downloadInfo
    });
  } catch (error) {
    console.error('Download video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download video'
    });
  }
};

// Mongoose already imported at the top

/**
 * Schedule video for publication
 * POST /api/videos/:id/schedule
 */
exports.scheduleVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const { scheduledDate, tiktokAccountId } = req.body;
    const userId = req.user._id;

    // Validate tiktokAccountId if provided
    if (tiktokAccountId && !mongoose.Types.ObjectId.isValid(tiktokAccountId)) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant de compte TikTok invalide'
      });
    }

    // Verify video ownership
    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const schedulerService = require('../services/schedulerService');
    const updatedVideo = await schedulerService.scheduleVideo(id, scheduledDate, tiktokAccountId);

    res.json({
      success: true,
      message: 'Video scheduled successfully',
      video: {
        id: updatedVideo._id,
        scheduledDate: updatedVideo.scheduledDate,
        status: updatedVideo.status
      }
    });
  } catch (error) {
    console.error('Schedule video error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to schedule video'
    });
  }
};
/**
 * Schedule video for multiple platforms
 * POST /api/videos/:id/schedule-multi
 */
exports.scheduleMulti = async (req, res) => {
  try {
    const { id } = req.params;
    const { platformConfig, tiktokAccountId } = req.body;
    const userId = req.user._id;

    console.log(`[SCHEDULE MULTI] Request for video ${id}, body:`, JSON.stringify(req.body, null, 2));

    if (!platformConfig || Object.keys(platformConfig).length === 0) {
      return res.status(400).json({ success: false, message: 'Configuration de plateforme requise' });
    }

    // Validate and normalize platformConfig
    const now = new Date();
    const normalizedConfig = {};
    const platforms = ['tiktok', 'instagram', 'youtube', 'facebook'];

    for (const platform of platforms) {
      if (platformConfig[platform] && platformConfig[platform].startDate) {
        const date = new Date(platformConfig[platform].startDate);

        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            message: `Date invalide pour la plateforme ${platform}`
          });
        }

        if (date <= now) {
          return res.status(400).json({
            success: false,
            message: `La date pour ${platform} doit être dans le futur`
          });
        }

        normalizedConfig[platform] = { startDate: date };
      }
    }

    if (Object.keys(normalizedConfig).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune planification valide fournie'
      });
    }

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Vidéo non trouvée' });
    }

    const schedulerService = require('../services/schedulerService');
    const updatedVideo = await schedulerService.scheduleMultiPlatforms(id, normalizedConfig, tiktokAccountId);

    // Read-back verification for debug
    const verifiedVideo = await Video.findById(id).lean();
    console.log(`[SCHEDULE MULTI] Persistence check for ${id}:`, JSON.stringify(verifiedVideo.schedules, null, 2));

    res.json({
      success: true,
      message: 'Vidéo planifiée avec succès pour plusieurs plateformes',
      video: {
        id: updatedVideo._id,
        scheduledDate: updatedVideo.scheduledDate,
        status: updatedVideo.status,
        schedules: updatedVideo.schedules
      }
    });
  } catch (error) {
    console.error('Schedule multi error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to schedule video' });
  }
};

/**
 * Schedule video for a specific platform
 * POST /api/videos/:id/schedule-platform
 */
exports.schedulePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, scheduledDate, tiktokAccountId } = req.body;
    const userId = req.user._id;

    if (!platform || !scheduledDate) {
      return res.status(400).json({ success: false, message: 'Plateforme et date requises' });
    }

    const allowedPlatforms = ['tiktok', 'facebook', 'youtube', 'instagram'];
    if (!allowedPlatforms.includes(platform)) {
      return res.status(400).json({ success: false, message: 'Plateforme non supportée' });
    }

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Vidéo non trouvée' });
    }

    const schedulerService = require('../services/schedulerService');
    const updatedVideo = await schedulerService.scheduleOnePlatform(id, platform, scheduledDate, tiktokAccountId);

    res.json({
      success: true,
      message: `Vidéo planifiée sur ${platform}`,
      video: {
        id: updatedVideo._id,
        status: updatedVideo.status,
        scheduledDate: updatedVideo.scheduledDate,
        schedules: updatedVideo.schedules
      }
    });
  } catch (error) {
    console.error('Schedule platform error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la planification'
    });
  }
};

/**
 * Cancel scheduled publication
 * DELETE /api/videos/:id/schedule
 */
exports.cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Verify video ownership
    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const schedulerService = require('../services/schedulerService');
    const updatedVideo = await schedulerService.cancelSchedule(id);

    res.json({
      success: true,
      message: 'Schedule cancelled successfully',
      video: {
        id: updatedVideo._id,
        status: updatedVideo.status
      }
    });
  } catch (error) {
    console.error('Cancel schedule error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel schedule'
    });
  }
};

/**
 * Get video status explicitly (polling)
 * GET /api/videos/:id/status
 */
exports.getVideoStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  let video;
  
  try {
    video = await Video.findOne({ _id: id, userId });
    if (!video) {
        console.warn(`[VIDEO STATUS] Not found: ${id}`);
        return res.status(404).json({ success: false, message: 'Video not found' });
    }

    const providerId = video.provider.toUpperCase();
    console.log(`🔍 [${providerId} STATUS] Checking video=${id} | genId=${video.generationId}`);

    // If already generated, return immediately
    if (video.status === 'generated' || video.status === 'failed') {
      return res.json({
        success: true,
        status: video.status,
        progress: video.progress || (video.status === 'generated' ? 100 : 0),
        videoUrl: video.videoUrl,
        lastError: video.lastError
      });
    }

    // Call provider to check status
    const statusInfo = await providerRouter.checkStatus(video.generationId, video.provider);
    const normalizedStatus = normalizeStatus(statusInfo.status);

    // Update video record if status changed
    if (normalizedStatus === 'generated') {
      let finalUrl = statusInfo.videoUrl;

      // Post-processing (Download -> Upload Cloudinary)
      if (['sora', 'veo'].includes(video.provider) && !finalUrl) {
        try {
          if (video.provider === 'sora') {
            finalUrl = await processSoraVideo(video, statusInfo);
          } else {
            finalUrl = await processVeoVideo(video, statusInfo);
          }
        } catch (postErr) {
          console.error(`❌ [${video.provider.toUpperCase()} POLL] Post-processing failed:`, postErr.message);
          return res.json({ success: true, status: 'failed', lastError: postErr.message });
        }
      }

      video.status = 'generated';
      video.videoUrl = finalUrl;
      video.progress = 100;
      await video.save();
      return res.json({ success: true, status: 'generated', videoUrl: finalUrl });
    } else if (normalizedStatus === 'failed') {
      video.status = 'failed';
      video.lastError = statusInfo.failureReason || 'Generation failed';
      await video.save();
      return res.json({ success: true, status: 'failed', lastError: video.lastError });
    } else {
      // Still generating
      const rawProgress = statusInfo.progress;
      if (rawProgress !== undefined) {
        video.progress = rawProgress <= 1 ? Math.round(rawProgress * 100) : Math.round(rawProgress);
        await video.save();
      }
      return res.json({
        success: true,
        status: 'generating',
        progress: video.progress
      });
    }
  } catch (err) {
    const status = err.response?.status;
    const isTransient = status === 429 || status >= 500;

    console.error(`❌ Status check error for ${id}:`, err.message);

    if (isTransient && video) {
      // Return current DB status instead of failing
      return res.json({
        success: true,
        status: video.status,
        progress: video.progress,
        message: 'Provider API is temporarily unavailable, showing last known status'
      });
    }

    return res.status(status || 500).json({
      success: false,
      message: 'Failed to check video status',
      error: err.message
    });
  }
};

/**
 * Delete video
 * DELETE /api/videos/:id
 */
exports.deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findOneAndDelete({ _id: id, userId });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video'
    });
  }
};
/**
 * Batch schedule multiple videos
 * POST /api/videos/batch-schedule
 */
exports.batchSchedule = async (req, res) => {
  try {
    const { videoIds, platformConfig, tiktokAccountId } = req.body;
    const userId = req.user._id;

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No videos selected' });
    }

    if (tiktokAccountId && !mongoose.Types.ObjectId.isValid(tiktokAccountId)) {
      return res.status(400).json({ success: false, message: 'Identifiant de compte TikTok invalide' });
    }

    if (!platformConfig || Object.keys(platformConfig).length === 0) {
      return res.status(400).json({ success: false, message: 'Platform configuration missing' });
    }

    // Verify ownership and fetch videos
    const videos = await Video.find({ _id: { $in: videoIds }, userId });

    if (videos.length !== videoIds.length) {
      return res.status(403).json({ success: false, message: 'Access denied to some videos' });
    }

    // Sort videos by creation date to ensure logical scheduling order
    videos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    let scheduledCount = 0;

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const schedules = video.schedules || {};
      let hasSchedule = false;
      let earliestDate = null;

      // Iterate over platforms in config
      for (const [platform, config] of Object.entries(platformConfig)) {
        if (!config.startDate) continue;

        const start = new Date(config.startDate);
        // Interval is in hours
        const intervalMs = (config.intervalHours || 2) * 60 * 60 * 1000;

        // Calculate date: Start + (Index * Interval)
        const scheduledTime = new Date(start.getTime() + (i * intervalMs));

        schedules[platform] = {
          date: scheduledTime,
          status: 'pending' // pending publication
        };

        if (!earliestDate || scheduledTime < earliestDate) {
          earliestDate = scheduledTime;
        }
        hasSchedule = true;
      }

      if (hasSchedule) {
        video.schedules = schedules;
        video.status = 'scheduled';
        video.scheduledDate = earliestDate; // Set main date to earliest for sorting/lists

        if (tiktokAccountId && schedules.tiktok) {
          video.tiktokAccountId = tiktokAccountId;
        }

        // Important: Mark schedules as modified if it's a mixed type or nested object
        video.markModified('schedules');
        await video.save();
        scheduledCount++;
      }
    }

    res.json({
      success: true,
      message: `${scheduledCount} videos scheduled successfully`,
      data: videos.map(v => ({ id: v._id, status: v.status, schedules: v.schedules }))
    });

  } catch (error) {
    console.error('Batch schedule error:', error);
    res.status(500).json({ success: false, message: 'Failed to batch schedule videos' });
  }
};

/**
 * Get available video providers
 * GET /api/videos/providers/available
 */
exports.getAvailableProviders = async (req, res) => {
  try {
    const providers = providerRouter.getAvailableProviders();

    res.json({
      success: true,
      providers: providers
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available providers'
    });
  }
};

/**
 * Complete manual video upload
 * POST /api/admin/videos/:id/upload-complete
 * Body: { videoUrl }
 */
exports.completeManualUpload = async (req, res) => {
  try {
    const { id } = req.params;
    const { videoUrl } = req.body;
    const userId = req.user._id;

    if (!videoUrl || videoUrl.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'videoUrl is required'
      });
    }

    // Find video
    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Only manual mode videos can be completed via upload
    if (video.mode !== 'manual') {
      return res.status(400).json({
        success: false,
        message: 'Only manual mode videos can be completed via upload'
      });
    }

    // Update video
    video.videoUrl = videoUrl;
    video.status = 'generated';
    await video.save();

    // Notify provider of completion
    try {
      await providerRouter.completeVideo(video.generationId, video.provider, videoUrl);
    } catch (error) {
      console.warn('Provider notification failed:', error.message);
    }

    res.json({
      success: true,
      message: 'Video upload completed successfully',
      video: {
        id: video._id,
        videoUrl: video.videoUrl,
        status: video.status,
        provider: video.provider,
        mode: video.mode
      }
    });

  } catch (error) {
    console.error('Manual upload completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete manual upload'
    });
  }
};


/**
 * Delete all videos (user specific)
 * DELETE /api/videos/all
 */
exports.deleteAllVideos = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Video.deleteMany({ userId });

    res.json({
      success: true,
      message: 'All videos deleted successfully',
      count: result.deletedCount
    });
  } catch (error) {
    console.error('Delete all videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all videos'
    });
  }
};

/**
 * Extend video duration
 * POST /api/videos/:id/extend
 */
exports.extendVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user._id;
    const { prompt } = req.body;

    const video = await Video.findOne({ _id: videoId, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (video.provider !== 'kling') {
      return res.status(400).json({ success: false, message: 'Only Kling videos can be extended' });
    }

    // Check credits for extension (5s extend = 1 credit)
    const subscription = await Subscription.findOne({ userId });
    if (!subscription.hasCredits(1)) {
      return res.status(403).json({ success: false, message: 'Insufficient credits for extension (1 credit needed)' });
    }

    try {
      const providerInstance = providerRouter.getProvider('kling');
      const result = await providerInstance.extendVideo(video.externalId, {
        prompt,
        mode: video.metadata?.mode || 'std'
      });

      // Deduct credits
      await subscription.deductCredits(1);

      // Create a new video entry for the extension
      const extensionVideo = await Video.create({
        userId,
        batchId: video.batchId,
        externalId: result.id,
        provider: 'kling',
        status: 'processing',
        promptText: prompt || `Extension of ${video.promptText}`,
        format: video.format,
        isExtension: true,
        parentVideoId: video._id
      });

      res.json({
        success: true,
        message: 'Video extension started',
        video: extensionVideo
      });

    } catch (error) {
      console.error('❌ Failed to extend video:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json({
        success: false,
        message: `Extension failed: ${error.response?.data?.message || error.message}`,
        provider: 'kling'
      });
    }
  } catch (error) {
    console.error('Extend video error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend video',
      error: error.message
    });
  }
};
/**
 * Get Sora video content stream
 * GET /api/videos/:id/sora-content
 */
exports.getSoraContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const video = await Video.findOne({ _id: id, userId });
    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    if (video.provider !== 'sora') {
      return res.status(400).json({ success: false, message: 'Only Sora videos support content streaming' });
    }

    if (!video.generationId) {
      return res.status(400).json({ success: false, message: 'Video has no generation ID' });
    }

    const soraProvider = providerRouter.AVAILABLE_PROVIDERS?.sora;
    if (!soraProvider) throw new Error('Sora provider not available');

    console.log(`📡 Streaming Sora content for ${video.generationId} to client...`);

    const stream = await soraProvider.getContentStream(video.generationId);

    // Set headers for video streaming
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="sora_${video.generationId}.mp4"`);

    stream.pipe(res);
  } catch (error) {
    console.error('Sora content streaming error:', error);
    const status = error.response?.status || 500;
    res.status(status).json({
      success: false,
      message: 'Failed to stream Sora content',
      error: error.message
    });
  }
};

/**
 * Get Sora debug information
 * GET /api/debug/sora/:videoId
 */
exports.getSoraDebugInfo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user._id;

    // Check admin (re-using the logic from generateVideo)
    const isAdmin = req.user.email === 'othman.mekouar99@gmail.com';
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const video = await Video.findOne({ _id: videoId, userId });

    if (!video) {
      // Try finding by generationId if not found by primary key
      const videoByGen = await Video.findOne({ generationId: videoId, userId });
      if (!videoByGen) return res.status(404).json({ success: false, message: 'Video not found' });
      return this.getSoraDebugInternal(videoByGen, res);
    }

    return this.getSoraDebugInternal(video, res);

  } catch (error) {
    console.error('Sora debug error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Internal helper for Sora debug
 */
exports.getSoraDebugInternal = async (video, res) => {
  try {
    if (video.provider !== 'sora') {
      return res.status(400).json({ success: false, message: 'Not a Sora video' });
    }

    const soraProvider = providerRouter.AVAILABLE_PROVIDERS?.sora;
    if (!soraProvider) throw new Error('Sora provider not available');

    const statusInfo = await soraProvider.checkStatus(video.generationId);

    const key = process.env.OPENAI_API_KEY || '';
    const fingerprint = key ? `${key.slice(0, 8)}...${key.slice(-4)}` : '(none)';

    res.json({
      success: true,
      debug: {
        videoId: video._id,
        generationId: video.generationId,
        keyFingerprint: fingerprint,
        projectId: process.env.OPENAI_PROJECT_ID || '(none)',
        lastRequestId: statusInfo.requestId || video.metadata?.soraRequestId || 'unknown',
        openaiStatusRaw: statusInfo.rawStatus,
        normalizedStatus: statusInfo.status,
        progress: statusInfo.progress
      },
      video: video
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
