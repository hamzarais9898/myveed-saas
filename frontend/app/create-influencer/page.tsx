'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    User, Dna, Save, Wand2, RefreshCw, Sparkles, ScanFace,
    Search, X, Loader2, CheckCircle, ArrowRight, Plus,
    Video, Trash2, Users, Camera, Smile, Eye, Scissors,
    Check, Play, LayoutGrid, Layout, Image as ImageIcon, Target, Download, DownloadCloud, Megaphone
} from 'lucide-react';
import { downloadResource, getMaveedFilename } from '@/utils/downloadHelper';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import * as influencerService from '@/services/influencerService';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import PremiumLoading from '@/components/PremiumLoading';
import VideoPreviewModal from '@/components/VideoPreviewModal';

type Gender = 'man' | 'woman' | 'other';

export default function AIInfluencerPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useLanguage();

    // Data State
    const [influencers, setInfluencers] = useState<influencerService.Influencer[]>([]);
    const [selectedInfluencer, setSelectedInfluencer] = useState<influencerService.Influencer | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);



    // Enhanced State for Native High-Fidelity Creator
    const [gender, setGender] = useState<'man' | 'woman'>('woman');
    const [bodyType, setBodyType] = useState<'calme' | 'athletic' | 'muscular' | 'heavy'>('athletic');
    const [hairColor, setHairColor] = useState<'blonde' | 'brown' | 'black' | 'red' | 'grey' | 'white'>('blonde');
    const [hairStyle, setHairStyle] = useState<'long' | 'short' | 'buzz' | 'bald' | 'curly' | 'braids'>('long');
    const [hairLength, setHairLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [skinTone, setSkinTone] = useState<'pale' | 'fair' | 'tan' | 'olive' | 'dark' | 'deep'>('fair');
    const [eyeColor, setEyeColor] = useState<'blue' | 'green' | 'hazel' | 'brown' | 'grey'>('blue');

    // Filter State
    const [filterStatus, setFilterStatus] = useState<'active' | 'draft'>('active');
    const [filters, setFilters] = useState({
        gender: '',
        skinTone: '',
        eyeColor: '',
        hairColor: ''
    });

    // Advanced Studio State
    const [showAdvancedStudio, setShowAdvancedStudio] = useState(false);
    const [studioLoading, setStudioLoading] = useState(false);
    const [studioPreview, setStudioPreview] = useState<string | null>(null);
    const [aesthetic, setAesthetic] = useState<'photorealistic' | 'cartoon'>('photorealistic');

    // Form State (Technical Facial Reconstruction)
    const [name, setName] = useState('');
    const [age, setAge] = useState(25);
    const [config, setConfig] = useState<any>({
        aesthetic: 'realistic',
        ethnicity: 'european',
        structure: {
            faceShape: 'oval',
            jawline: 'sharp',
            cheekbones: 'high',
            forehead: 'balanced'
        },
        ocular: {
            shape: 'almond',
            size: 'normal',
            color: 'blue',
            depth: 'balanced'
        },
        nasal: {
            type: 'straight',
            width: 'medium',
            tip: 'refined'
        },
        labial: {
            fullness: 'medium',
            symmetry: 'perfect'
        },
        epidermal: {
            tone: 'fair',
            texture: 'raw',
            features: ['none']
        },
        hair: {
            color: 'blonde',
            style: 'modern wavy',
            length: 'long'
        }
    });

    // Preview State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Gallery / Multi-generation State
    const [viewMode, setViewMode] = useState<'gallery' | 'videos'>('gallery');
    const [generatingContent, setGeneratingContent] = useState(false);

    // Library State
    const [libraryItems, setLibraryItems] = useState<any[]>([]);
    const [libraryStats, setLibraryStats] = useState<any>(null);
    const [libraryPage, setLibraryPage] = useState(1);
    const [libraryHasMore, setLibraryHasMore] = useState(true);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [libraryTypeFilter, setLibraryTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [showAdModal, setShowAdModal] = useState(false);

    // Live Preview Debounce
    useEffect(() => {
        if (!showCreateForm) return;

        const timer = setTimeout(() => {
            updatePreview();
        }, 800);

        return () => clearTimeout(timer);
    }, [gender, bodyType, hairColor, hairStyle, skinTone, eyeColor, config, name, age, showCreateForm]);

    // Initial Load
    useEffect(() => {
        loadInfluencers();
    }, []);

    const loadInfluencers = async () => {
        try {
            setLoading(true);
            const data = await influencerService.getInfluencers({
                status: filterStatus,
                ...filters
            });
            if (data.success) {
                setInfluencers(data.influencers);
                if (selectedInfluencer) {
                    const updated = data.influencers.find((i: any) => i._id === selectedInfluencer._id);
                    if (updated) setSelectedInfluencer(updated);
                }
            }
        } catch (error) {
            console.error('Error loading influencers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLibrary = async (id: string, page = 1, type = libraryTypeFilter) => {
        if (!id) return;
        setLibraryLoading(true);
        try {
            const data = await influencerService.getInfluencerLibrary(id, page, 20, type === 'all' ? undefined : type);
            if (data.success) {
                if (page === 1) {
                    setLibraryItems(data.items);
                } else {
                    setLibraryItems(prev => [...prev, ...data.items]);
                }
                setLibraryStats(data.stats);
                setLibraryHasMore(data.pagination.page < data.pagination.pages);
                setLibraryPage(page);
            } else {
                showToast(data.message || 'Erreur lors du chargement de la bibliothèque', 'error');
            }
        } catch (err) {
            console.error('Failed to load library:', err);
            showToast('Impossible de se connecter au serveur de bibliothèque', 'error');
        } finally {
            setLibraryLoading(false);
        }
    };

    // Reload library when influencer or filter changes
    useEffect(() => {
        if (selectedInfluencer) {
            fetchLibrary(selectedInfluencer._id, 1, libraryTypeFilter);
        }
    }, [selectedInfluencer, libraryTypeFilter]);

    useEffect(() => {
        loadInfluencers();
    }, [filterStatus, filters]);
    
    // Bridge to Sora Image-to-Video
    const handleAnimateInfluencer = (inf: influencerService.Influencer, imageUrl?: string) => {
        if (!inf) return;
        
        const finalImageUrl = imageUrl || (inf.photos && inf.photos.length > 0 ? inf.photos[0].imageUrl : inf.avatarUrl);
        
        sessionStorage.setItem('animateSourceType', 'influencer');
        sessionStorage.setItem('animateInfluencerId', inf._id);
        sessionStorage.setItem('animateInfluencerName', inf.name);
        sessionStorage.setItem('animateInfluencerImageUrl', finalImageUrl);
        
        router.push('/generate?mode=image-to-video&source=influencer');
    };

    // Bridge to Image Generation
    const handleGenerateInfluencerPhoto = (inf: influencerService.Influencer, imageUrl?: string) => {
        if (!inf) return;
        
        const finalImageUrl = imageUrl || (inf.photos && inf.photos.length > 0 ? inf.photos[0].imageUrl : inf.avatarUrl);
        
        sessionStorage.setItem('generateSourceType', 'influencer');
        sessionStorage.setItem('generateInfluencerId', inf._id);
        sessionStorage.setItem('generateInfluencerName', inf.name);
        sessionStorage.setItem('generateInfluencerImageUrl', finalImageUrl);
        
        router.push('/generate?mode=image&source=influencer');
    };



    // Generate Avatar from LOCAL PRESETS (Expanded Matrix: 12 Variants)
    const updatePreview = useCallback(() => {
        let filename = '';

        if (gender === 'woman') {
            // Default Base
            filename = 'woman_fair_blonde_long.png';

            // Logic Priority: Hair Color > Skin Tone
            if (hairColor === 'red') {
                filename = 'woman_pale_red_long.png';
            } else if (hairColor === 'grey' || hairColor === 'white') {
                filename = 'woman_fair_grey_bun.png';
            } else if (hairColor === 'black') {
                if (skinTone === 'pale' || skinTone === 'fair') {
                    filename = 'woman_pale_black_straight.png'; // Asian Archetype
                } else {
                    filename = 'woman_dark_black_short.png'; // African Archetype
                }
            } else if (hairColor === 'blonde') {
                filename = 'woman_fair_blonde_long.png';
            } else if (hairColor === 'brown') {
                filename = 'woman_tan_brown_curly.png';
            } else {
                // Fallback based on skin if hair is ambiguous
                if (skinTone === 'dark' || skinTone === 'deep') filename = 'woman_dark_black_short.png';
                else if (skinTone === 'tan' || skinTone === 'olive') filename = 'woman_tan_brown_curly.png';
            }

        } else {
            // Man Logic
            filename = 'man_fair_blonde_short.png';

            if (hairColor === 'red') {
                filename = 'man_pale_red_short.png';
            } else if (hairColor === 'grey' || hairColor === 'white') {
                filename = 'man_fair_grey_short.png';
            } else if (hairColor === 'black') {
                if (skinTone === 'pale' || skinTone === 'fair') {
                    filename = 'man_pale_black_straight.png';
                } else {
                    filename = 'man_dark_black_buzz.png';
                }
            } else if (hairColor === 'blonde') {
                filename = 'man_fair_blonde_short.png';
            } else if (hairColor === 'brown') {
                filename = 'man_tan_brown_curly.png';
            } else {
                if (skinTone === 'dark' || skinTone === 'deep') filename = 'man_dark_black_buzz.png';
                else if (skinTone === 'tan' || skinTone === 'olive') filename = 'man_tan_brown_curly.png';
            }
        }

        setPreviewImage(`/avatars/${filename}`);
    }, [gender, hairColor, skinTone]); // Minimal dependencies for instant switch

    const handleSaveInfluencer = async () => {
        if (!previewImage) return;
        setIsSaving(true);
        try {
            const result = await influencerService.createInfluencer({
                name: name || 'Nouvel Influenceur',
                gender,
                age,
                avatarUrl: previewImage,
                bodyType,
                // Removed hair/skin/eyes details from request as they are implicit in the preset matrix
                // but kept in config if needed for future features
                config: {
                    aesthetic: 'photorealistic',
                    // Store the preset filename as 'reference' in checks
                    preset: previewImage.split('/').pop()
                } as any
            });

            if (result.success && result.influencer) {
                showToast('Profil archivé avec succès !', 'success');
                // FIX: Instant update of the list to prevent "missing item" bug
                setInfluencers(prev => [result.influencer, ...prev]);
                setShowCreateForm(false);
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la sauvegarde', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkPhotos = async (id: string) => {
        setGeneratingContent(true);
        try {
            const newConfig = {
                ...config,
                gender,
                bodyType,
                hair: { color: hairColor, style: hairStyle },
                skin: { tone: skinTone },
                eyes: { color: eyeColor }
            };

            const result = await influencerService.generatePhotos(id, 20); // Correct endpoint: generatePhotos
            if (result.success) {
                showToast('20 photos en cours de génération !', 'success');
                loadInfluencers();
                if (selectedInfluencer) fetchLibrary(selectedInfluencer._id, 1, libraryTypeFilter);
            }
        } catch (error: any) {
            const apiError = error.response?.data;
            if (apiError?.requiresSubscription) {
                showToast(t('errors.subscriptionRequired'), 'error');
            } else if (apiError?.creditsNeeded !== undefined) {
                let msg = t('errors.insufficientCredits');
                msg = msg.replace('{needed}', apiError.creditsNeeded);
                msg = msg.replace('{available}', apiError.creditsAvailable);
                showToast(msg, 'error');
            } else {
                showToast(apiError?.message || t('errors.failedToGenerate'), 'error');
            }
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleGenerateVideos = async (id: string, photos: string[]) => {
        setGeneratingContent(true);
        try {
            const result = await influencerService.generateVideos(id, photos.slice(0, 10), 10);
            if (result.success) {
                showToast('10 vidéos en cours de génération !', 'success');
                loadInfluencers();
            }
        } catch (error: any) {
            const apiError = error.response?.data;
            if (apiError?.requiresSubscription) {
                showToast(t('errors.subscriptionRequired'), 'error');
            } else if (apiError?.creditsNeeded !== undefined) {
                let msg = t('errors.insufficientCredits');
                msg = msg.replace('{needed}', apiError.creditsNeeded);
                msg = msg.replace('{available}', apiError.creditsAvailable);
                showToast(msg, 'error');
            } else {
                showToast(apiError?.message || t('errors.failedToGenerate'), 'error');
            }
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Supprimer ce profil ?')) {
            try {
                await influencerService.deleteInfluencer(id);
                setInfluencers(prev => prev.filter(i => i._id !== id));
                setSelectedInfluencer(null);
                showToast('Profil supprimé', 'success');
            } catch (error) {
                showToast('Erreur lors de la suppression', 'error');
            }
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#c77ddf]/20">
                {/* Animated Background Elements (Landing Page Style) */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/20 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                    <div className="absolute w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 -right-20"></div>
                </div>

                <Navbar />

                <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
                    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 mb-6">
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase">Incarnez une Star</span>
                            </motion.div>
                            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-5xl md:text-6xl font-black text-gray-900 mb-4 tracking-tighter">
                                Devenez <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Légendaire</span>
                            </motion.h1>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest max-w-lg">Choisissez un personnage, filmez-vous, et laissez l'IA opérer sa magie.</p>
                        </div>
                        {!showCreateForm && !selectedInfluencer && (
                            <div className="flex gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowAdvancedStudio(true)}
                                    className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-[2rem] shadow-2xl hover:shadow-blue-500/20 transition-all uppercase tracking-widest text-[11px] flex items-center gap-3"
                                >
                                    <ScanFace className="w-5 h-5" />
                                    Studio Avancé IA
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowCreateForm(true)}
                                    className="px-8 py-5 bg-black text-white font-black rounded-[2rem] shadow-xl transition-all uppercase tracking-widest text-[11px] flex items-center gap-3"
                                >
                                    <LayoutGrid className="w-5 h-5 text-gray-400" />
                                    Presets Rapides
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="grid grid-cols-1 gap-8">
                        <div className="w-full">

                            {/* CREATE FORM - Technical Reconstruction Panel */}
                            <AnimatePresence mode="wait">
                                {showCreateForm ? (
                                    <motion.div
                                        key="select-mode"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white rounded-[3rem] p-8 md:p-12 border border-blue-50 shadow-2xl relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8 z-20">
                                            <button onClick={() => setShowCreateForm(false)} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-all">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="relative z-10 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
                                                    CHOISIR UN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">INFLUENCEUR IA</span>
                                                </h1>
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-orange-500" />
                                                    Système 100% Photoréaliste • Prêt à l'emploi
                                                </p>
                                            </div>


                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                                            {[
                                                { name: 'Emma (Blonde)', file: 'woman_fair_blonde_long.png', gender: 'woman' },
                                                { name: 'Lucas (Blond)', file: 'man_fair_blonde_short.png', gender: 'man' },
                                                { name: 'Sarah (Rousse)', file: 'woman_pale_red_long.png', gender: 'woman' },
                                                { name: 'Thomas (Roux)', file: 'man_pale_red_short.png', gender: 'man' },
                                                { name: 'Maya (Métisse)', file: 'woman_tan_brown_curly.png', gender: 'woman' },
                                                { name: 'Noah (Métis)', file: 'man_tan_brown_curly.png', gender: 'man' },
                                                { name: 'Amina (Afro)', file: 'woman_dark_black_short.png', gender: 'woman' },
                                                { name: 'David (Afro)', file: 'man_dark_black_buzz.png', gender: 'man' },
                                                { name: 'Yuki (Asie)', file: 'woman_pale_black_straight.png', gender: 'woman' },
                                                { name: 'Kenji (Asie)', file: 'man_pale_black_straight.png', gender: 'man' },
                                                { name: 'Martha (Senior)', file: 'woman_fair_grey_bun.png', gender: 'woman' },
                                                { name: 'Robert (Senior)', file: 'man_fair_grey_short.png', gender: 'man' },
                                            ].map((preset) => (
                                                <button
                                                    key={preset.file}
                                                    onClick={() => {
                                                        setPreviewImage(`/avatars/${preset.file}`);
                                                        setName(preset.name.split(' ')[0]);
                                                        setGender(preset.gender as any);
                                                        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                                                    }}
                                                    className={`group relative aspect-[3/4] rounded-3xl overflow-hidden border-2 transition-all duration-300 ${previewImage?.includes(preset.file)
                                                        ? 'border-blue-600 shadow-2xl scale-105 z-10'
                                                        : 'border-transparent hover:border-gray-200 hover:shadow-xl'}`}
                                                >
                                                    <img
                                                        src={`/avatars/${preset.file}`}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                        alt={preset.name}
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                                        <p className="text-white font-black uppercase text-[10px] tracking-widest">{preset.name}</p>
                                                    </div>
                                                    {previewImage?.includes(preset.file) && (
                                                        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                                            <Check className="w-3 h-3 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        {previewImage && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-12 p-8 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col md:flex-row items-center gap-8"
                                            >
                                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                    <img src={previewImage} className="w-full h-full object-cover" alt="Selected" />
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <h3 className="text-xl font-black text-gray-900 mb-1">Confirmer {name} ?</h3>
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Influenceur Photoréaliste Prêt à l'emploi</p>
                                                </div>
                                                <button
                                                    onClick={handleSaveInfluencer}
                                                    disabled={isSaving}
                                                    className="w-full md:w-auto px-10 py-5 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                                                >
                                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Créer ce Profil'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </motion.div>

                                ) : selectedInfluencer ? (
                                    <motion.div
                                        key="dash"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-white rounded-[3rem] p-8 md:p-12 border border-blue-50 shadow-2xl"
                                    >
                                        <div className="flex flex-col md:flex-row items-start gap-12 mb-16">
                                            <img src={selectedInfluencer.avatarUrl} className="w-44 h-44 rounded-[2.5rem] object-cover border-4 border-white shadow-xl" alt={selectedInfluencer.name} />
                                            <div className="flex-1">
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 mt-8">
                                                    {[
                                                        { label: 'Photos', value: libraryStats?.totalImages ?? 0, icon: ImageIcon, color: 'text-blue-500' },
                                                        { label: 'Vidéos', value: libraryStats?.totalVideos ?? 0, icon: Video, color: 'text-indigo-500' },
                                                        { label: 'Reach', value: '--', icon: Users, color: 'text-emerald-500' },
                                                        { label: 'Engagement', value: '--', icon: Sparkles, color: 'text-orange-500' }
                                                    ].map((kpi, i) => (
                                                        <div key={i} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                                            <kpi.icon className={`w-4 h-4 mb-2 ${kpi.color}`} />
                                                            <span className="text-xs font-black block">{kpi.value}</span>
                                                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    <button
                                                        onClick={() => handleAnimateInfluencer(selectedInfluencer)}
                                                        className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-blue-200"
                                                    >
                                                        {t('influencers.generateVideo')}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAdModal(true)}
                                                        className="px-8 py-4 bg-white border border-blue-100 text-blue-600 font-black rounded-2xl text-[9px] uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-blue-50"
                                                    >
                                                        <Megaphone className="w-3 h-3 inline-block mr-2" />
                                                        Générer Publicité
                                                    </button>
                                                    <button
                                                        onClick={() => handleGenerateInfluencerPhoto(selectedInfluencer)}
                                                        className="px-8 py-4 bg-black text-white font-black rounded-2xl text-[9px] uppercase tracking-widest transition-all hover:scale-105 shadow-xl"
                                                    >
                                                        Générer une Photo
                                                    </button>
                                                    <button onClick={() => setSelectedInfluencer(null)} className="px-8 py-4 bg-white border border-gray-100 text-gray-400 font-black rounded-2xl text-[9px] uppercase tracking-widest hover:bg-gray-50">Fermer</button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Library Header */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Bibliothèque de Contenus</h3>
                                            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                                                {['all', 'photo', 'video'].map((type) => (
                                                    <button
                                                        key={type}
                                                        onClick={() => setLibraryTypeFilter(type as any)}
                                                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                                            libraryTypeFilter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        {type === 'all' ? 'Tout' : type === 'photo' ? 'Photos' : 'Vidéos'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {libraryLoading && libraryPage === 1 ? (
                                            <div className="flex items-center justify-center py-12">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                            </div>
                                        ) : libraryItems.length === 0 ? (
                                            <div className="text-center py-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem]">
                                                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucun contenu trouvé</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                                                    {libraryItems.map((asset: any) => (
                                                        <motion.div 
                                                            key={asset.id} 
                                                            whileHover={{ y: -5 }} 
                                                            className={`aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative group transition-all duration-300 ${
                                                                asset.type === 'video' 
                                                                    ? (asset.videoUrl ? 'cursor-pointer hover:shadow-xl hover:border-blue-200' : 'cursor-wait opacity-80') 
                                                                    : 'cursor-default'
                                                            }`}
                                                            onClick={() => {
                                                                if (asset.type === 'video') {
                                                                    if (asset.videoUrl) {
                                                                        setSelectedVideo(asset);
                                                                    } else if (asset.status === 'processing' || asset.status === 'generating') {
                                                                        showToast('Vidéo en cours de génération...', 'info');
                                                                    } else {
                                                                        showToast('Vidéo non disponible', 'error');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <img src={asset.imageUrl} className="w-full h-full object-cover" alt="asset" />
                                                            {asset.type === 'video' && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                                                    <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                                                                        <Play className="w-5 h-5 fill-white" />
                                                                    </div>
                                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-lg text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm flex items-center gap-1">
                                                                        {asset.status === 'processing' || asset.status === 'generating' ? <Loader2 className="w-2 h-2 animate-spin" /> : <Video className="w-2 h-2" />} Vidéo
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {asset.type === 'photo' && (
                                                                <>
                                                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-lg text-[8px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <ImageIcon className="w-2 h-2" /> Photo
                                                                    </div>
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100 p-4">
                                                                        <div className="flex flex-col gap-2 w-full max-w-[140px]">
                                                                            <button
                                                                                onClick={() => selectedInfluencer && handleAnimateInfluencer(selectedInfluencer, asset.imageUrl)}
                                                                                className="w-full px-4 py-2.5 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white"
                                                                            >
                                                                                <Video className="w-3 h-3" />
                                                                                Animer
                                                                            </button>
                                                                                <div className="grid grid-cols-2 gap-2 w-full">
                                                                                    <button
                                                                                        onClick={(e) => { e.stopPropagation(); selectedInfluencer && handleGenerateInfluencerPhoto(selectedInfluencer, asset.imageUrl); }}
                                                                                        className="w-full px-2 py-2.5 bg-black text-white text-[8px] font-black uppercase tracking-widest rounded-xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5 hover:bg-indigo-600"
                                                                                    >
                                                                                        <ImageIcon className="w-3 h-3" />
                                                                                        Variante
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={async (e) => {
                                                                                            e.stopPropagation();
                                                                                            if (!selectedInfluencer) return;
                                                                                            setDownloadingId(asset.id);
                                                                                            const filename = getMaveedFilename(selectedInfluencer.name, 'photo', asset.id);
                                                                                            await downloadResource(asset.imageUrl, filename);
                                                                                            setDownloadingId(null);
                                                                                        }}
                                                                                        className="w-full px-2 py-2.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5 hover:bg-blue-700"
                                                                                    >
                                                                                        {downloadingId === asset.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                                                                        Save
                                                                                    </button>
                                                                                </div>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                                {libraryHasMore && (
                                                    <div className="mt-8 flex justify-center">
                                                        <button 
                                                            onClick={() => selectedInfluencer && fetchLibrary(selectedInfluencer._id, libraryPage + 1, libraryTypeFilter)}
                                                            disabled={libraryLoading}
                                                            className="px-8 py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                                                        >
                                                            {libraryLoading ? 'Chargement...' : 'Voir plus'}
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col gap-8">
                                        {/* FILTER BAR */}
                                        <div className="flex flex-wrap items-center justify-between gap-6 p-6 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                                            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                                                {[
                                                    { id: 'active', label: t('influencers.studio.viewActive'), icon: Users },
                                                    { id: 'draft', label: t('influencers.studio.viewDrafts'), icon: Target }
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setFilterStatus(tab.id as any)}
                                                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === tab.id ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                    >
                                                        <tab.icon className="w-4 h-4" />
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {[
                                                    { id: 'skinTone', label: t('influencers.studio.filters.skin'), options: ['pale', 'fair', 'tan', 'olive', 'dark', 'deep'] },
                                                    { id: 'eyeColor', label: t('influencers.studio.filters.eyes'), options: ['blue', 'green', 'hazel', 'brown', 'grey'] },
                                                    { id: 'hairColor', label: t('influencers.studio.filters.hair'), options: ['blonde', 'brown', 'black', 'red', 'grey', 'white'] }
                                                ].map((filter) => (
                                                    <select
                                                        key={filter.id}
                                                        value={(filters as any)[filter.id]}
                                                        onChange={(e) => setFilters(prev => ({ ...prev, [filter.id]: e.target.value }))}
                                                        className="px-6 py-3 bg-white border border-gray-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                                                    >
                                                        <option value="">{filter.label}</option>
                                                        {filter.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                ))}
                                                {(filters.skinTone || filters.eyeColor || filters.hairColor) && (
                                                    <button onClick={() => setFilters({ gender: '', skinTone: '', eyeColor: '', hairColor: '' })} className="p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-100 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                                            <AnimatePresence>
                                                {influencers.map(inf => (
                                                    <motion.div key={inf._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="group cursor-pointer" onClick={() => setSelectedInfluencer(inf)}>
                                                        <div className="aspect-[3/4] rounded-[3rem] overflow-hidden bg-white border border-gray-100 shadow-sm group-hover:shadow-2xl transition-all duration-500 relative">
                                                            <img src={inf.avatarUrl} className="w-full h-full object-cover transition-all duration-700" alt={inf.name} />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                                            <div className="absolute bottom-6 left-6 right-6 text-white text-center">
                                                                <h3 className="text-[10px] font-black uppercase tracking-widest mb-1">{inf.name}</h3>
                                                                <p className="text-[7px] font-bold uppercase tracking-widest text-white/50">
                                                                    {(inf as any).photosCount || 0}P • {(inf as any).videosCount || 0}V
                                                                </p>
                                                            </div>
                                                            <div className="absolute top-4 left-4 min-w-[24px] h-6 px-1.5 bg-blue-600 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg border border-blue-400">
                                                                {(inf as any).assetsCount || 0}
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(inf._id); }} className="absolute top-4 right-4 p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                                <button onClick={() => setShowCreateForm(true)} className="aspect-[3/4] rounded-[3rem] border-4 border-dashed border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center group">
                                                    <Plus className="w-12 h-12 text-gray-200 group-hover:text-blue-400 transition-all" />
                                                    <span className="text-[9px] font-black text-gray-300 uppercase mt-4 tracking-[0.3em]">{t('influencers.add')}</span>
                                                </button>
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>

                <VideoPreviewModal
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                />

                <AdvancedStudioModal
                    isOpen={showAdvancedStudio}
                    onClose={() => setShowAdvancedStudio(false)}
                    t={t}
                    gender={gender} setGender={setGender}
                    skinTone={skinTone} setSkinTone={setSkinTone}
                    eyeColor={eyeColor} setEyeColor={setEyeColor}
                    hairColor={hairColor} setHairColor={setHairColor}
                    hairStyle={hairStyle} setHairStyle={setHairStyle}
                    age={age} setAge={setAge}
                    name={name} setName={setName}
                    previewImage={studioPreview}
                    isLoading={studioLoading}
                    onGenerate={async () => {
                        console.log(`📸 [STUDIO] Generating preview | aesthetic=${aesthetic} | gender=${gender} | age=${age}`);
                        setStudioLoading(true);
                        try {
                            const res = await influencerService.previewGenerateImage({
                                gender, 
                                hair: { color: hairColor, style: hairStyle, length: hairLength } as any, 
                                skin: { tone: skinTone }, 
                                eyes: { color: eyeColor }, 
                                age,
                                aesthetic 
                            });
                            if (res.success) {
                                console.log(`✅ [STUDIO] Preview generated successfully`);
                                setStudioPreview(res.imageUrl);
                            }
                        } catch (e) { 
                            console.error(`❌ [STUDIO] Preview failed`, e);
                            showToast('Erreur génération', 'error'); 
                        }
                        finally { setStudioLoading(false); }
                    }}
                    onSave={async (status: string) => {
                        if (!studioPreview) return;
                        setIsSaving(true);
                        try {
                            const res = await influencerService.createInfluencer({ 
                                name: name || 'IA Influencer', 
                                gender, 
                                age, 
                                avatarUrl: studioPreview, 
                                skin: { tone: skinTone }, 
                                eyes: { color: eyeColor }, 
                                hair: { color: hairColor, style: hairStyle, length: hairLength } as any,                                
                                status: status as any,
                                config: { aesthetic } as any
                            });
                            if (res.success) {
                                showToast(status === 'draft' ? 'Enregistré en brouillon' : 'Influenceur créé !', 'success');
                                setShowAdvancedStudio(false);
                                setStudioPreview(null);
                                loadInfluencers();
                            }
                        } catch (e) { showToast('Erreur sauvegarde', 'error'); }
                        finally { setIsSaving(false); }
                    }}
                    aesthetic={aesthetic} setAesthetic={setAesthetic}
                    hairLength={hairLength} setHairLength={setHairLength}
                />

                <AdChoiceModal
                    isOpen={showAdModal}
                    onClose={() => setShowAdModal(false)}
                    onChoice={(type) => {
                        if (selectedInfluencer) {
                            sessionStorage.setItem('generationIntent', 'advertisement');
                            if (type === 'video') {
                                handleAnimateInfluencer(selectedInfluencer);
                            } else {
                                // Redirection vers Fusion d'image pour les publicités photo
                                sessionStorage.setItem('generateSourceType', 'influencer');
                                sessionStorage.setItem('generateInfluencerId', selectedInfluencer._id);
                                sessionStorage.setItem('generateInfluencerName', selectedInfluencer.name);
                                sessionStorage.setItem('generateInfluencerImageUrl', selectedInfluencer.avatarUrl || '');
                                router.push('/image-fusion?source=influencer&intent=advertisement');
                            }
                            setShowAdModal(false);
                        }
                    }}
                />

                <Footer />

                {
                    generatingContent && (
                        <div className="fixed inset-0 z-50">
                            <PremiumLoading stage="Propulsion V3 Core Engine" subtext="Génération de contenu ultra-haute fidélité..." />
                        </div>
                    )
                }
            </div >
        </ProtectedRoute >
    );
}

// VideoPreviewModal is now a shared component at @/components/VideoPreviewModal

const AdvancedStudioModal = ({ isOpen, onClose, t, gender, setGender, skinTone, setSkinTone, eyeColor, setEyeColor, hairColor, setHairColor, hairStyle, setHairStyle, hairLength, setHairLength, age, setAge, name, setName, previewImage, isLoading, onGenerate, onSave, aesthetic, setAesthetic }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[4rem] p-10 max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
                <button onClick={onClose} className="absolute top-8 right-8 flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all group z-10 border border-gray-100">
                    <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-900 transition-colors">Fermer</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left: Controls */}
                    <div className="flex-1 space-y-10">
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{t('influencers.studio.title')}</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('influencers.studio.subtitle')}</p>
                        </div>

                        <div className="space-y-8">
                            {/* Name & Age */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('influencers.studio.nameLabel')}</label>
                                    <input value={name} onChange={e => setName(e.target.value)} placeholder={t('influencers.studio.namePlaceholder')} className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 focus:border-blue-500 outline-none font-bold text-black" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">{t('influencers.studio.ageLabel')} ({age})</label>
                                    <input type="range" min="18" max="60" value={age} onChange={e => setAge(parseInt(e.target.value))} className="w-full accent-blue-600" />
                                </div>
                            </div>

                            {/* Attributes Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-blue-600" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Style de Rendu (Photoréalisme)</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => setAesthetic('photorealistic')}
                                            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${aesthetic === 'photorealistic' ? 'border-blue-600 bg-white shadow-lg' : 'border-transparent bg-white/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Real Human</span>
                                            <span className="text-[8px] font-bold text-gray-400 leading-tight">Portrait ultra-réaliste, qualité photo DSLR</span>
                                        </button>
                                        <button 
                                            onClick={() => setAesthetic('cartoon')}
                                            className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col gap-1 ${aesthetic === 'cartoon' ? 'border-indigo-600 bg-white shadow-lg' : 'border-transparent bg-white/50 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'}`}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">Cartoon</span>
                                            <span className="text-[8px] font-bold text-gray-400 leading-tight">Style animation 3D, Disney / Pixar look</span>
                                        </button>
                                    </div>
                                </div>

                                {[
                                    { label: t('influencers.studio.attributes.gender'), id: 'gender', value: gender, set: setGender, options: ['man', 'woman'], icon: User },
                                    { label: t('influencers.studio.attributes.skin'), id: 'skin', value: skinTone, set: setSkinTone, options: ['pale', 'fair', 'tan', 'olive', 'dark', 'deep'], icon: Sparkles },
                                    { label: t('influencers.studio.attributes.eyes'), id: 'eyes', value: eyeColor, set: setEyeColor, options: ['blue', 'green', 'hazel', 'brown', 'grey'], icon: Eye },
                                    { label: t('influencers.studio.attributes.hair'), id: 'hair', value: hairColor, set: setHairColor, options: ['blonde', 'brown', 'black', 'red', 'grey', 'white'], icon: Scissors },
                                    { label: "Longueur", id: 'hairLength', value: hairLength, set: setHairLength, options: ['short', 'medium', 'long'], icon: Scissors }
                                ].map((attr) => (
                                    <div key={attr.id} className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <attr.icon className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{attr.label}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {attr.options.map(opt => (
                                                <button key={opt} onClick={() => attr.set(opt as any)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${attr.value === opt ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                                    {opt.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button onClick={onGenerate} disabled={isLoading} className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                            {t('influencers.studio.generate')}
                        </button>
                    </div>

                    {/* Right: Preview & Actions */}
                    <div className="w-full lg:w-[400px] space-y-8">
                        <div className="aspect-[3/4] bg-gray-50 rounded-[3rem] overflow-hidden border border-gray-100 relative shadow-inner">
                            {previewImage ? (
                                <img src={previewImage} className="w-full h-full object-cover animate-in fade-in duration-700" alt="Studio Preview" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 p-12 text-center">
                                    <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 mb-6 flex items-center justify-center">
                                        <Camera className="w-8 h-8" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('influencers.studio.previewEmpty')}</p>
                                </div>
                            )}
                            {previewImage && !isLoading && (
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Identity Engine Active</span>
                                    </div>
                                </div>
                            )}
                            {isLoading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <PremiumLoading stage="Gemini Banana V3" subtext="Reconstruction faciale..." />
                                </div>
                            )}
                        </div>

                        {previewImage && !isLoading && (
                            <div className="flex flex-col gap-3">
                                <button onClick={() => onSave('active')} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-200">
                                    {t('influencers.add')}
                                </button>
                                <button onClick={() => onSave('draft')} className="w-full py-5 bg-white border border-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50">
                                    {t('influencers.studio.saveDraft')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const AdChoiceModal = ({ isOpen, onClose, onChoice }: { isOpen: boolean, onClose: () => void, onChoice: (type: 'photo' | 'video') => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                className="bg-white rounded-[3.5rem] p-10 max-w-2xl w-full shadow-2xl relative border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all">
                    <X className="w-5 h-5 text-gray-400" />
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Choisir le Format Publicitaire</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Boostez votre reach avec des créations IA sur mesure</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                        onClick={() => onChoice('photo')}
                        className="group p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-blue-600 transition-all text-center flex flex-col items-center gap-4 hover:shadow-2xl hover:bg-white"
                    >
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <ImageIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-900 block uppercase">Publicité Photo</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Format Statique HD</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => onChoice('video')}
                        className="group p-8 bg-gray-50 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-600 transition-all text-center flex flex-col items-center gap-4 hover:shadow-2xl hover:bg-white"
                    >
                        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <Video className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-sm font-black text-gray-900 block uppercase">Publicité Vidéo</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sora v2 Motion High-Fi</span>
                        </div>
                    </button>
                </div>

                <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                        Annuler
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
