const Influencer = require('../models/Influencer');
const Video = require('../models/Video');
const bananaProvider = require('../providers/banana.provider');
const veoProvider = require('../providers/veo.provider');
const Subscription = require('../models/Subscription');

/**
 * UTILS: Centralized Influencer Prompt Builder
 */

const normalizeAesthetic = (aesthetic) => {
    const val = (aesthetic || 'photorealistic').toLowerCase();
    if (['photorealistic', 'realistic', 'real', 'real-human', 'human'].includes(val)) return 'photorealistic';
    if (['cartoon', 'stylized', 'animated', '3d'].includes(val)) return 'cartoon';
    return 'photorealistic';
};

const buildNegativePrompt = (aesthetic) => {
    if (normalizeAesthetic(aesthetic) === 'cartoon') {
        return 'low quality, blurry, distorted face, bad anatomy, messy hair';
    }
    
    // Strong negative for photorealistic mode
    return `
extreme close-up, ultra close-up, cropped forehead, cropped chin, face filling entire frame,
cartoon, anime, illustration, drawing, painting, pixar, disney, 3d render, cgi, doll, plastic skin, fake face,
over-smoothed skin, synthetic eyes, video game character, avatar, stylized portrait, uncanny valley, low quality, 
blurry, distorted facial features, airbrushed, unnatural skin.
`.trim();
};

const buildInfluencerPrompt = (config, customPrompt = '') => {
    const aesthetic = normalizeAesthetic(config.aesthetic);
    const gender = config.gender === 'man' ? 'man' : 'woman';
    const age = config.age || 25;
    
    // Default Hair Length if unspecified
    const defaultHairLength = gender === 'man' ? 'short' : 'medium';
    const hairLength = config.hair?.length || defaultHairLength;

    // 1. CARTOON STYLE
    if (aesthetic === 'cartoon') {
        return `
Professional 3D character design of a ${gender} named ${config.name || 'Influencer'}, age ${age}.
Disney/Pixar inspired style, expressive character, soft lighting, 3D animated masterpiece.
Traits: ${config.hair?.color} ${config.hair?.style} ${hairLength} hair, ${config.eyes?.color} eyes.
${customPrompt || ''}
`.trim();
    }

    // 2. PHOTOREALISTIC STYLE (Real Human)
    return `
Photorealistic portrait of a real human influencer named ${config.name || 'Influencer'}, age ${age}.
This must look exactly like a REAL PERSON photographed with a professional DSLR camera, not an illustration, not CGI, not 3D, not a cartoon, not AI art.

Subject:
- gender: ${gender}
- age: ${age}
- skin tone: ${config.skin?.tone || 'natural'}
- eye color: ${config.eyes?.color || 'natural'}
- eye shape: ${config.eyes?.shape || 'almond'}
- hair color: ${config.hair?.color || 'natural'}
- hair style: ${config.hair?.style || 'textured'}
- hair length: ${hairLength}

Framing and composition:
medium close-up portrait, head and shoulders visible, full hair visible, hair length clearly visible,
upper chest or shoulders included, enough space around the head, natural portrait composition,
not an extreme close-up, no cropped forehead, no cropped chin, no overly zoomed face.

Photography style:
extreme realism, editorial beauty portrait, RAW photo, 85mm lens, soft cinematic lighting, shallow depth of field,
neutral blurred background, authentic human skin, natural facial asymmetry, sharp iris details, high-end influencer photoshoot.

Important:
the face must look natural and believable, like a real Instagram model or influencer photographed in studio lighting.
No stylization, no fantasy, no painting effect, no CGI effect, no doll-like face, no plastic skin.

${customPrompt || ''}
`.trim();
};

/**
 * Controller Actions
 */

exports.getInfluencers = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status, gender, skinTone, eyeColor, hairColor } = req.query;
        
        let query = { userId };
        if (status) query.status = status;
        if (gender) query.gender = gender;
        if (skinTone) query['config.epidermal.tone'] = skinTone;
        if (eyeColor) query['config.ocular.color'] = eyeColor;
        if (hairColor) query['config.hair.color'] = hairColor;

        const influencers = await Influencer.find(query).sort({ createdAt: -1 });
        res.json({ success: true, influencers });
    } catch (error) {
        console.error('Get influencers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch influencers' });
    }
};

exports.createInfluencer = async (req, res) => {
    try {
        const userId = req.user._id;
        const influencerData = { ...req.body, userId };
        
        // Ensure aesthetic is normalized in the saved config
        if (influencerData.config) {
            influencerData.config.aesthetic = normalizeAesthetic(influencerData.config.aesthetic);
        }

        const influencer = await Influencer.create(influencerData);
        res.status(201).json({ success: true, influencer });
    } catch (error) {
        console.error('Create influencer error:', error);
        res.status(500).json({ success: false, message: 'Failed to create influencer' });
    }
};

