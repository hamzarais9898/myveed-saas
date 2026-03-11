'use client';

import { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Upload, Camera, Wand2, Play, Music, Type, Check, Star, Sparkles, ChevronRight, X, Calendar, Send, Scissors } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import axios from 'axios';
import PremiumLoading from '@/components/PremiumLoading';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const MOCK_STARS = [
    { id: 'messi', name: 'Lionel Messi', category: 'sport', image: '/images/stars/messi.png' },
    { id: 'ronaldo', name: 'Cristiano Ronaldo', category: 'sport', image: '/images/stars/ronaldo.png' },
    { id: 'naruto', name: 'Naruto Uzumaki', category: 'anime', image: '/images/stars/naruto.png' },
    { id: 'goku', name: 'San Goku', category: 'anime', image: '/images/stars/goku.png' },
    { id: 'miss-france', name: 'Miss France', category: 'celebrity', image: '/images/stars/missfrance.png' },
    { id: 'macron', name: 'Emmanuel Macron', category: 'politics', image: '/images/stars/macron.png' },
    { id: 'ironman', name: 'Iron Man', category: 'superhero', image: '/images/stars/ironman.png' },
    { id: 'elsa', name: 'La Reine des Neiges', category: 'disney', image: '/images/stars/elsa.png' },
];

