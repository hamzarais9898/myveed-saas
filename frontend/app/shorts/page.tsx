'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { analyzeYouTubeVideo, getCaptionStyles, generateShort } from '@/services/shortsService';
import { getCurrentSubscription } from '@/services/subscriptionService';
import MusicSelector from '@/components/generation/MusicSelector';
import VideoTrimmer from '@/components/generation/VideoTrimmer';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Youtube, Wand2, Zap, Layout, Music, Type, Check, Play, ChevronRight, X, Info, Mic, Send, Calendar, Trash2, ListChecks, Layers, Plus, Minus, Upload, Video, Globe2 } from 'lucide-react';
import { YouTubeIcon, ShortsIcon, ScheduledIcon, PublishedIcon, MagicWandIcon, TikTokIcon } from '@/components/ModernIcons';
import { useSearchParams } from 'next/navigation';
import PremiumLoading from '@/components/PremiumLoading';
import { useSpeechToText } from '@/hooks/useSpeechToText';

import { Suspense } from 'react';

function ShortsContent() {
    const router = useRouter();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const searchParams = useSearchParams();

    // Form state
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [trimRange, setTrimRange] = useState({ start: 0, end: 60 });
    const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [captionStyle, setCaptionStyle] = useState(1);
    const [language, setLanguage] = useState('fr');
    const [titleText, setTitleText] = useState('');
    const [blurredBackground, setBlurredBackground] = useState(true);
    const [blackBars, setBlackBars] = useState(false);
    const [generationMode, setGenerationMode] = useState<'link' | 'manual' | 'remix'>('link');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isBulk, setIsBulk] = useState(false);

    // STT Hook
    const [promptBeforeSpeech, setPromptBeforeSpeech] = useState('');
    const { isListening, transcript, toggleListening, error: sttError } = useSpeechToText({ lang: 'fr-FR' });

    useEffect(() => {
        if (isListening) {
            setAiPrompt(promptBeforeSpeech + (promptBeforeSpeech && transcript ? ' ' : '') + transcript);
        }
    }, [transcript, isListening, promptBeforeSpeech]);

    useEffect(() => {
        if (sttError === 'not-allowed') {
            showToast("Veuillez autoriser l'accès au micro", "error");
        } else if (sttError) {
            console.error(sttError);
        }
    }, [sttError, showToast]);

    // Remix state
    const [sourceVideo, setSourceVideo] = useState<File | null>(null);
    const [sourceVideoPreview, setSourceVideoPreview] = useState<string | null>(null);
    const [styleVariants, setStyleVariants] = useState<{ id: string, name: string, count: number }[]>([
        { id: '1', name: 'Original Style', count: 10 }
    ]);

    const addStyleVariant = () => {
        setStyleVariants([...styleVariants, { id: Date.now().toString(), name: '', count: 1 }]);
    };

    const removeStyleVariant = (id: string) => {
        if (styleVariants.length > 1) {
            setStyleVariants(styleVariants.filter(v => v.id !== id));
        }
    };

    const updateStyleVariant = (id: string, field: 'name' | 'count', value: any) => {
        setStyleVariants(styleVariants.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    const totalVariants = styleVariants.reduce((acc, v) => acc + v.count, 0);
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSourceVideo(file);
            setSourceVideoPreview(URL.createObjectURL(file));
        }
    };

    // Data state
    const [captionStyles, setCaptionStyles] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<any>(null);

    // UI state
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState<any>(null);

    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'manual' || mode === 'link') {
            setGenerationMode(mode as any);
        }

        const initialPrompt = localStorage.getItem('initialPrompt');
        if (initialPrompt) {
            setAiPrompt(initialPrompt);
            localStorage.removeItem('initialPrompt');
        }

        const initialUrl = localStorage.getItem('initialUrl');
        if (initialUrl) {
            setYoutubeUrl(initialUrl);
            localStorage.removeItem('initialUrl');
        }

        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stylesResponse, subscriptionResponse] = await Promise.all([
                getCaptionStyles(),
                getCurrentSubscription()
            ]);
            setCaptionStyles(stylesResponse.styles || []);
            setSubscription(subscriptionResponse.subscription);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast(t('common.errorLoadingData'), 'error');
        }
    };

    const handleAnalyze = async () => {
        if (!youtubeUrl.trim()) {
            showToast(t('common.error'), 'error');
            return;
        }

        setAnalyzing(true);
        setVideoAnalysis(null);
        setEmbedUrl(null);

        try {
            const response = await analyzeYouTubeVideo(youtubeUrl);
            setVideoAnalysis(response.analysis);
            setLanguage(response.analysis.availableLanguages[0] || 'fr');
            setTrimRange({ start: 0, end: Math.min(60, response.analysis.duration) });

            const videoId = response.analysis.videoId;
            if (videoId) {
                setEmbedUrl(`https://www.youtube.com/embed/${videoId}?rel=0`);
            }
        } catch (err: any) {
            console.error('Analysis error:', err);
            showToast(err.response?.data?.message || t('shorts.errorAnalysis'), 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    // Update Embed URL for Live Trimming Preview
    const getTrimmerEmbedUrl = () => {
        if (!videoAnalysis?.videoId) return embedUrl;
        return `https://www.youtube.com/embed/${videoAnalysis.videoId}?start=${trimRange.start}&end=${trimRange.end}&autoplay=0&rel=0`;
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setGeneratedVideo(null);

        try {
            if (generationMode === 'manual' && !aiPrompt.trim()) {
                showToast("Veuillez entrer un prompt", "warning");
                return;
            }

            // Simulate multi-stage generation for Veo3
            await new Promise(r => setTimeout(r, 1500)); // Analyzing
            await new Promise(r => setTimeout(r, 1500)); // Processing

            if (generationMode === 'remix') {
                showToast(`${totalVariants} variants sauvegardées dans Brouillons !`, "success");
            } else if (isBulk) {
                showToast("10 " + t('shorts.generationMode.bulk') + " sauvegardées dans Brouillons !", "success");
            }

            const mockVideo = {
                videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                id: 'mock_' + Date.now()
            };

            setGeneratedVideo(mockVideo);
            showToast(t('shorts.successGeneration'), 'success');

            const subscriptionResponse = await getCurrentSubscription();
            setSubscription(subscriptionResponse.subscription);
        } catch (err: any) {
            showToast(err.response?.data?.message || t('shorts.errorGeneration'), 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSpeech = () => {
        if (!isListening) {
            setPromptBeforeSpeech(aiPrompt);
        }
        toggleListening();
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#e2a9f1]/30">
                <Navbar />

                {/* Animated Background Elements from Login Page */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/10 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                    <div className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 right-0"></div>
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    {/* Header */}
                    <header className="mb-16 md:mb-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full px-5 py-2 mb-8 backdrop-blur-sm"
                        >
                            <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                            <span className="text-sm font-black text-blue-600 tracking-wider uppercase">{t('shorts.badge')}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl sm:text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter"
                        >
                            {t('shorts.title')} <span className="bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-blue-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">{t('shorts.titleAccent')}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium"
                        >
                            {t('shorts.subtitle')}
                        </motion.p>
                    </header>

                    {/* Dashboard Style Credit Info */}
                    <AnimatePresence>
                        {subscription && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-12"
                            >
                                <div className="group relative bg-white/70 backdrop-blur-2xl border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/5 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            <Zap className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t('shorts.creditsLeft')}</p>
                                            <p className="text-4xl font-black text-gray-900">
                                                {subscription.plan === 'professional' ? '∞' : subscription.remainingCredits}
                                                <span className="text-xs text-gray-400 ml-2 font-bold uppercase tracking-widest">{t('common.credits')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                        <div className="px-6 py-3 bg-white rounded-xl text-sm font-black text-blue-600 shadow-sm border border-blue-100 flex items-center gap-2">
                                            <Check className="w-4 h-4" /> {t('shorts.creditsPerVideo')}
                                        </div>
                                        <Link href="/subscriptions" className="p-3 text-gray-400 hover:text-blue-600 transition-colors">
                                            <ChevronRight className="w-6 h-6" />
                                        </Link>
                                    </div>

                                    {/* Subtle Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-[2.5rem] -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* LEFT: Inputs & Analysis */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* URL / Prompt Input Section */}
                            <motion.div
                                layout
                                className="bg-white/70 backdrop-blur-2xl p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-xl shadow-blue-500/5"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${generationMode === 'link' ? 'bg-red-50 text-red-500' : generationMode === 'manual' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                                            {generationMode === 'link' ? <YouTubeIcon className="w-6 h-6" /> : generationMode === 'manual' ? <Wand2 className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                                            {generationMode === 'link' ? t('shorts.youtubeLink') : generationMode === 'manual' ? t('shorts.generationMode.manual') : t('shorts.generationMode.remix')}
                                        </h3>
                                    </div>

                                    {/* Sub-tabs for mode switch if not fixed from URL */}
                                    <div className="flex flex-wrap sm:flex-nowrap bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100 gap-1 sm:gap-0">
                                        <button
                                            onClick={() => setGenerationMode('link')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${generationMode === 'link' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Lien
                                        </button>
                                        <button
                                            onClick={() => setGenerationMode('manual')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${generationMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Prompt
                                        </button>
                                        <button
                                            onClick={() => setGenerationMode('remix')}
                                            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${generationMode === 'remix' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            Remix
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-[#c77ddf]/10 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                        {generationMode === 'link' ? (
                                            <div className="relative flex flex-col md:flex-row gap-4">
                                                <input
                                                    type="text"
                                                    value={youtubeUrl}
                                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                                    placeholder={t('shorts.youtubePlaceholder')}
                                                    className="flex-1 px-8 py-6 bg-gray-50/50 border-2 border-gray-100 rounded-[2rem] text-base font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                                />
                                                <button
                                                    onClick={handleAnalyze}
                                                    disabled={analyzing || !youtubeUrl.trim()}
                                                    className="px-10 py-6 bg-sky-500 hover:bg-sky-600 text-white rounded-[2rem] font-black tracking-widest uppercase transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-sky-100 flex items-center justify-center gap-3"
                                                >
                                                    {analyzing ? (
                                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Wand2 className="w-5 h-5 text-blue-400" />
                                                            {t('shorts.analyze')}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ) : generationMode === 'manual' ? (
                                            <div className="relative space-y-4">
                                                <div className="relative">
                                                    <textarea
                                                        value={aiPrompt}
                                                        onChange={(e) => setAiPrompt(e.target.value)}
                                                        placeholder={t('shorts.generationMode.promptPlaceholder')}
                                                        className="w-full px-8 py-8 bg-gray-50/50 border-2 border-gray-100 rounded-[2.5rem] text-base font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 min-h-[150px] resize-none pr-20"
                                                    />
                                                    <button
                                                        onClick={handleSpeech}
                                                        className={`absolute right-6 top-8 p-4 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-100 hover:text-[#c77ddf]'}`}
                                                    >
                                                        <Mic className="w-6 h-6" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between px-4">
                                                    <button
                                                        onClick={() => setIsBulk(!isBulk)}
                                                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 transition-all ${isBulk ? 'bg-purple-500/10 border-purple-500 text-purple-600' : 'bg-gray-50/50 border-gray-100 text-gray-400'}`}
                                                    >
                                                        <Layers className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('shorts.generationMode.bulk')} (10x)</span>
                                                    </button>

                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        <Sparkles className="w-3 h-3 text-[#c77ddf]" />
                                                        Powered by Veo3
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                                {/* Styles & Count Section */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                    {/* LEFT: Upload & Global Count */}
                                                    <div className="space-y-8">
                                                        <div className="relative group/upload">
                                                            <div className="absolute -inset-1 bg-gradient-to-r from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-[2.5rem] blur-xl opacity-0 group-hover/upload:opacity-100 transition-opacity" />
                                                            <label className="relative block w-full aspect-[16/10] rounded-[2.5rem] border-2 border-dashed border-gray-100 hover:border-[#e2a9f1] hover:bg-white transition-all cursor-pointer overflow-hidden shadow-sm group-hover/upload:shadow-xl group-hover/upload:-translate-y-1 duration-500">
                                                                <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                                                                {sourceVideoPreview ? (
                                                                    <div className="relative w-full h-full">
                                                                        <video src={sourceVideoPreview} className="w-full h-full object-cover" />
                                                                        <div className="absolute inset-0 bg-black/20 group-hover/upload:bg-black/10 transition-colors" />
                                                                        <div className="absolute bottom-6 left-6 right-6">
                                                                            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 flex items-center gap-3">
                                                                                <Video className="w-5 h-5 text-white" />
                                                                                <p className="text-[10px] font-black uppercase tracking-widest text-white truncate">{sourceVideo?.name}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                                                                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 group-hover/upload:text-[#c77ddf] group-hover/upload:scale-110 transition-all duration-500 group-hover/upload:bg-white group-hover/upload:shadow-inner">
                                                                            <Upload className="w-10 h-10" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tighter mb-1">{t('shorts.generationMode.videoSource')}</p>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                                                                                {t('shorts.generationMode.uploadText')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </label>
                                                            {sourceVideo && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        setSourceVideo(null);
                                                                        setSourceVideoPreview(null);
                                                                    }}
                                                                    className="absolute top-4 right-4 z-20 bg-white/80 backdrop-blur-md p-2 rounded-full text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Global Remix Count Slider */}
                                                        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm border-b-4 border-b-[#e2a9f1]/20">
                                                            <div className="flex items-center justify-between mb-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#e2a9f1]/30">
                                                                        <Zap className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Remixes</h4>
                                                                        <p className="text-lg font-black text-gray-900 leading-none">Global Control</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-4xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent italic">
                                                                    {Math.max(1, Math.min(10, totalVariants))}
                                                                </div>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="10"
                                                                step="1"
                                                                value={Math.min(10, Math.max(1, totalVariants))}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    // Update the first variant or redistribute if needed
                                                                    if (styleVariants.length === 1) {
                                                                        updateStyleVariant(styleVariants[0].id, 'count', val);
                                                                    }
                                                                }}
                                                                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
                                                            />
                                                            <div className="flex justify-between mt-3 px-1 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                                <span>1 Video</span>
                                                                <span>10 Videos Max</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* RIGHT: Style Variants */}
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center justify-between mb-8 group/header">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 shadow-xl shadow-sky-100 group-hover/header:rotate-12 transition-transform duration-500">
                                                                    <Globe2 className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
                                                                        {t('shorts.generationMode.styleVariants')}
                                                                    </h4>
                                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cultural Styles</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={addStyleVariant}
                                                                className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-[#c77ddf] shadow-sm hover:bg-[#c77ddf] hover:text-white transition-all duration-300 active:scale-95 group/btn"
                                                            >
                                                                <Plus className="w-6 h-6 group-hover/btn:rotate-90 transition-transform" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
                                                            <AnimatePresence mode="popLayout">
                                                                {styleVariants.map((variant, index) => (
                                                                    <motion.div
                                                                        layout
                                                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                                                        key={variant.id}
                                                                        className="group/item relative"
                                                                    >
                                                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-[2.5rem] blur-xl opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                                                                        <div className="relative bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
                                                                            {/* Card Header */}
                                                                            <div className="flex items-center justify-between mb-5">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-[#e2a9f1]/20 group-hover/item:scale-110 transition-transform">
                                                                                        {index + 1}
                                                                                    </div>
                                                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variation {index + 1}</span>
                                                                                </div>
                                                                                <button
                                                                                    onClick={() => removeStyleVariant(variant.id)}
                                                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>

                                                                            {/* Input Area */}
                                                                            <div className="mb-6">
                                                                                <input
                                                                                    type="text"
                                                                                    value={variant.name}
                                                                                    onChange={(e) => updateStyleVariant(variant.id, 'name', e.target.value)}
                                                                                    placeholder={t('shorts.generationMode.stylePlaceholder')}
                                                                                    className="w-full bg-gray-50/50 border-2 border-gray-50 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 placeholder:text-gray-200 focus:bg-white focus:border-[#e2a9f1] focus:outline-none transition-all"
                                                                                />
                                                                            </div>

                                                                            {/* Quantity & Stats "En bas tout seul" */}
                                                                            <div className="flex items-center justify-between bg-sky-50 rounded-2xl p-4 text-sky-900 border border-sky-100 group-hover/item:bg-sky-100 transition-colors duration-500">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-200">
                                                                                        <Zap className="w-4 h-4 text-white" />
                                                                                    </div>
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest">{t('shorts.generationMode.bulk')}</span>
                                                                                </div>

                                                                                <div className="flex items-center gap-4">
                                                                                    <button
                                                                                        onClick={() => updateStyleVariant(variant.id, 'count', Math.max(1, variant.count - 1))}
                                                                                        className="w-8 h-8 rounded-lg bg-white border border-sky-100 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                                                                                    >
                                                                                        <Minus className="w-4 h-4" />
                                                                                    </button>
                                                                                    <span className="text-xl font-black tabular-nums min-w-[1.5rem] text-center">{variant.count}</span>
                                                                                    <button
                                                                                        onClick={() => updateStyleVariant(variant.id, 'count', Math.min(10, variant.count + 1))}
                                                                                        className="w-8 h-8 rounded-lg bg-white border border-sky-100 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
                                                                                    >
                                                                                        <Plus className="w-4 h-4" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                ))}
                                                            </AnimatePresence>
                                                        </div>

                                                        {/* Summary Card - Sourced from Login Stats */}
                                                        <div className="relative group/summary mt-4">
                                                            <div className="absolute -inset-1 bg-gradient-to-r from-sky-400 via-blue-500 to-sky-400 rounded-[2.5rem] blur-xl opacity-30 group-hover/summary:opacity-50 group-hover/summary:animate-gradient-x transition-opacity" />
                                                            <div className="relative bg-gradient-to-br from-sky-400 to-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-0 overflow-hidden shadow-2xl">
                                                                <div className="flex items-center gap-6 w-full sm:w-auto">
                                                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 group-hover/summary:rotate-6 transition-transform">
                                                                        <Sparkles className="w-8 h-8 text-white" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-1 leading-none">Total Package</p>
                                                                        <p className="text-3xl font-black tabular-nums">{Math.min(10, totalVariants)} <span className="text-sm font-bold text-sky-100 tracking-normal">Videos</span></p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-center sm:text-right w-full sm:w-auto">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-100 mb-1 leading-none">Cost Projection</p>
                                                                    <p className="text-3xl font-black text-white">~{Math.min(10, totalVariants) * 30}</p>
                                                                </div>

                                                                {/* Sourced Animated Glow from Login */}
                                                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-gradient-to-br from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-full blur-3xl" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Analysis Result & Video Trimmer */}
                            <AnimatePresence>
                                {videoAnalysis && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-blue-500/5 space-y-10"
                                    >
                                        <div className="flex flex-col md:flex-row gap-10">
                                            {/* Preview */}
                                            <div className="flex-1 space-y-6">
                                                <div className="aspect-video w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-black">
                                                    <iframe
                                                        key={`${trimRange.start}-${trimRange.end}`}
                                                        src={getTrimmerEmbedUrl() || ''}
                                                        className="w-full h-full"
                                                        title="YouTube video player"
                                                        frameBorder="0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    ></iframe>
                                                </div>

                                                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                                            <Layout className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('shorts.channel')}</p>
                                                            <p className="text-sm font-black text-gray-900 truncate max-w-[150px]">{videoAnalysis.channel}</p>
                                                        </div>
                                                    </div>
                                                    <div className="h-8 w-px bg-gray-100 mx-4" />
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                                            <Zap className="w-5 h-5 text-yellow-500" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('shorts.languages')}</p>
                                                            <p className="text-sm font-black text-gray-900">{videoAnalysis.availableLanguages?.join(', ') || 'FR'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Trimming Controls */}
                                            <div className="flex-1 space-y-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-lg">1</div>
                                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('shorts.viralMoment')}</h4>
                                                </div>

                                                <VideoTrimmer
                                                    duration={videoAnalysis.duration}
                                                    start={trimRange.start}
                                                    end={trimRange.end}
                                                    onChange={(s, e) => setTrimRange({ start: s, end: e })}
                                                />

                                                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex gap-4">
                                                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                                    <p className="text-xs font-bold text-blue-800 leading-relaxed">
                                                        {t('shorts.trimmerInstruction')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-px bg-gray-100" />

                                        {/* Generation Options */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            {/* Music & Voice */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-black shadow-lg">2</div>
                                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('shorts.style')}</h4>
                                                </div>

                                                <MusicSelector
                                                    selectedTrackId={backgroundMusic}
                                                    onSelect={(id) => setBackgroundMusic(id)}
                                                />
                                            </div>

                                            {/* Captions & Layout */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#c77ddf] text-white flex items-center justify-center text-sm font-black shadow-lg">3</div>
                                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('common.options')}</h4>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="relative group/select">
                                                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/select:text-[#c77ddf] transition-colors" />
                                                        <select
                                                            value={captionStyle}
                                                            onChange={(e) => setCaptionStyle(parseInt(e.target.value))}
                                                            className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl font-black text-gray-900 focus:outline-none focus:border-[#c77ddf] appearance-none"
                                                        >
                                                            <option value={1}>{t('shorts.captionStyles.classic')}</option>
                                                            <option value={2}>{t('shorts.captionStyles.hormozi')}</option>
                                                            <option value={3}>{t('shorts.captionStyles.boxed')}</option>
                                                            <option value={0}>{t('shorts.captionStyles.none')}</option>
                                                        </select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => { setBlurredBackground(!blurredBackground); if (!blurredBackground) setBlackBars(false); }}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${blurredBackground ? 'bg-[#e2a9f1]/10 border-[#e2a9f1] text-[#c77ddf]' : 'bg-gray-50/50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${blurredBackground ? 'bg-[#c77ddf]' : 'bg-gray-300'}`} />
                                                            <span className="text-xs font-black uppercase">{t('shorts.options.blurredBackground')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => { setBlackBars(!blackBars); if (!blackBars) setBlurredBackground(false); }}
                                                            className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${blackBars ? 'bg-blue-500/10 border-blue-500 text-blue-600' : 'bg-gray-50/50 border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${blackBars ? 'bg-blue-600' : 'bg-gray-300'}`} />
                                                            <span className="text-xs font-black uppercase">{t('shorts.options.blackBars')}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <motion.div
                                            layout
                                            className="relative min-h-[500px] flex items-center justify-center"
                                        >
                                            <AnimatePresence mode="wait">
                                                {generating && (
                                                    <PremiumLoading
                                                        stage={t('shorts.generating')}
                                                        subtext="Propulsion par Veo3 AI"
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {!generating && (
                                                <button
                                                    onClick={handleGenerate}
                                                    className="w-full py-8 bg-gradient-to-r from-blue-600 via-[#c77ddf] to-[#e2a9f1] text-white text-2xl font-black rounded-3xl transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 shadow-2xl shadow-blue-500/20 relative overflow-hidden group"
                                                >
                                                    <div className="flex items-center justify-center gap-4 group-hover:gap-6 transition-all">
                                                        <Play className="w-8 h-8 fill-white" />
                                                        <span className="tracking-widest uppercase">{t('shorts.createBtn')}</span>
                                                    </div>
                                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                                </button>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Success UI Overlay - Optional, as toast also notifies */}
                            <AnimatePresence>
                                {generatedVideo && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-10 bg-green-50 border-4 border-white rounded-[3.5rem] shadow-2xl space-y-8"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                                <Check className="w-8 h-8" strokeWidth={4} />
                                            </div>
                                            <h3 className="text-4xl font-black text-gray-900 tracking-tight">{t('shorts.success')}</h3>
                                        </div>

                                        <div className="relative aspect-[9/16] max-w-sm mx-auto rounded-[3rem] overflow-hidden border-[12px] border-gray-900 shadow-2xl ring-4 ring-green-100 group/vid">
                                            <video
                                                src={generatedVideo.videoUrl}
                                                controls
                                                className="w-full h-full object-cover"
                                                autoPlay
                                            />
                                            <div className="absolute top-6 left-6 flex flex-col gap-2 opacity-0 group-hover/vid:opacity-100 transition-opacity">
                                                <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[8px] font-black text-[#e2a9f1] uppercase tracking-widest border border-white/10">
                                                    4K VEO3 Engine
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    showToast("Sauvegardé dans Brouillons", "success");
                                                    setGeneratedVideo(null);
                                                }}
                                                className="py-5 bg-white border-2 border-gray-100 hover:border-[#c77ddf] text-gray-900 font-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Layers className="w-4 h-4 text-[#c77ddf]" />
                                                {t('shorts.result.saveDraft')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    showToast("Planification...", "success");
                                                }}
                                                className="py-5 bg-white border-2 border-gray-100 hover:border-blue-500 text-gray-900 font-black rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-lg flex items-center justify-center gap-2"
                                            >
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                {t('shorts.result.schedule')}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => router.push('/dashboard')}
                                                className="py-4 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black tracking-widest uppercase transition-all shadow-xl text-xs"
                                            >
                                                {t('shorts.viewDashboard')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* RIGHT: History or Info */}
                        <div className="hidden lg:block lg:col-span-4 space-y-8">
                            {/* Tips Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="bg-white/50 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/50 shadow-xl shadow-blue-500/5"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-500 shadow-sm">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('shorts.proTips')}</h3>
                                </div>
                                <ul className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <li key={i} className="flex gap-4 items-start p-4 bg-white/80 rounded-3xl border border-gray-100 hover:border-yellow-200 transition-colors">
                                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-600 flex-shrink-0 mt-0.5">
                                                {i}
                                            </div>
                                            <p className="text-xs font-bold text-gray-600 leading-relaxed">
                                                {t(`shorts.tips.${i}`)}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Recent Activity Mini */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-gradient-to-br from-[#c77ddf] to-[#e2a9f1] p-8 rounded-[3.5rem] text-white shadow-2xl shadow-purple-500/20 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-2 tracking-tight">Besoin d'aide ?</h3>
                                    <p className="text-sm font-medium text-white/90 mb-8 leading-relaxed">
                                        Nos experts en viralité sont là pour optimiser vos contenus.
                                    </p>
                                    <button className="w-full py-4 bg-white text-[#c77ddf] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-colors shadow-lg">
                                        Contacter le Support
                                    </button>
                                </div>

                                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />
                            </motion.div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

export default function ShortsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Chargement...</p>
                </div>
            </div>
        }>
            <ShortsContent />
        </Suspense>
    );
}
