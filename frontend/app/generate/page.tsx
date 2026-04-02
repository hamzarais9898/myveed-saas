'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import FormatSelector from '@/components/FormatSelector';
import Footer from '@/components/Footer';
import BatchProgress from '@/components/BatchProgress';
import { generateVideo, getAvailableProviders, getVideoStatus } from '@/services/videoService';
import { generateImage, checkImageStatus } from '@/services/imageService';
import PremiumLoading from '@/components/PremiumLoading';
import { Download, Image as ImageIcon, Video as VideoIcon, Sparkles, X, Layers } from 'lucide-react';
import ImagePicker from '@/components/generation/ImagePicker';
import PromptHelper from '@/components/generation/PromptHelper';
import PromptCoach from '@/components/generation/PromptCoach';

import SubtitleStudio, { SubtitleStyle, SubtitlePosition } from '@/components/generation/SubtitleStudio';
import MusicSelector, { MusicTrack } from '@/components/generation/MusicSelector';
import StyleSelector, { VideoStyle } from '@/components/generation/StyleSelector';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Mic, MicOff } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface Provider {
    id: 'luma' | 'sora' | 'veo' | 'runway';
    name: string;
    description: string;
    status: 'active' | 'coming-soon' | 'simulation';
    supported: boolean;
    features: string[];
    waitlist?: boolean;
}