export default function StarsPage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStar, setSelectedStar] = useState<typeof MOCK_STARS[0] | null>(null);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [step, setStep] = useState(1); // 1: Select, 2: Upload, 3: Settings, 4: Result
    const [generating, setGenerating] = useState(false);
    const [video, setVideo] = useState<any>(null);

    // Personalization States
    const [customPrompt, setCustomPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState('original');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);
    const [generationStage, setGenerationStage] = useState('');

    const STYLES = [
        { id: 'original', icon: Star },
        { id: 'human', icon: Camera },
        { id: 'cartoon', icon: Wand2 },
        { id: 'robot', icon: Sparkles },
        { id: 'gelaba', icon: Music }
    ];

    const updatePreview = () => {
        setIsUpdatingPreview(true);
        setTimeout(() => setIsUpdatingPreview(false), 800);
    };

    const filteredStars = MOCK_STARS.filter(star =>
        star.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t('stars.categories.' + star.category).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedStar) { // Assuming selectedVibe is not defined, only checking selectedStar
            showToast(t('stars.errorIncomplete'), 'warning');
            return;
        }
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
            setStep(3);
        }
    };

    const urlToBase64 = async (url: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('Error converting image to base64', e);
            throw e;
        }
    };

    const handleTransform = async () => {
        if (!selectedStar) {
            showToast(t('stars.errorIncomplete'), 'warning');
            return;
        }

        setIsTransforming(true);
        setGenerating(true);
        setVideo(null);
        setShowResult(false);

        try {
            // Stage 1: Preparing
            setGenerationStage(t('shorts.stages.analyzing'));

            // Convert Star Image to Base64 for API
            let sourceImage = '';
            if (selectedStar.image) {
                sourceImage = await urlToBase64(selectedStar.image);
            }

            // Stage 2: Processing
            setGenerationStage(t('shorts.stages.textures'));
            await new Promise(r => setTimeout(r, 1000));

            // Stage 3: Generating
            setGenerationStage(t('shorts.stages.temporal'));

            const prompt = `Cinematic shot of ${selectedStar.name}, ${selectedStyle} style. ${customPrompt}`;

            const response = await import('@/services/videoService').then(mod => mod.generateVideo(
                prompt,
                'short',
                1,
                'runway',
                {
                    image: sourceImage,
                    videoStyle: selectedStyle,
                    gender,
                    // Pass uploaded file if needed, but we prioritize image-to-video for Stars
                },
                5 // Duration
            ));

            if (response.videos && response.videos.length > 0) {
                setVideo(response.videos[0].url);
                setStep(4);
                setShowResult(true);
                showToast(t('shorts.result.successTransform'), 'success');
            } else {
                throw new Error('No video generated');
            }
        } catch (err: any) {
            console.error('Transformation error:', err);
            showToast(err.response?.data?.message || t('stars.errorGeneration'), 'error');
        } finally {
            setIsTransforming(false);
            setGenerating(false);
            setGenerationStage('');
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#e2a9f1]/20">
                {/* Animated Background Elements from Landing Page */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/10 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                    <div className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 right-0"></div>
                </div>

                <Navbar />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
                    {/* Header Section */}
                    <div className="relative mb-16 md:mb-24 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center space-x-2 bg-white/50 border border-white/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md shadow-sm"
                        >
                            <Sparkles className="w-4 h-4 text-[#c77ddf] animate-pulse" />
                            <span className="text-sm font-black text-[#c77ddf] tracking-wider uppercase">{t('stars.badge')}</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter leading-tight"
                        >
                            {t('stars.title')} <br className="hidden md:block" /><span className="bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">{t('stars.titleAccent')}</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium"
                        >
                            {t('stars.subtitle')}
                        </motion.p>

                        {/* Background Decor */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[300px] bg-gradient-to-r from-blue-100/10 via-purple-100/10 to-pink-100/10 blur-[100px] -z-10 rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* LEFT: Selection & Upload */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* STEP 1: Choose Star */}
                            <motion.div
                                layout
                                className={`group relative bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border transition-all duration-500 ${step === 1 ? 'border-white/40 shadow-2xl shadow-[#e2a9f1]/20 ring-1 ring-[#e2a9f1]/20' : 'border-white/10 shadow-sm opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'}`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-lg font-black shadow-lg">1</span>
                                        {t('stars.step1')}
                                    </h3>
                                    {selectedStar && (
                                        <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-black flex items-center gap-2">
                                            <Check className="w-3 h-3" /> COMPLETED
                                        </div>
                                    )}
                                </div>

                                <div className="relative mb-8">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#c77ddf] transition-colors" />
                                    <input
                                        type="text"
                                        placeholder={t('stars.searchPlaceholder')}
                                        className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-[1.5rem] pl-14 pr-6 py-5 focus:outline-none focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 transition-all font-bold text-gray-900 placeholder:text-gray-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={() => setStep(1)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar no-scrollbar scroll-smooth">
                                    {filteredStars.map((star, index) => (
                                        <motion.button
                                            key={star.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => { setSelectedStar(star); setStep(2); updatePreview(); }}
                                            className={`group relative aspect-square rounded-[2rem] overflow-hidden border-4 transition-all duration-300 ${selectedStar?.id === star.id ? 'border-white/40 scale-105 shadow-2xl shadow-[#e2a9f1]/40 ring-1 ring-[#e2a9f1]/50' : 'border-transparent hover:border-white/20 hover:scale-105'}`}
                                        >
                                            <Image
                                                src={star.image}
                                                alt={star.name}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-4 pt-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent text-white text-center">
                                                <span className="block text-sm font-black leading-tight drop-shadow-lg tracking-tight truncate">{star.name}</span>
                                                <span className="text-[9px] uppercase tracking-widest font-black opacity-80 mt-1 block">{t('stars.categories.' + star.category)}</span>
                                            </div>
                                            {selectedStar?.id === star.id && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-3 right-3 bg-white text-[#c77ddf] rounded-full p-1.5 shadow-xl"
                                                >
                                                    <Check className="w-4 h-4" strokeWidth={5} />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}

                                    {/* Upload Custom */}
                                    <button className="aspect-square rounded-[2rem] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 hover:border-[#e2a9f1] hover:text-[#e2a9f1] hover:bg-[#e2a9f1]/5 transition-all gap-2 group">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-[#e2a9f1]/10 transition-colors">
                                            <Upload className="w-6 h-6" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('stars.uploadCustom')}</span>
                                    </button>
                                </div>
                            </motion.div>

                            {/* STEP 1.5: Customize Avatar (New Section) */}
                            <AnimatePresence>
                                {selectedStar && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        className="bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border border-white/40 shadow-xl shadow-[#e2a9f1]/5 relative overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                                <span className="w-10 h-10 rounded-2xl bg-[#c77ddf] text-white flex items-center justify-center text-lg font-black shadow-lg">✨</span>
                                                {t('stars.customize.title')}
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setSelectedStyle('original');
                                                    setGender('male');
                                                    setCustomPrompt('');
                                                    updatePreview();
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#c77ddf] hover:underline"
                                            >
                                                {t('stars.customize.reset')}
                                            </button>
                                        </div>

                                        <div className="space-y-8">
                                            {/* Style Selector */}
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t('stars.customize.style')}</label>
                                                <div className="flex flex-wrap gap-3">
                                                    {STYLES.map((style) => (
                                                        <button
                                                            key={style.id}
                                                            onClick={() => { setSelectedStyle(style.id); updatePreview(); }}
                                                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all ${selectedStyle === style.id ? 'bg-[#c77ddf] border-[#c77ddf] text-white shadow-lg shadow-[#c77ddf]/30' : 'bg-white border-gray-100 text-gray-500 hover:border-[#c77ddf]/50'}`}
                                                        >
                                                            <style.icon className="w-4 h-4" />
                                                            <span className="text-xs font-black uppercase tracking-tight">{t(`stars.customize.styles.${style.id}`)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Gender & Other Toggles */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <div>
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t('stars.customize.gender')}</label>
                                                    <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit">
                                                        <button
                                                            onClick={() => { setGender('male'); updatePreview(); }}
                                                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${gender === 'male' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                                        >
                                                            {t('stars.customize.male')}
                                                        </button>
                                                        <button
                                                            onClick={() => { setGender('female'); updatePreview(); }}
                                                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${gender === 'female' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                                        >
                                                            {t('stars.customize.female')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Magic Prompt Area */}
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">{t('stars.customize.promptLabel')}</label>
                                                <div className="relative">
                                                    <textarea
                                                        value={customPrompt}
                                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                                        onBlur={updatePreview}
                                                        placeholder={t('stars.customize.promptPlaceholder')}
                                                        className="w-full bg-gray-50/50 border-2 border-gray-100 rounded-3xl p-5 min-h-[100px] text-sm font-bold text-gray-900 focus:outline-none focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 transition-all resize-none placeholder:text-gray-400"
                                                    />
                                                    <div className="absolute bottom-4 right-4 text-[9px] font-black uppercase tracking-widest text-gray-300 pointer-events-none">
                                                        Powered by Veo3
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Decor for customization */}
                                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#c77ddf]/5 rounded-full blur-3xl -z-10" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* STEP 2: Input Video */}
                            <motion.div
                                layout
                                className={`bg-white/70 backdrop-blur-xl p-8 rounded-[3rem] border transition-all duration-500 ${step === 2 ? 'border-white/40 shadow-2xl shadow-[#e2a9f1]/20 ring-1 ring-[#e2a9f1]/20' : 'border-white/10 shadow-sm opacity-60'}`}
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-lg font-black shadow-lg">2</span>
                                        {t('stars.step2')}
                                    </h3>
                                    {uploadedFile && (
                                        <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-black flex items-center gap-2">
                                            <Check className="w-3 h-3" /> READY
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="relative group overflow-hidden rounded-[2rem] border-4 border-dashed border-gray-100 hover:border-[#e2a9f1] transition-all bg-gray-50/50 hover:bg-[#e2a9f1]/5 cursor-pointer h-48 flex flex-col items-center justify-center text-center p-8">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                            accept="video/*"
                                            onChange={handleFileUpload}
                                            disabled={step < 2}
                                        />
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#c77ddf] transition-colors" />
                                        </div>
                                        <span className="font-black text-gray-900 leading-tight mb-1">{t('stars.importVideo')}</span>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('stars.videoSpecs')}</span>
                                    </div>

                                    <button
                                        className="relative group rounded-[2rem] border-4 border-gray-100 bg-white hover:border-[#e2a9f1] hover:bg-[#e2a9f1]/5 transition-all h-48 flex flex-col items-center justify-center gap-2 disabled:opacity-50 overflow-hidden"
                                        disabled={step < 2}
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:bg-red-100 transition-all duration-500 relative">
                                            <Camera className="w-6 h-6" />
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                            </span>
                                        </div>
                                        <span className="font-black text-gray-900">{t('stars.recordMe')}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-white bg-red-500 px-2.5 py-1 rounded-full uppercase tracking-widest">{t('stars.cameraLive')}</span>
                                        </div>
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {uploadedFile && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-6"
                                        >
                                            <div className="p-4 bg-[#c77ddf]/10 border border-[#c77ddf]/20 rounded-2xl flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#c77ddf] font-black text-xs shadow-sm">
                                                    VID
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate">{uploadedFile.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • READY FOR MAGIC</p>
                                                </div>
                                                <button
                                                    onClick={() => { setUploadedFile(null); setStep(2); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg transition-colors shadow-sm"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* RIGHT: Preview & Actions */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-24">
                                <motion.div
                                    layout
                                    className="bg-white p-3 rounded-[3.5rem] border border-white/20 shadow-2xl shadow-[#e2a9f1]/10 overflow-hidden relative min-h-[550px] flex flex-col"
                                >
                                    {/* Preview Area - Lightened */}
                                    <div className="flex-1 bg-gray-50/50 rounded-[2.8rem] relative overflow-hidden flex items-center justify-center group shadow-inner border border-gray-100">
                                        <AnimatePresence mode="wait">
                                            {showResult ? (
                                                <motion.div
                                                    key="result"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="absolute inset-0 bg-cover bg-center"
                                                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80")' }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex items-center justify-center">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-2xl group"
                                                        >
                                                            <Play className="w-8 h-8 ml-1 fill-white group-hover:scale-110 transition-transform" />
                                                        </motion.button>
                                                    </div>

                                                    {/* Video Info Overlay */}
                                                    <div className="absolute bottom-10 left-8 right-8 text-white space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-1 shadow-lg border border-white/10 relative overflow-hidden">
                                                                {selectedStar && (
                                                                    <Image src={selectedStar.image} alt={selectedStar.name} fill className={`object-cover transition-all duration-700 ${selectedStyle === 'cartoon' ? 'sepia-[0.3] saturate-[1.5] contrast-[1.2]' : selectedStyle === 'robot' ? 'grayscale-[0.5] contrast-[1.5] brightness-[1.2]' : ''}`} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-black tracking-tight flex items-center gap-2">
                                                                    @{selectedStar?.id}
                                                                    <span className="px-2 py-0.5 bg-[#e2a9f1] text-black text-[8px] font-black rounded-full uppercase tracking-tighter">Verified</span>
                                                                </p>
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/10 rounded-md border border-white/10">{selectedStyle}</span>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/10 rounded-md border border-white/10">{gender}</span>
                                                                    {customPrompt && <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-[#c77ddf] text-white rounded-md">Prompt active</span>}
                                                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-black/40 text-[#e2a9f1] rounded-md border border-[#e2a9f1]/20">Sora HD</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs font-medium leading-relaxed drop-shadow-lg opacity-80">
                                                            {t('shorts.result.successTransform')} 🚀✨ <span className="text-[#e2a9f1] font-black">#AI #Sora #MAVEED</span>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            ) : isTransforming ? (
                                                <PremiumLoading
                                                    stage={generationStage || t('stars.transforming')}
                                                    subtext="Deepfake Veo3 Propulsé"
                                                />
                                            ) : selectedStar ? (
                                                <motion.div
                                                    key="avatar-setup"
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex flex-col items-center gap-6"
                                                >
                                                    <div className="relative group/preview">
                                                        <div className="absolute -inset-4 bg-gradient-to-r from-[#e2a9f1]/20 to-[#c77ddf]/20 blur-2xl rounded-full animate-pulse" />
                                                        <div className="w-56 h-56 rounded-[3rem] border-8 border-white/20 shadow-2xl overflow-hidden relative z-10">
                                                            <Image
                                                                src={selectedStar.image}
                                                                alt={selectedStar.name}
                                                                fill
                                                                className={`object-cover transition-all duration-700 ${selectedStyle === 'cartoon' ? 'sepia-[0.3] saturate-[1.5] contrast-[1.2]' : selectedStyle === 'robot' ? 'grayscale-[0.5] contrast-[1.5] brightness-[1.2]' : ''}`}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                                        </div>

                                                        {/* Dynamic Icon Overlay based on Style */}
                                                        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-3xl shadow-xl z-20 flex items-center justify-center border-4 border-gray-50 text-[#c77ddf]">
                                                            {STYLES.find(s => s.id === selectedStyle)?.icon && (
                                                                (() => {
                                                                    const Icon = STYLES.find(s => s.id === selectedStyle)?.icon!;
                                                                    return <Icon className="w-7 h-7" />;
                                                                })()
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-center">
                                                        <h4 className="text-gray-900 font-black text-2xl tracking-tighter mb-1">{selectedStar.name}</h4>
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">{t(`stars.customize.styles.${selectedStyle}`)}</span>
                                                            <span className="px-3 py-1 bg-[#e2a9f1]/10 text-[#c77ddf] rounded-full text-[10px] font-black uppercase tracking-widest">{gender}</span>
                                                        </div>
                                                    </div>

                                                    {customPrompt && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="max-w-[80%] p-4 bg-white/50 backdrop-blur-md border border-white/20 rounded-2xl text-[10px] italic font-medium text-gray-500 text-center"
                                                        >
                                                            "{customPrompt}"
                                                        </motion.div>
                                                    )}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="empty"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-center p-8"
                                                >
                                                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-700">
                                                        <Wand2 className="w-10 h-10 text-gray-300 group-hover:text-[#e2a9f1] transition-colors" />
                                                    </div>
                                                    <h4 className="text-gray-400 font-black tracking-widest uppercase text-[10px]">{t('stars.previewPlaceholder')}</h4>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Updating Preview Overlay */}
                                        <AnimatePresence>
                                            {isUpdatingPreview && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute inset-0 bg-white/40 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4"
                                                >
                                                    <div className="w-12 h-12 border-4 border-[#c77ddf]/20 border-t-[#c77ddf] rounded-full animate-spin" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#c77ddf] animate-pulse">
                                                        {t('stars.customize.updating')}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="p-6 space-y-4">
                                        <AnimatePresence mode="wait">
                                            {!showResult ? (
                                                <motion.button
                                                    key="btn-transform"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    onClick={handleTransform}
                                                    disabled={!selectedStar || !uploadedFile || isTransforming}
                                                    className="group w-full py-6 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white rounded-[2rem] shadow-xl shadow-[#e2a9f1]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#c77ddf] to-[#e2a9f1] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    <span className="relative z-10 text-lg font-black tracking-widest uppercase">{t('stars.transformBtn')}</span>
                                                    <Wand2 className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                                                </motion.button>
                                            ) : (
                                                <motion.div
                                                    key="btn-result"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="space-y-4"
                                                >
                                                    {/* Post-processing Controls */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { icon: Type, label: t('stars.subtitles') },
                                                            { icon: Music, label: t('stars.music') },
                                                            { icon: Wand2, label: t('stars.retouch') }
                                                        ].map((tool, i) => (
                                                            <button key={i} className="flex flex-col items-center gap-2 p-4 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-[#e2a9f1]/10 hover:text-[#c77ddf] transition-all group">
                                                                <tool.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                                <span className="text-[9px] font-black uppercase tracking-wider">{tool.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <button
                                                            onClick={() => {
                                                                showToast(t('stars.download') + '...', 'success');
                                                            }}
                                                            className="py-5 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-900 font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                                                        >
                                                            <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                                            {t('stars.download')}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                showToast("Planification...", "success");
                                                            }}
                                                            className="py-5 bg-white border-2 border-gray-100 hover:border-blue-500 text-gray-900 font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-sm"
                                                        >
                                                            <Calendar className="w-4 h-4 text-blue-500" />
                                                            {t('shorts.result.schedule')}
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={async () => {
                                                            showToast(t('shorts.result.shareSuccess'), 'success');
                                                        }}
                                                        className="w-full py-5 bg-gradient-to-r from-gray-800 to-gray-950 text-white hover:scale-[1.02] font-black rounded-2xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-xl group"
                                                    >
                                                        <Send className="w-4 h-4 text-[#e2a9f1] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                        {t('stars.publish')}
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Credits Note */}
                                        {!isTransforming && !showResult && (
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                <Star className="w-3 h-3 text-[#e2a9f1] fill-current" />
                                                <span>Cost: 15 Credits</span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>

                                {/* Info Box */}
                                {!showResult && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="mt-6 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem]"
                                    >
                                        <div className="flex gap-4">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="text-xs text-blue-800 leading-relaxed">
                                                <p className="font-black mb-1">PRO TIP:</p>
                                                For best results, use a clear video of yourself with good lighting and neutral background. Our <strong>Veo3 AI</strong> will blend your movements perfectly.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                    </div>
                </main>

                <Footer />

                {/* Custom styles for the page */}
                <style jsx global>{`
                    @keyframes gradient-x {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    .animate-gradient-x {
                        animation: gradient-x 15s ease infinite;
                    }
                    .no-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .no-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
            </div >
        </ProtectedRoute >
    );
}