exports.previewGenerateImage = async (req, res) => {
    const userId = req.user._id;
    console.log(`--------------------------------------------------`);
    console.log(`📸 [INFLUENCER PREVIEW] Request received | user=${userId}`);

    try {
        const config = req.body;
        
        // 1. Build Prompts
        const finalPrompt = buildInfluencerPrompt(config);
        const negativePrompt = buildNegativePrompt(config.aesthetic);

        console.log(`📸 [INFLUENCER PREVIEW] AE=${normalizeAesthetic(config.aesthetic)} | G=${config.gender} | A=${config.age}`);
        console.log(`📸 [INFLUENCER PREVIEW] Hair: C=${config.hair?.color} | S=${config.hair?.style} | L=${config.hair?.length || 'auto'}`);
        console.log(`📸 [INFLUENCER PREVIEW] Framing: Head, Shoulders, Full hair enforced.`);
        console.log(`📸 [INFLUENCER PREVIEW] Prompt: ${finalPrompt.substring(0, 100)}...`);

        // 2. Check Credits
        const subscription = await Subscription.findOne({ userId });
        if (!subscription || !subscription.hasCredits(2)) {
            console.warn(`⚠️ [INFLUENCER PREVIEW] Insufficient credits`);
            return res.status(403).json({ 
                success: false, 
                message: 'Crédits insuffisants pour la génération',
                creditsNeeded: 2, 
                creditsAvailable: subscription?.remainingCredits || 0 
            });
        }

        // 3. Generate
        const result = await bananaProvider.generateImage(
            `${finalPrompt}\n\nNegative prompt: ${negativePrompt}`, 
            '1024x1024', 
            'photorealistic', 
            'hd'
        );

        if (result.imageUrl) {
            await subscription.deductCredits(2);
            console.log(`✅ [INFLUENCER PREVIEW] Success | Credits deducted: 2`);
            res.json({ success: true, imageUrl: result.imageUrl });
        } else {
            throw new Error('No image URL returned from provider');
        }
    } catch (error) {
        console.error('❌ [INFLUENCER PREVIEW] Error:', error.message);
        res.status(500).json({ success: false, message: 'La génération d\'aperçu a échoué' });
    }
};

exports.generatePhotos = async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { count = 1, customPrompt = '' } = req.body;

    console.log(`--------------------------------------------------`);
    console.log(`📸 [INFLUENCER PHOTOS] Bulk gen start | count=${count} | influencer=${id}`);

    try {
        const influencer = await Influencer.findOne({ _id: id, userId });
        if (!influencer) return res.status(404).json({ success: false, message: 'Influencer not found' });

        // Build Prompts using influencer config
        const config = {
            ...influencer.config,
            name: influencer.name,
            gender: influencer.gender,
            age: influencer.age,
            hair: influencer.hair,
            skin: influencer.skin,
            eyes: influencer.eyes
        };

        const finalPrompt = buildInfluencerPrompt(config, customPrompt);
        const negativePrompt = buildNegativePrompt(config.aesthetic);
        
        // Check Credits (Count * 2)
        const subscription = await Subscription.findOne({ userId });
        const cost = count * 2;
        if (!subscription || !subscription.hasCredits(cost)) {
             return res.status(403).json({ success: false, message: 'Crédits insuffisants', creditsNeeded: cost });
        }

        const photos = [];
        for (let i = 0; i < count; i++) {
            console.log(`📸 [INFLUENCER PHOTOS] Generating ${i+1}/${count}...`);
            const result = await bananaProvider.generateImage(
                `${finalPrompt}\n\nNegative prompt: ${negativePrompt}`,
                '1024x1024', 
                'photorealistic', 
                'hd'
            );
            
            if (result.imageUrl) {
                const photoData = { 
                    imageUrl: result.imageUrl, 
                    createdAt: new Date(),
                    prompt: finalPrompt
                };
                influencer.photos.push(photoData);
                photos.push(photoData);
            }
        }

        await influencer.save();
        await subscription.deductCredits(cost);
        
        console.log(`✅ [INFLUENCER PHOTOS] Completed | Generated ${photos.length} photos`);
        res.json({ success: true, photos });
    } catch (error) {
        console.error('❌ [INFLUENCER PHOTOS] Error:', error);
        res.status(500).json({ success: false, message: 'Génération de photos échouée' });
    }
};

exports.generateVideos = async (req, res) => {
    const userId = req.user._id;
    const { id } = req.params;
    const { photoUrls, customPrompt = '' } = req.body;

    try {
        const influencer = await Influencer.findOne({ _id: id, userId });
        if (!influencer) return res.status(404).json({ success: false, message: 'Influencer not found' });

        const generatedVideos = [];
        
        console.log(`--------------------------------------------------`);
        console.log(`🌟 [INFLUENCER VIDEOS] Bulk gen start | count=${photoUrls.length}`);

        for (const photoUrl of photoUrls) {
            const prompt = `Video cinematic of ${influencer.name}, age ${influencer.age}. Realistic human motion, natural expression. ${customPrompt}`;
            console.log(`🎬 [INFLUENCER VIDEOS] Requesting Veo for ${influencer.name}...`);
            
            const job = await veoProvider.generateVideo({
                image: photoUrl,
                promptText: prompt,
                format: 'short'
            });

            if (job.id) {
                console.log(`✅ [INFLUENCER VIDEOS] Veo job created | id=${job.id}`);
                const videoData = {
                    generationId: job.id,
                    provider: 'veo',
                    status: 'generating',
                    prompt: prompt,
                    originalImageUrl: photoUrl,
                    createdAt: new Date(),
                    metadata: { influencerId: influencer._id, userId }
                };
                
                await Video.create({
                    userId,
                    promptText: prompt,
                    provider: 'veo',
                    generationId: job.id,
                    status: 'generating',
                    metadata: videoData.metadata
                });

                generatedVideos.push(videoData);
                influencer.videos.push(videoData);
            }
        }

        await influencer.save();
        res.json({ success: true, videos: generatedVideos });
    } catch (error) {
        console.error('❌ [INFLUENCER VIDEOS] Error:', error);
        res.status(500).json({ success: false, message: 'Génération de vidéos échouée' });
    }
};

exports.deleteInfluencer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        await Influencer.deleteOne({ _id: id, userId });
        res.json({ success: true, message: 'Influencer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
};