function GenerateContent() {
    const router = useRouter();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [promptText, setPromptText] = useState('');
    const [format, setFormat] = useState<'youtube' | 'short' | 'both'>('youtube');
    const [variants, setVariants] = useState(1);
    const [duration, setDuration] = useState(4);
    const [provider, setProvider] = useState<'luma' | 'sora' | 'veo'>('sora');
    const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedVideos, setGeneratedVideos] = useState<any[]>([]);
    const [generatedImages, setGeneratedImages] = useState<any[]>([]);
    const [batchId, setBatchId] = useState<string | null>(null);

    // Generation Mode
    const [generationMode, setGenerationMode] = useState<'video' | 'image'>('video');
    const [soraMode, setSoraMode] = useState<'text-to-video' | 'image-to-video'>('text-to-video');
    const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [generationStatus, setGenerationStatus] = useState<string>('idle');
    const [generationProgress, setGenerationProgress] = useState<number>(0);
    const [pollingActive, setPollingActive] = useState(false);

    // Helper & Multi-image State
    const [showMarketingHelper, setShowMarketingHelper] = useState(true);
    const [detectedMultipleFiles, setDetectedMultipleFiles] = useState<File[]>([]);

    useEffect(() => {
        const helperDismissed = localStorage.getItem('marketingHelperDismissed');
        if (helperDismissed === 'true') setShowMarketingHelper(false);
    }, []);

    // Influencer Bridge State
    const [selectedInfluencerId, setSelectedInfluencerId] = useState<string | null>(null);
    const [selectedInfluencerName, setSelectedInfluencerName] = useState<string | null>(null);
    const [selectedSourceType, setSelectedSourceType] = useState<'image' | 'influencer' | 'fused-image' | null>(null);

    // Image Settings
    const [imageCount, setImageCount] = useState(1);
    const [imageResolution, setImageResolution] = useState<'1024x1024' | '1792x1024'>('1024x1024');
    const [imageQuality, setImageQuality] = useState<'standard' | 'hd'>('standard');

    // Preview Mode State
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

    // New State for Audio & Subtitles
    const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('bold');
    const [subtitlePosition, setSubtitlePosition] = useState<SubtitlePosition>('center');
    const [subtitleSize, setSubtitleSize] = useState(32);
    const [musicTrack, setMusicTrack] = useState<string | null>(null);
    const [musicUrl, setMusicUrl] = useState<string | null>(null);
    const [videoStyle, setVideoStyle] = useState<VideoStyle>('cinematic');
    const [showSubtitles, setShowSubtitles] = useState(true);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Advanced Kling Features
    const [selectedTailImage, setSelectedTailImage] = useState<string | null>(null);
    const [cameraConfig, setCameraConfig] = useState({
        type: 'simple',
        horizontal: 0,
        vertical: 0,
        pan: 0,
        tilt: 0,
        roll: 0,
        zoom: 0
    });
    const [showCameraOptions, setShowCameraOptions] = useState(false);

    // STT Hook
    const [promptBeforeSpeech, setPromptBeforeSpeech] = useState('');
    const { isListening, transcript, toggleListening, error: sttError } = useSpeechToText({ lang: 'fr-FR' });

    // Ref for scrolling to top
    const topRef = useRef<HTMLDivElement>(null);

    const scrollToResults = () => {
        // Small delay to ensure the UI has updated (e.g. loading state / results are rendering)
        requestAnimationFrame(() => {
            if (typeof window !== 'undefined' && window.innerWidth > 768) {
                topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    };

    // Factorized clearing logic
    const clearInfluencerReference = () => {
        setSelectedImageForVideo(null);
        setSelectedImageId(null);
        setSelectedInfluencerId(null);
        setSelectedInfluencerName(null);
        setSelectedSourceType(null);
    };

    useEffect(() => {
        if (isListening) {
            setPromptText(promptBeforeSpeech + (promptBeforeSpeech && transcript ? ' ' : '') + transcript);
        }
    }, [transcript, isListening, promptBeforeSpeech]);

    const handleSpeech = () => {
        if (!isListening) {
            setPromptBeforeSpeech(promptText);
        }
        toggleListening();
    };

    // Fetch available providers on mount
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const response = await getAvailableProviders();
                setAvailableProviders(response.providers || []);
            } catch (err) {
                console.error('Failed to fetch providers:', err);
            }
        };
        fetchProviders();
    }, []);

    // Read initial prompt from localStorage (set by landing page Quick Generate)
    useEffect(() => {
        const initialPrompt = localStorage.getItem('initialPrompt');
        if (initialPrompt) {
            setPromptText(initialPrompt);
            localStorage.removeItem('initialPrompt'); // Clear after reading
        }
        if (initialPrompt) {
            setPromptText(initialPrompt);
            localStorage.removeItem('initialPrompt'); // Clear after reading
        }
    }, []);

    // Handle image param from URL (?image=...) — fired when coming from PhotoCard "Animer" button
    const searchParams = useSearchParams();
    useEffect(() => {
        // 1. Influencer Bridge Priority - VIDEO
        const animateSourceType = sessionStorage.getItem('animateSourceType');
        const animateInfluencerId = sessionStorage.getItem('animateInfluencerId');
        const animateInfluencerName = sessionStorage.getItem('animateInfluencerName');
        const animateInfluencerImageUrl = sessionStorage.getItem('animateInfluencerImageUrl');

        if (animateSourceType === 'influencer' && animateInfluencerId) {
            setSelectedInfluencerId(animateInfluencerId);
            setSelectedInfluencerName(animateInfluencerName);
            setSelectedSourceType('influencer');
            setSelectedImageForVideo(animateInfluencerImageUrl);
            setGenerationMode('video');
            setSoraMode('image-to-video');
            setProvider('sora');
            if (duration > 12) setDuration(4);
            setPromptText('');

            // Clean up
            sessionStorage.removeItem('animateSourceType');
            sessionStorage.removeItem('animateInfluencerId');
            sessionStorage.removeItem('animateInfluencerName');
            sessionStorage.removeItem('animateInfluencerImageUrl');
            return;
        }

        // 2. Influencer Bridge Priority - IMAGE
        const modeParam = searchParams.get('mode');
        const sourceParam = searchParams.get('source');

        const generateSourceType = sessionStorage.getItem('generateSourceType');
        const generateInfluencerId = sessionStorage.getItem('generateInfluencerId');
        const generateInfluencerName = sessionStorage.getItem('generateInfluencerName');
        const generateInfluencerImageUrl = sessionStorage.getItem('generateInfluencerImageUrl');

        if (modeParam === 'image' && sourceParam === 'influencer' && generateSourceType === 'influencer' && generateInfluencerId) {
            if (!generateInfluencerImageUrl) {
                showToast("Impossible de charger l'image de référence de l'influenceur.", 'error');
                // Cleanup even on failure
                sessionStorage.removeItem('generateSourceType');
                sessionStorage.removeItem('generateInfluencerId');
                sessionStorage.removeItem('generateInfluencerName');
                sessionStorage.removeItem('generateInfluencerImageUrl');
                return;
            }

            setSelectedInfluencerId(generateInfluencerId);
            setSelectedInfluencerName(generateInfluencerName);
            setSelectedSourceType('influencer');
            setSelectedImageForVideo(generateInfluencerImageUrl);
            setGenerationMode('image');
            
            // We no longer set predefined text directly in the input field to improve UX
            setPromptText(prev => prev.trim() ? prev : '');
            showToast(`${generateInfluencerName} importé avec succès`, 'success');

            // Clean up
            sessionStorage.removeItem('generateSourceType');
            sessionStorage.removeItem('generateInfluencerId');
            sessionStorage.removeItem('generateInfluencerName');
            sessionStorage.removeItem('generateInfluencerImageUrl');
            return;
        }

        // 3. Standard image-to-video transfer (sessionStorage)
        if (modeParam === 'image-to-video') {
            const storedImageUrl = sessionStorage.getItem('animateImageUrl');
            const storedImageId = sessionStorage.getItem('animateImageId');
            const storedPromptText = sessionStorage.getItem('animatePromptText');
            const sourceType = sessionStorage.getItem('animateSourceType');

            // --- RESTORE CONTEXT ---
            const savedPrompt = sessionStorage.getItem('generateContext_prompt');
            const savedProvider = sessionStorage.getItem('generateContext_provider');
            const savedSoraMode = sessionStorage.getItem('generateContext_soraMode');
            const savedDuration = sessionStorage.getItem('generateContext_duration');
            const savedFormat = sessionStorage.getItem('generateContext_format');
            const savedVideoStyle = sessionStorage.getItem('generateContext_videoStyle');
            const savedSubtitleStyle = sessionStorage.getItem('generateContext_subtitleStyle');
            const savedSubtitlePosition = sessionStorage.getItem('generateContext_subtitlePosition');
            const savedSubtitleSize = sessionStorage.getItem('generateContext_subtitleSize');
            const savedShowSubtitles = sessionStorage.getItem('generateContext_showSubtitles');
            const savedMusicUrl = sessionStorage.getItem('generateContext_musicUrl');
            const savedMusicTrack = sessionStorage.getItem('generateContext_musicTrack');
            const savedCameraConfig = sessionStorage.getItem('generateContext_cameraConfig');

            if (storedImageUrl) {
                setSelectedImageForVideo(storedImageUrl);
                if (storedImageId) setSelectedImageId(storedImageId);
                if (sourceType) setSelectedSourceType(sourceType as 'image' | 'influencer' | 'fused-image');
                
                setGenerationMode('video');
                
                // Use restored values or defaults
                setSoraMode((savedSoraMode as 'text-to-video' | 'image-to-video') || 'image-to-video');
                setProvider((savedProvider as 'luma' | 'sora' | 'veo') || 'sora');
                
                if (savedDuration) setDuration(parseInt(savedDuration, 10));
                else if (duration > 12) setDuration(4);
                
                if (savedFormat) setFormat(savedFormat as 'youtube' | 'short' | 'both');
                if (savedVideoStyle) setVideoStyle(savedVideoStyle as any);
                if (savedSubtitleStyle) setSubtitleStyle(savedSubtitleStyle as any);
                if (savedSubtitlePosition) setSubtitlePosition(savedSubtitlePosition as any);
                if (savedSubtitleSize) setSubtitleSize(parseInt(savedSubtitleSize, 10));
                if (savedShowSubtitles) setShowSubtitles(savedShowSubtitles === 'true');
                if (savedMusicUrl) setMusicUrl(savedMusicUrl);
                if (savedMusicTrack) setMusicTrack(savedMusicTrack);
                if (savedCameraConfig) {
                    try { setCameraConfig(JSON.parse(savedCameraConfig)); } catch (e) {}
                }

                // We keep saved context but remove hardcoded default text to show a visual placeholder
                setPromptText(prev => prev.trim() ? prev : (savedPrompt || storedPromptText || ''));
                
                showToast(sourceType === 'fused-image' ? 'Image fusionnée importée et contexte restauré' : 'Image importée', 'success');
            }

            // --- CLEANUP ---
            sessionStorage.removeItem('animateImageUrl');
            sessionStorage.removeItem('animateImageId');
            sessionStorage.removeItem('animatePromptText');
            sessionStorage.removeItem('animateSourceType');
            
            sessionStorage.removeItem('generateContext_prompt');
            sessionStorage.removeItem('generateContext_provider');
            sessionStorage.removeItem('generateContext_soraMode');
            sessionStorage.removeItem('generateContext_duration');
            sessionStorage.removeItem('generateContext_format');
            sessionStorage.removeItem('generateContext_videoStyle');
            sessionStorage.removeItem('generateContext_subtitleStyle');
            sessionStorage.removeItem('generateContext_subtitlePosition');
            sessionStorage.removeItem('generateContext_subtitleSize');
            sessionStorage.removeItem('generateContext_showSubtitles');
            sessionStorage.removeItem('generateContext_musicUrl');
            sessionStorage.removeItem('generateContext_musicTrack');
            sessionStorage.removeItem('generateContext_cameraConfig');

            return;
        }

        // 4. Legacy URL param fallback
        const imageParam = searchParams.get('image');
        if (imageParam) {
            setSelectedImageForVideo(imageParam);
            setGenerationMode('video');
            setSoraMode('image-to-video');
            setProvider('sora');
            if (duration > 12) setDuration(4);
            setPromptText('');
        }
    }, [searchParams, duration, showToast]); // Proper dependencies

    const getEffectivePrompt = () => {
        if (promptText.trim()) return promptText.trim();
        if (generationMode === 'video' && selectedImageForVideo) {
            return t('generation.animatePrompt') || 'Animate this image smoothly with realistic motion and cinematic lighting.';
        }
        if (generationMode === 'image' && selectedSourceType === 'influencer') {
            return 'Create a new photorealistic image of this influencer in a new scene while preserving identity, face structure, realism, and natural skin details.';
        }
        return '';
    };

    const isGenerationDisabled = () => {
        return loading || (!promptText.trim() && !(generationMode === 'video' && selectedImageForVideo) && !(generationMode === 'image' && selectedSourceType === 'influencer'));
    };

    const handlePreview = async () => {
        const effectivePrompt = getEffectivePrompt();
        if (!effectivePrompt || loading) return;
        setLoading(true);
        setError('');
        
        // Scroll to top to see progress/preview
        scrollToResults();

        // Simulate Preview Generation Time
        setTimeout(() => {
            setLoading(false);
            setIsPreviewMode(true);
            // Set a dummy preview URL or leave null to show a placeholder
            // In a real app, this would be a low-res generation or a frame
        }, 1500);
    };

    const saveGenerateContext = () => {
        sessionStorage.setItem('generateContext_prompt', promptText);
        sessionStorage.setItem('generateContext_provider', provider);
        sessionStorage.setItem('generateContext_soraMode', soraMode);
        sessionStorage.setItem('generateContext_duration', duration.toString());
        sessionStorage.setItem('generateContext_format', format);
        sessionStorage.setItem('generateContext_videoStyle', videoStyle);
        sessionStorage.setItem('generateContext_subtitleStyle', subtitleStyle);
        sessionStorage.setItem('generateContext_subtitlePosition', subtitlePosition);
        sessionStorage.setItem('generateContext_subtitleSize', subtitleSize.toString());
        sessionStorage.setItem('generateContext_showSubtitles', showSubtitles.toString());
        if (musicUrl) sessionStorage.setItem('generateContext_musicUrl', musicUrl);
        if (musicTrack) sessionStorage.setItem('generateContext_musicTrack', musicTrack);
        sessionStorage.setItem('generateContext_cameraConfig', JSON.stringify(cameraConfig));
    };

    const handleFinalGenerate = async () => {
        if (loading) return;
        setError('');
        setLoading(true);
        setGeneratedVideos([]);
        setGeneratedImages([]);

        // Scroll to top to see progress/results
        scrollToResults();

        try {
            const effectivePrompt = getEffectivePrompt();

            if (generationMode === 'video') {
                // Append style to prompt
                const enhancedPrompt = `[Style: ${videoStyle}] ${effectivePrompt}`;

                // Resolve Output Config for service
                const getOutputConfig = (fmt: 'youtube' | 'short' | 'both') => {
                    const isShort = fmt === 'short';
                    return {
                        aspectRatio: isShort ? '9:16' as const : '16:9' as const,
                        width: isShort ? 720 : 1280,
                        height: isShort ? 1280 : 720,
                        orientation: isShort ? 'portrait' as const : 'landscape' as const,
                        targetPlatformType: isShort ? 'short-form' as const : 'youtube-long' as const
                    };
                };

                const normalizedSourceType: 'image' | 'influencer' | undefined =
                selectedSourceType === 'influencer'
                    ? 'influencer'
                    : selectedSourceType === 'image' || selectedSourceType === 'fused-image'
                        ? 'image'
                        : selectedImageId || selectedImageForVideo
                            ? 'image'
                            : undefined;

                const options = {
                    subtitleStyle,
                    subtitlePosition,
                    subtitleSize,
                    showSubtitles,
                    musicTrack: musicUrl || musicTrack,
                    videoStyle,
                    image: (provider === 'sora' && soraMode === 'image-to-video') ? (selectedImageId || selectedImageForVideo || undefined) : (selectedImageForVideo || undefined),
                    influencerId: selectedSourceType === 'influencer' ? (selectedInfluencerId || undefined) : undefined,
                    sourceType: normalizedSourceType,
                    preserveIdentity: selectedSourceType === 'influencer',
                    preservePhotorealism: selectedSourceType === 'influencer',
                    preserveFace: selectedSourceType === 'influencer',
                    noStyleTransformation: selectedSourceType === 'influencer',
                    imageTail: selectedTailImage || undefined,
                    cameraControl: (cameraConfig.type === 'simple' && Object.entries(cameraConfig).some(([k, v]) => k !== 'type' && v !== 0))
                        ? {
                            type: 'simple',
                            config: Object.fromEntries(
                                Object.entries(cameraConfig).filter(([k, v]) => k !== 'type' && v !== 0)
                            )
                        }
                        : undefined,
                    outputConfig: format !== 'both' ? getOutputConfig(format) : undefined
                };

                const response = await generateVideo(
                    enhancedPrompt,
                    format,
                    variants,
                    provider,
                    options,
                    duration
                );
                setGeneratedVideos(response.videos || []);
                setBatchId(response.batchId || null);

                // Redirect to dashboard immediately — progress is tracked there via VideoCard polling
                router.push('/dashboard');

            } else {
                // Image Generation
                const isInfluencerSource = selectedSourceType === 'influencer';
                const response = await generateImage(
                    effectivePrompt,
                    imageResolution,
                    'cinematic',
                    imageCount,
                    'banana',
                    imageQuality,
                    isInfluencerSource ? (selectedInfluencerId || undefined) : undefined,
                    isInfluencerSource ? (selectedImageForVideo || undefined) : undefined,
                    isInfluencerSource
                );

                console.log(`[IMAGE GEN] Response received:`, response);

                if (response.processing && response.imageIds) {
                    // ASYNC MODE (Heroku Anti-Timeout)
                    const placeholderImages = response.imageIds.map((id: string) => ({
                        id,
                        _id: id,
                        status: 'processing',
                        promptText: effectivePrompt,
                        resolution: imageResolution,
                        createdAt: new Date().toISOString()
                    }));
                    
                    setGeneratedImages(placeholderImages);
                    setLoading(false); // We stop the main full-screen loader
                    
                    // Start polling for the first one (or all if we want to track individually)
                    // For UI simplicity, we poll the first one to drive the main progress bar
                    if (response.imageIds.length > 0) {
                        startImagePolling(response.imageIds[0], pollingCancelRef.current);
                    }
                } else if (response.images) {
                    // DIRECT MODE
                    setGeneratedImages(response.images);
                    setLoading(false);
                } else if (response.image) {
                    // DIRECT MODE (Single)
                    setGeneratedImages([response.image]);
                    setLoading(false);
                }
            }
        } catch (err: any) {
            console.error('GENERATE ERROR:', err);

            const apiError = err.response?.data;
            if (apiError?.requiresSubscription) {
                setError(t('errors.subscriptionRequired'));
            } else if (apiError?.creditsNeeded !== undefined) {
                setError(t('errors.insufficientCredits', {
                    needed: apiError.creditsNeeded,
                    available: apiError.creditsAvailable
                }));
            } else {
                setError(apiError?.message || err.message || t('errors.failedToGenerate'));
            }
        } finally {
            setLoading(false);
        }
    };

    const startPolling = async (videoId: string, cancelRef: { cancelled: boolean }) => {
        setPollingActive(true);
        setGenerationStatus('processing');

        const poll = async () => {
            if (cancelRef.cancelled) return; // Stop if component unmounted or user navigated away
            try {
                const data = await getVideoStatus(videoId);
                if (cancelRef.cancelled) return;
                const status = (data.status || '').toLowerCase();
                const progress = data.progress || 0;

                setGenerationStatus(status);
                setGenerationProgress(progress);

                if (status === 'generated' || status === 'success' || status === 'completed') {
                    setPollingActive(false);
                    setLoading(false);
                    return;
                }

                if (status === 'failed' || status === 'error') {
                    setPollingActive(false);
                    setLoading(false);
                    setError(data.lastError || 'Generation failed');
                    return;
                }

                // Poll again after 5 seconds
                setTimeout(poll, 5000);
            } catch (err) {
                if (cancelRef.cancelled) return;
                console.error('Polling error:', err);
                setPollingActive(false);
                setLoading(false);
            }
        };

        poll();
    };

    const startImagePolling = async (imageId: string, cancelRef: { cancelled: boolean }) => {
        setPollingActive(true);
        setGenerationStatus('processing');
        setError('');

        const poll = async () => {
            if (cancelRef.cancelled) return;
            try {
                const data = await checkImageStatus(imageId);
                if (cancelRef.cancelled) return;
                
                const status = (data.status || '').toLowerCase();
                const progress = data.progress || 0;

                setGenerationStatus(status);
                setGenerationProgress(progress);

                if (status === 'completed' || status === 'generated' || status === 'success') {
                    setPollingActive(false);
                    setLoading(false);
                    
                    // Update the specific image in the results list
                    setGeneratedImages(prev => prev.map(img => 
                        (img.id === imageId || img._id === imageId) 
                        ? { ...img, ...data, status: 'generated' } 
                        : img
                    ));
                    
                    showToast(t('generation.imageSuccess') || 'Image générée avec succès !', 'success');
                    return;
                }

                if (status === 'failed' || status === 'error') {
                    setPollingActive(false);
                    setLoading(false);
                    const msg = data.errorMessage || 'La génération a échoué';
                    setError(msg);
                    showToast(msg, 'error');
                    
                    // Update status to failed in the list
                    setGeneratedImages(prev => prev.map(img => 
                        (img.id === imageId || img._id === imageId) 
                        ? { ...img, status: 'failed', errorMessage: msg } 
                        : img
                    ));
                    return;
                }

                // Poll again after 3 seconds for images (usually faster than video)
                setTimeout(poll, 3000);
            } catch (err) {
                if (cancelRef.cancelled) return;
                console.error('Image polling error:', err);
                // Don't stop on single error, retry once more
                setTimeout(poll, 5000);
            }
        };

        poll();
    };

    // Cancel polling on unmount (prevents memory leak / requests after navigation)
    const pollingCancelRef = useRef({ cancelled: false });
    useEffect(() => {
        return () => { pollingCancelRef.current.cancelled = true; };
    }, []);

    const handleAnimateImage = (imageUrl: string) => {
        setSelectedImageForVideo(imageUrl);
        setGenerationMode('video');
        setPromptText('');
        // Scroll to top
        scrollToResults();
    };

    const handleDownload = (imageUrl: string, promptText: string) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `maveed-${promptText ? promptText.slice(0, 20).replace(/\s+/g, '-') : 'generated'}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalVideos = format === 'both' ? variants * 2 : variants;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50/50" ref={topRef}>
                <Navbar />

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* Header */}
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100/50 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-[#e2a9f1] rounded-full animate-pulse"></span>
                            <span className="text-sm text-gray-600 font-bold tracking-wide uppercase">{t('generation.title')}</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                            {t('generation.videoPrefix')} <span className="bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">
                                {generationMode === 'video' ? t('generation.videoTitle') : t('generation.imageTitle')}
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            {generationMode === 'video'
                                ? t('generation.videoSubtitle')
                                : t('generation.imageSubtitle')}
                        </p>

                        {/* Mode Switcher */}
                        <div className="mt-8 flex justify-center">
                            <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm inline-flex">
                                <button
                                    onClick={() => { setGenerationMode('video'); setSelectedImageForVideo(null); }}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${generationMode === 'video'
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {t('generation.modeVideo')}
                                </button>
                                <button
                                    onClick={() => setGenerationMode('image')}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${generationMode === 'image'
                                        ? 'bg-gray-900 text-white shadow-lg'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {t('generation.modeImage')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* LEFT COLUMN: Main Inputs */}
                        <div className="xl:col-span-7 space-y-8">
                            {/* Polling / Status Display */}
                            {pollingActive && (
                                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-purple-100 shadow-xl animate-in zoom-in duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center animate-pulse">
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            </div>
                                            <div>
                                                <p className="font-black text-gray-900 uppercase tracking-tight">Génération en cours...</p>
                                                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{provider} • {soraMode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-900">{generationProgress}%</p>
                                        </div>
                                    </div>

                                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${generationProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter text-center">Ne fermez pas cette page pour voir le résultat</p>
                                </div>
                            )}

                            {/* Sora Mode Selection */}
                            {generationMode === 'video' && provider === 'sora' && (
                                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setSoraMode('text-to-video')}
                                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${soraMode === 'text-to-video' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-50 hover:border-gray-200 text-gray-500'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${soraMode === 'text-to-video' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <VideoIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm uppercase leading-none mb-1">Text-to-Video</p>
                                            <p className="text-[10px] opacity-70">Générer à partir d'un prompt</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSoraMode('image-to-video')}
                                        className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${soraMode === 'image-to-video' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-50 hover:border-gray-200 text-gray-500'}`}
                                    >
                                        <div className={`p-2 rounded-lg ${soraMode === 'image-to-video' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-sm uppercase leading-none mb-1">Image-to-Video</p>
                                            <p className="text-[10px] opacity-70">Animer une image existante</p>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* 1. Prompt & Format Section */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow space-y-8">
                                <PromptCoach promptText={promptText} onPromptChange={setPromptText} />
                                <PromptHelper promptText={promptText} onPromptChange={setPromptText} />
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                            {t('generation.describeStep', { mode: generationMode === 'video' ? t('generation.modeLabelVideo') : t('generation.modeLabelImage') })}
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSpeech}
                                            className={`p-2 rounded-full transition-all ${isListening
                                                ? 'bg-red-100 text-red-600 animate-pulse'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                            title={t('generation.voiceTooltip')}
                                        >
                                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {selectedImageForVideo && generationMode === 'video' && provider !== 'sora' && (
                                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                <img src={selectedImageForVideo} alt="Source" className="w-16 h-16 rounded-lg object-cover border border-purple-200" />
                                                <div>
                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">{t('generation.imageSource')}</span>
                                                    <span className="text-sm text-gray-700 font-medium">{t('generation.imageSourceDesc')}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedImageForVideo(null)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    {/* Sora Image Picker */}
                                    {generationMode === 'video' && provider === 'sora' && soraMode === 'image-to-video' && (
                                        <div className="space-y-4 mb-6">
                                            {/* Premium Marketing Helper Card */}
                                            {showMarketingHelper && detectedMultipleFiles.length <= 1 && !selectedImageForVideo && (
                                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-6 shadow-sm mb-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                                                            <Sparkles className="w-6 h-6 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-black text-gray-900 mb-1">Créer une vidéo produit à partir de plusieurs images ?</h3>
                                                            <p className="text-sm text-gray-600 mb-4">Combinez d’abord vos visuels en une image marketing cohérente, puis animez-la pour obtenir un meilleur résultat.</p>
                                                            <div className="flex flex-wrap gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        saveGenerateContext();
                                                                        router.push('/image-fusion?source=generate_promo');
                                                                    }}
                                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-purple-600/20"
                                                                >
                                                                    Fusionner mes images
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setShowMarketingHelper(false);
                                                                        localStorage.setItem('marketingHelperDismissed', 'true');
                                                                    }}
                                                                    className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl transition-colors border border-gray-200"
                                                                >
                                                                    Continuer avec une seule image
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contextual Warning for Multiple Files */}
                                            {detectedMultipleFiles.length > 1 && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                            <Layers className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">Plusieurs images détectées.</p>
                                                            <p className="text-xs text-gray-600">Pour une vidéo produit plus cohérente, fusionnez-les d’abord.</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            saveGenerateContext();
                                                            router.push('/image-fusion?source=generate_promo');
                                                        }}
                                                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors whitespace-nowrap"
                                                    >
                                                        Fusionner maintenant
                                                    </button>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    Image Initiale
                                                </label>
                                                {selectedImageForVideo && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { 
                                                            setSelectedImageForVideo(null); 
                                                            setSelectedImageId(null);
                                                            setSelectedInfluencerId(null);
                                                            setSelectedInfluencerName(null);
                                                            setSelectedSourceType(null);
                                                        }}
                                                        className="text-xs font-bold text-red-500 hover:underline"
                                                    >
                                                        Réinitialiser
                                                    </button>
                                                )}
                                            </div>

                                            {selectedImageForVideo ? (
                                                <div className="relative group aspect-video rounded-3xl overflow-hidden border-2 border-purple-200 shadow-md">
                                                    <img src={selectedImageForVideo} alt="Selected" className="w-full h-full object-cover" />
                                                    
                                                    {selectedSourceType === 'influencer' && (
                                                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 backdrop-blur-md rounded-full shadow-lg border border-white/20">
                                                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                                                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                                                                    Identity Lock Active
                                                                </span>
                                                            </div>
                                                            <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10 flex items-center gap-2">
                                                                <span className="text-[9px] font-medium text-white/90">
                                                                    {selectedInfluencerName || 'Influencer'} locked. Physical identity stays identical. 
                                                                </span>
                                                                <span className="text-[8px] text-blue-400 font-bold uppercase tracking-tighter">Cultural-Ready</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={clearInfluencerReference}
                                                            className="bg-white text-gray-900 font-bold px-4 py-2 rounded-xl text-sm"
                                                        >
                                                            Changer d'image
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div 
                                                    className={`bg-gray-50 border-2 border-dashed ${detectedMultipleFiles.length > 1 ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'} rounded-3xl p-6 transition-colors`}
                                                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                    onDrop={(e) => {
                                                        e.preventDefault(); e.stopPropagation();
                                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 1) {
                                                            setDetectedMultipleFiles(Array.from(e.dataTransfer.files));
                                                        } else if (e.dataTransfer.files && e.dataTransfer.files.length === 1) {
                                                            setDetectedMultipleFiles([]);
                                                        }
                                                    }}
                                                >
                                                    <ImagePicker
                                                        selectedImageId={selectedImageId}
                                                        onSelect={(img) => {
                                                            setSelectedImageId(img.id);
                                                            setSelectedImageForVideo(img.url);
                                                            setDetectedMultipleFiles([]);
                                                            if (img.sourceType === 'influencer' && img.influencerId) {
                                                                setSelectedSourceType('influencer');
                                                                setSelectedInfluencerId(img.influencerId);
                                                                setSelectedInfluencerName(img.influencerName || 'Influenceur');
                                                            } else {
                                                                setSelectedSourceType(img.sourceType as any || 'image');
                                                                setSelectedInfluencerId(null);
                                                                setSelectedInfluencerName(null);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Influencer Reference Card for IMAGE Mode */}
                                    {generationMode === 'image' && selectedSourceType === 'influencer' && selectedImageForVideo && (
                                        <div className="bg-white p-6 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm mb-6 animate-in slide-in-from-top duration-500">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-50 shadow-md">
                                                        <img src={selectedImageForVideo} alt="Reference" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-indigo-500/10" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="px-2 py-0.5 bg-indigo-600 rounded-md">
                                                                <span className="text-[9px] font-black text-white uppercase tracking-wider">Influencer Reference</span>
                                                            </div>
                                                            <span className="text-sm font-black text-gray-900">{selectedInfluencerName || 'Influenceur'}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-medium max-w-xs">
                                                            Le prompt décrira une nouvelle scène, mais l’identité visuelle sera conservée comme référence.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={clearInfluencerReference}
                                                    className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 transition-all group"
                                                    title="Réinitialiser"
                                                >
                                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <textarea
                                            value={promptText}
                                            onChange={(e) => setPromptText(e.target.value)}
                                            placeholder={
                                                selectedImageForVideo && generationMode === 'video'
                                                    ? (t('generation.animatePrompt') || 'Animer cette image de manière cinématographique...')
                                                    : selectedSourceType === 'influencer' && generationMode === 'image'
                                                        ? 'Ex: Influenceur marchant dans les rues de Tokyo...'
                                                        : generationMode === 'video'
                                                            ? t('generation.placeholderVideo')
                                                            : t('generation.placeholderImage')
                                            }
                                            className={`w-full px-6 py-5 bg-gray-50 border ${isListening ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-200'} rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-lg leading-relaxed min-h-[160px]`}
                                            required
                                            disabled={loading || isPreviewMode}
                                        />
                                        {isListening && (
                                            <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-bold text-red-500 animate-pulse">
                                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                ENREGISTREMENT...
                                            </div>
                                        )}
                                        {/* Tooltip hint on hover */}
                                        <div className="absolute top-4 right-4 text-gray-400 group-hover:text-indigo-400 opacity-0 hover:opacity-100 transition-opacity cursor-help" title="Avoid real names. Describe appearance instead.">
                                           <Sparkles className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {generationMode === 'video' ? (
                                    <>
                                        <FormatSelector selectedFormat={format} onFormatChange={setFormat} />

                                        {/* Format Preview Section */}
                                        <div className="mt-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col items-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Aperçu du cadrage (Orientation)</p>
                                            <div className="flex items-center justify-center gap-8 w-full py-4">
                                                {(format === 'youtube' || format === 'both') && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-48 aspect-video bg-white rounded-xl border-2 border-blue-200 shadow-sm flex items-center justify-center relative group overflow-hidden">
                                                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                                <VideoIcon className="w-6 h-6 text-blue-500 opacity-30" />
                                                                <span className="text-[10px] font-black text-blue-600 uppercase">16:9 Landscape</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500">1280 x 720</span>
                                                    </div>
                                                )}
                                                {(format === 'short' || format === 'both') && (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-24 aspect-[9/16] bg-white rounded-xl border-2 border-purple-200 shadow-sm flex items-center justify-center relative group overflow-hidden">
                                                            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                                                            <div className="relative z-10 flex flex-col items-center gap-2">
                                                                <ImageIcon className="w-6 h-6 text-purple-500 opacity-30" />
                                                                <span className="text-[10px] font-black text-purple-600 uppercase rotate-90 whitespace-nowrap">9:16 Portrait</span>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500">720 x 1280</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                        {t('generation.variants')}
                                                    </label>
                                                    <span className="px-3 py-1 bg-blue-600 text-white font-black rounded-lg text-sm">{variants}</span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={variants}
                                                    onChange={(e) => setVariants(parseInt(e.target.value) || 1)}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    disabled={loading || isPreviewMode}
                                                />
                                                <p className="text-[10px] text-gray-400 font-medium italic">{t('generation.variantsDesc')}</p>
                                            </div>

                                            {/* Duration Slider - Dynamic based on provider */}
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                        {t('generation.duration')}
                                                    </label>
                                                    <span className="px-3 py-1 bg-purple-600 text-white font-black rounded-lg text-sm">{duration}s</span>
                                                </div>

                                                {provider === 'sora' ? (
                                                    /* Sora specific duration: 4, 8, 12 */
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {[4, 8, 12].map((d) => (
                                                            <button
                                                                key={d}
                                                                type="button"
                                                                onClick={() => setDuration(d)}
                                                                className={`py-2 rounded-xl font-bold text-sm transition-all border-2 ${duration === d ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-100 hover:border-purple-200'}`}
                                                            >
                                                                {d}s
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    /* Standard duration slider */
                                                    <input
                                                        type="range"
                                                        min="5"
                                                        max="30"
                                                        step="5"
                                                        value={duration}
                                                        onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                        disabled={loading || isPreviewMode}
                                                    />
                                                )}
                                                <p className="text-[10px] text-gray-400 font-medium italic">
                                                    {provider === 'sora' ? "Sora supporte uniquement 4, 8 ou 12 secondes." : t('generation.durationNote')}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* Image Generation Options */
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                {t('generation.format')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setImageResolution('1024x1024')}
                                                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${imageResolution === '1024x1024' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                                                        }`}
                                                >
                                                    {t('generation.formatSquare')}
                                                </button>
                                                <button
                                                    onClick={() => setImageResolution('1792x1024')}
                                                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${imageResolution === '1792x1024' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                                                        }`}
                                                >
                                                    {t('generation.formatLandscape')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                {t('generation.quality')}
                                            </label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={() => setImageQuality('standard')}
                                                    className={`p-3 rounded-xl border font-bold text-sm transition-all ${imageQuality === 'standard' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'
                                                        }`}
                                                >
                                                    {t('generation.qualityStandard')}
                                                </button>
                                                <button
                                                    onClick={() => setImageQuality('hd')}
                                                    className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${imageQuality === 'hd' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'
                                                        }`}
                                                >
                                                    <span>{t('generation.qualityHD')}</span>
                                                    <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded uppercase tracking-wider">PRO</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                                    {t('generation.imageCount')}
                                                </label>
                                                <span className="px-3 py-1 bg-blue-600 text-white font-black rounded-lg text-sm">{imageCount}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="1"
                                                max="4"
                                                value={imageCount}
                                                onChange={(e) => setImageCount(parseInt(e.target.value) || 1)}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Advanced Options Toggle */}
                            {generationMode === 'video' && (
                                <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{t('generation.advanced.title')}</h3>
                                            <p className="text-sm text-gray-500">{t('generation.advanced.subtitle')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                            className={`w-14 h-8 rounded-full transition-colors relative ${showAdvancedOptions ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform transform ${showAdvancedOptions ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {/* Provider Selection */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
                                            {t('generation.providers.title')}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProvider('sora');
                                                    if (![4, 8, 12].includes(duration)) setDuration(4);
                                                }}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${provider === 'sora' ? 'border-purple-500 bg-purple-50/50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-lg">{t('generation.providers.sora.name')}</span>
                                                        <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">NEW</span>
                                                    </div>
                                                    {provider === 'sora' && <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm">✓</div>}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                    {t('generation.providers.sora.description')}
                                                </p>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setProvider('veo');
                                                    if (![4, 8, 12].includes(duration)) setDuration(4);
                                                }}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${provider === 'veo' ? 'border-blue-500 bg-blue-50/50 shadow-lg' : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-lg">Veo (Google)</span>
                                                        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">NEW</span>
                                                    </div>
                                                    {provider === 'veo' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm">✓</div>}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                                    La génération vidéo dernier cri de Google DeepMind.
                                                </p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Conditional Music & Style Selectors */}
                                    {showAdvancedOptions && (
                                        <div className="mt-8 space-y-8 animate-in slide-in-from-top-4 fade-in duration-300">
                                            {/* Music Selection */}
                                            <div className="pt-6 border-t border-gray-100">
                                                <MusicSelector
                                                    selectedTrackId={musicTrack}
                                                    onSelect={(track) => {
                                                        setMusicTrack(track.id);
                                                        setMusicUrl(track.previewUrl);
                                                    }}
                                                />
                                            </div>

                                            {/* Visual Style Selection */}
                                            <div className="pt-6 border-t border-gray-100">
                                                <StyleSelector selectedStyle={videoStyle} onSelect={setVideoStyle} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Subtitles & Preview */}
                        <div className="xl:col-span-5 space-y-8">
                            {/* Preview Window in Preview Mode */}
                            {isPreviewMode && (
                                <div className="bg-white p-2 rounded-[2.5rem] border-4 border-[#e2a9f1] shadow-2xl animate-in zoom-in-95 duration-300">
                                    <div className="bg-gray-900 rounded-[2rem] h-[400px] flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                            <span className="text-4xl mb-4">🎬</span>
                                            <p className="font-bold text-lg">{t('generation.previewGenerated')}</p>
                                            <p className="text-sm opacity-70 px-8 text-center mt-2">{t('generation.previewSimDesc')}</p>
                                        </div>
                                        {/* Subtitle Overlay Mockup */}
                                        {showSubtitles && (
                                            <div className="absolute bottom-10 left-0 right-0 text-center">
                                                <span className={`px-4 py-2 ${subtitleStyle === 'bold' ? 'font-black bg-black/50' : 'font-medium'} text-white rounded-lg`} style={{ fontSize: `${subtitleSize / 2}px` }}>
                                                    {t('generation.subtitlePlaceholder')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex gap-3">
                                        <button
                                            onClick={() => setIsPreviewMode(false)}
                                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                        >
                                            {t('generation.edit')}
                                        </button>
                                        <button
                                            onClick={handleFinalGenerate}
                                            disabled={loading}
                                            className="flex-[2] py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : t('generation.launchProduction')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {generationMode === 'video' ? (
                                /* Video Preview & Right Column */
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow sticky top-24">
                                    <div className="flex items-center justify-between mb-6">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                                            {t('generation.subtitleStudio')}
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-500">{t('generation.enable')}</span>
                                            <button
                                                type="button"
                                                onClick={() => setShowSubtitles(!showSubtitles)}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${showSubtitles ? 'bg-purple-600' : 'bg-gray-300'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${showSubtitles ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {showSubtitles && (
                                        <SubtitleStudio
                                            style={subtitleStyle}
                                            position={subtitlePosition}
                                            onStyleChange={setSubtitleStyle}
                                            onPositionChange={setSubtitlePosition}
                                            fontSize={subtitleSize}
                                            onFontSizeChange={setSubtitleSize}
                                            previewMediaUrl={selectedImageForVideo}
                                            previewText={promptText}
                                        />
                                    )}
                                </div>
                            ) : (
                                /* Image Results Preview */
                                <div className="space-y-6 sticky top-24">
                                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-900 mb-6">{t('generation.results')}</h3>
                                        {loading && generationMode === 'image' ? (
                                            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white">
                                                <PremiumLoading stage={t('generation.creativeStage')} subtext="Maveed Vision Engine" />
                                            </div>
                                        ) : generatedImages.length > 0 ? (
                                            <div className="space-y-6">
                                                {generatedImages.map((img, idx) => (
                                                    <div key={idx} className="group relative rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100">
                                                        <img src={img.url || img.imageUrl} alt="Generated" className="w-full h-auto object-cover" />

                                                        {/* Hover Overlay */}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4">
                                                            <button
                                                                onClick={() => handleAnimateImage(img.url || img.imageUrl)}
                                                                className="bg-white text-gray-900 font-bold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                                            >
                                                                <span>🎥</span> {t('generation.animateImage')}
                                                            </button>

                                                            <button
                                                                onClick={() => handleDownload(img.url || img.imageUrl, img.promptText || promptText)}
                                                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold px-6 py-2 rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                                                            >
                                                                <Download className="w-4 h-4" /> {t('generation.download')}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                                <span className="text-4xl text-gray-300 mb-3 block">🖼️</span>
                                                <p className="text-gray-400 font-medium">{t('generation.emptyImages')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {/* Generation Summary Card */}
                            {generationMode === 'video' && (
                                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('generation.summary')}</h3>
                                        <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{provider} • {duration}s</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">
                                                {format === 'youtube' ? '📺' : format === 'short' ? '📱' : '🚀'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuration Format</p>
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {format === 'youtube' ? 'YouTube 16:9' : format === 'short' ? 'Shorts / TikTok 9:16' : 'Pack Viral (Dual)'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg font-black text-blue-600">
                                                {totalVideos}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sorties Prévues</p>
                                                <p className="font-bold text-gray-900 text-sm">
                                                    {variants} {variants > 1 ? 'Variantes' : 'Variante'} {format === 'both' ? 'x 2 formats' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Coût estimé</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                    {totalVideos * (provider === 'sora' ? Math.ceil(duration / 4) : (duration <= 5 ? 1 : 2))}
                                                </span>
                                                <span className="text-sm font-bold text-gray-500">crédits</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Génération {soraMode === 'image-to-video' ? 'I2V' : 'T2V'}</p>
                                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">IA Premium Optimisée</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* BOTTOM BAR: Action Button (Only show if NOT in preview mode) */}
                        {!isPreviewMode && (
                            <div className="xl:col-span-12 sticky bottom-6 z-40">
                                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[2rem] border border-gray-200 shadow-2xl max-w-2xl mx-auto flex items-center justify-between gap-4">
                                    <div className="hidden sm:block pl-4">
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('generation.summary')}</p>
                                        <p className="font-black text-gray-900">
                                            {generationMode === 'video' ? (
                                                <>{totalVideos} {t('generation.videoTitle')} • {format === 'both' ? t('generation.packViral') : format === 'youtube' ? 'YouTube' : 'Shorts'} • {t('generation.cost')}: {totalVideos * (duration === 5 ? 15 : duration === 15 ? 40 : 30)} crédits</>
                                            ) : (
                                                <>{imageCount} Image(s) • {imageResolution.replace('x', ' × ')} • {t('generation.cost')}: {imageCount * 2} crédits</>
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => generationMode === 'video' ? handlePreview() : handleFinalGenerate()}
                                        disabled={isGenerationDisabled()}
                                        className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 hover:-translate-y-1"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center space-x-3">
                                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>{t('generation.recording')}</span>
                                            </span>
                                        ) : (
                                            generationMode === 'video' ? t('generation.previewButton') : t('generation.generateImageButton')
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold animate-shake text-center max-w-2xl mx-auto">
                            ⚠️ {error}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </ProtectedRoute>
    );
}

export default function GeneratePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <GenerateContent />
        </Suspense>
    );
}
