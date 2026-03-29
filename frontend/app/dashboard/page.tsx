'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import VideoCard from '@/components/VideoCard';
import PhotoCard from '@/components/PhotoCard';
import BatchScheduleModal from '@/components/BatchScheduleModal';
import { getVideos, deleteVideo, deleteAllVideos } from '@/services/videoService';
import { getImages, deleteImage } from '@/services/imageService';
import { getPlatformStatus } from '@/services/platformService';
import Skeleton, { VideoCardSkeleton } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, CreditCard, Filter, LayoutGrid, Image as ImageIcon, Video as VideoIcon, Film } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { YouTubeIcon, ShortsIcon, ScheduledIcon, PublishedIcon, MagicWandIcon, TikTokIcon } from '@/components/ModernIcons';

const ITEMS_PER_PAGE = 6;

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [videos, setVideos] = useState<any[]>([]);
    const [photos, setPhotos] = useState<any[]>([]);
    const [tiktokAccounts, setTiktokAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assetType, setAssetType] = useState<'videos' | 'photos' | 'series'>('videos');
    const [filter, setFilter] = useState<'all' | 'youtube' | 'short'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'generated' | 'scheduled' | 'published'>('all');
    const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'true') {
            showToast(t('dashboard.trialTitle') + ' 🚀', 'success');
            const url = new URL(window.location.href);
            url.searchParams.delete('success');
            url.searchParams.delete('session_id');
            window.history.replaceState({}, '', url.toString());
        }
    }, [searchParams]);

    useEffect(() => {
        loadData();

        const intervalId = setInterval(() => {
            const hasProcessingVideos = videos.some(v =>
                ['generating', 'transcribing', 'editing', 'finishing', 'processing', 'pending'].includes(v.status)
            );
            const hasProcessingPhotos = photos.some(p => p.status === 'processing');

            if (hasProcessingVideos || hasProcessingPhotos || (videos.length === 0 && photos.length === 0)) {
                loadData();
            }
        }, 5000);

        return () => clearInterval(intervalId);
    }, [videos.length, photos.length]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filter, statusFilter]);

    const loadData = async () => {
        try {
            const [videosResponse, photosResponse, platformStatus] = await Promise.all([
                getVideos(),
                getImages(),
                getPlatformStatus()
            ]);
            setVideos(videosResponse.videos || []);
            setPhotos(photosResponse.images || []);
            setTiktokAccounts(platformStatus.tiktok ? [platformStatus.tiktok] : []);
        } catch (error: any) {
            console.error('Error loading data:', error);
            const errStr = error.response ? JSON.stringify(error.response.data) : error.message;
            showToast(`Erreur Dashboard: ${errStr.substring(0, 100)}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('dashboard.actions.confirmDelete', { type: assetType === 'videos' ? t('dashboard.actions.typeVideos') : t('dashboard.actions.typePhotos') }))) return;
        try {
            if (assetType === 'videos') {
                await deleteVideo(id);
            } else {
                await deleteImage(id);
            }
            showToast(t('dashboard.actions.deleteAll') + ' ✓', 'success');
            await loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            showToast(t('common.errorLoadingData'), 'error');
        }
    };

    const handleDeleteAll = async () => {
        try {
            await deleteAllVideos();
            await loadData();
        } catch (error) {
            console.error('Error deleting all videos:', error);
        }
    };

    const toggleVideoSelection = (id: string) => {
        setSelectedVideoIds(prev =>
            prev.includes(id) ? prev.filter(vId => vId !== id) : [...prev, id]
        );
    };

    const handleBatchSuccess = () => {
        setSelectedVideoIds([]);
        loadData();
    };

    // Filter videos/photos
    const filteredItems = assetType === 'videos'
        ? videos.filter(video => {
            if (filter !== 'all' && video.format !== filter) return false;
            if (statusFilter !== 'all' && video.status !== statusFilter) return false;
            return true;
        })
        : photos;

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Stats
    const stats = {
        total: videos.length + photos.length,
        videos: videos.length,
        photos: photos.length,
        series: 0, // Mock for now
        scheduled: videos.filter(v => v.status === 'scheduled').length,
        published: videos.filter(v => v.status === 'published').length
    };

    // Animation variants — more modern with blur + spring
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 24, scale: 0.97, filter: 'blur(4px)' },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            transition: { type: 'spring' as const, stiffness: 400, damping: 28, mass: 0.8 }
        }
    };

    const slideIn = {
        hidden: { opacity: 0, x: -16 },
        visible: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white selection:bg-[#e2a9f1]/20">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-gray-900">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="mb-8"
                    >
                        <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-2">
                            {t('dashboard.title')}
                        </h1>
                        <p className="text-gray-600">{t('dashboard.subtitle')}</p>
                    </motion.div>

                    {/* Free Trial CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 26 }}
                        className="mb-8 p-6 bg-gradient-to-r from-[#e2a9f1]/10 via-white to-[#c77ddf]/10 rounded-2xl border border-[#e2a9f1]/20 shadow-lg"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-2xl flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{t('dashboard.trialTitle')}</h3>
                                    <p className="text-sm text-gray-600">{t('dashboard.trialSubtitle')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 opacity-60">
                                    <div className="h-6 px-2 bg-[#635BFF] rounded flex items-center">
                                        <span className="text-white text-xs font-bold tracking-tight">stripe</span>
                                    </div>
                                    <div className="h-6 px-2 bg-[#1A1F71] rounded flex items-center">
                                        <span className="text-white text-xs font-bold italic">VISA</span>
                                    </div>
                                    <div className="h-6 w-10 bg-gray-100 rounded flex items-center justify-center">
                                        <div className="flex">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1"></div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push('/subscriptions')}
                                    className="px-6 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    {t('dashboard.trialCta')}
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
                    >
                        {[
                            { value: stats.total, label: t('dashboard.stats.total'), icon: <LayoutGrid className="w-5 h-5" />, color: 'text-gray-400' },
                            { value: stats.videos, label: t('dashboard.stats.videos'), icon: <VideoIcon className="w-5 h-5" />, color: 'text-indigo-500' },
                            { value: stats.photos, label: t('dashboard.stats.photos'), icon: <ImageIcon className="w-5 h-5" />, color: 'text-blue-500' },
                            { value: stats.series, label: "Séries IA", icon: <Film className="w-5 h-5" />, color: 'text-[#e2a9f1]' },
                            { value: stats.published, label: t('dashboard.stats.published'), icon: <PublishedIcon className="w-5 h-5" />, color: 'text-emerald-500' }
                        ].map((stat) => (
                            <motion.div
                                key={stat.label}
                                variants={itemVariants}
                                whileHover={{ scale: 1.04, y: -3, transition: { type: 'spring', stiffness: 500, damping: 20 } }}
                                className="group p-4 bg-white border border-gray-100 rounded-xl hover:border-[#e2a9f1] hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={stat.color}>{stat.icon}</div>
                                </div>
                                <div className={`text-2xl font-black mb-1 ${stat.color || 'text-gray-900'}`}>
                                    {stat.value}
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{stat.label}</div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Main Tabs */}
                    <div className="flex space-x-4 mb-8">
                        <button
                            onClick={() => setAssetType('videos')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${assetType === 'videos'
                                ? 'bg-black text-white shadow-xl scale-105'
                                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <VideoIcon className="w-5 h-5" />
                            {t('dashboard.tabs.videos')}
                        </button>
                        <button
                            onClick={() => setAssetType('photos')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${assetType === 'photos'
                                ? 'bg-black text-white shadow-xl scale-105'
                                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <ImageIcon className="w-5 h-5" />
                            {t('dashboard.tabs.photos')}
                        </button>
                        <button
                            onClick={() => setAssetType('series')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${assetType === 'series'
                                ? 'bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white shadow-xl scale-105 border border-[#e2a9f1]/20'
                                : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <Film className="w-5 h-5 text-[#e2a9f1]" />
                            Séries IA
                        </button>
                    </div>

                    {/* Filters - Only for Videos */}
                    {assetType === 'videos' && (
                        <motion.div
                            variants={slideIn}
                            initial="hidden"
                            animate="visible"
                            className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white rounded-xl border border-gray-100"
                        >
                            <div className="flex items-center gap-2 text-gray-500">
                                <Filter className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('dashboard.filters.label')}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'youtube', 'short'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${filter === f
                                            ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white shadow-md'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {f === 'youtube' && <YouTubeIcon className="w-4 h-4" />}
                                        {f === 'short' && <ShortsIcon className="w-4 h-4" />}
                                        {f === 'all' ? t('dashboard.filters.all') : f === 'youtube' ? t('dashboard.filters.youtube') : t('dashboard.filters.shorts')}
                                    </button>
                                ))}
                            </div>
                            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'generated', 'scheduled', 'published'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${statusFilter === s
                                            ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white shadow-md'
                                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {s === 'generated' && <MagicWandIcon className="w-3 h-3" />}
                                        {s === 'scheduled' && <ScheduledIcon className="w-3 h-3" />}
                                        {s === 'published' && <PublishedIcon className="w-3 h-3" />}
                                        {s === 'all' ? t('dashboard.filters.all')
                                            : s === 'generated' ? t('dashboard.filters.generated')
                                                : s === 'scheduled' ? t('dashboard.filters.scheduled')
                                                    : t('dashboard.filters.published')}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Actions */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 24 }}
                        className="flex flex-wrap items-center gap-3 mb-6"
                    >
                        <button
                            onClick={() => router.push('/generate')}
                            className="px-6 py-3 bg-black text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl hover:bg-gray-900 flex items-center gap-3 uppercase tracking-widest text-xs"
                        >
                            <MagicWandIcon className="w-5 h-5 text-[#e2a9f1]" />
                            {t('dashboard.actions.generate')}
                        </button>
                        <button
                            onClick={() => router.push('/image-fusion')}
                            className="px-6 py-3 bg-white text-gray-900 font-black rounded-xl border-2 border-gray-100 hover:border-[#e2a9f1] transition-all flex items-center gap-3 uppercase tracking-widest text-xs shadow-sm hover:shadow-md"
                        >
                            <Sparkles className="w-5 h-5 text-[#c77ddf]" />
                            {t('common.nav.imageFusion') || 'Fusion d\'Images'}
                        </button>
                        <button
                            onClick={() => router.push('/tiktok-accounts')}
                            className="px-6 py-3 bg-white text-gray-900 font-black rounded-xl border-2 border-gray-100 hover:border-[#e2a9f1] transition-all flex items-center gap-3 uppercase tracking-widest text-xs shadow-sm hover:shadow-md"
                        >
                            <TikTokIcon className="w-5 h-5 text-[#c77ddf]" />
                            TikTok ({tiktokAccounts.length})
                        </button>

                        {selectedVideoIds.length > 0 && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => setShowBatchModal(true)}
                                className="px-6 py-3 bg-[#c77ddf] hover:bg-[#b06cc9] text-white font-black rounded-xl shadow-lg flex items-center gap-3 uppercase tracking-widest text-xs transition-all"
                            >
                                <ScheduledIcon className="w-5 h-5" />
                                {t('dashboard.actions.schedule')} {selectedVideoIds.length}
                            </motion.button>
                        )}

                        {((assetType === 'videos' && videos.length > 0) || (assetType === 'photos' && photos.length > 0)) && (
                            <button
                                onClick={() => {
                                    if (confirm(t('dashboard.actions.confirmDelete', { type: assetType === 'videos' ? t('dashboard.actions.typeVideos') : t('dashboard.actions.typePhotos') }))) {
                                        if (assetType === 'videos') handleDeleteAll();
                                    }
                                }}
                                className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-black rounded-xl shadow-sm hover:shadow-md flex items-center gap-3 uppercase tracking-widest text-xs transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                {t('dashboard.actions.deleteAll')}
                            </button>
                        )}

                        <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {filteredItems.length} {assetType === 'videos' ? t('dashboard.stats.videos').toLowerCase() : assetType === 'photos' ? t('dashboard.stats.photos').toLowerCase() : 'séries'} • Page {currentPage}/{totalPages || 1}
                        </div>
                    </motion.div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <VideoCardSkeleton key={i} />)}
                        </div>
                    ) : filteredItems.length === 0 || assetType === 'series' ? (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                            className="text-center py-24 bg-white/50 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-gray-100"
                        >
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                {assetType === 'videos' ? <MagicWandIcon className="w-10 h-10 text-gray-300" /> : assetType === 'photos' ? <ImageIcon className="w-10 h-10 text-gray-300" /> : <Film className="w-10 h-10 text-[#e2a9f1] opacity-70" />}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">
                                {assetType === 'videos'
                                    ? (videos.length === 0 ? t('dashboard.empty.noVideos') : t('dashboard.empty.noResults'))
                                    : assetType === 'photos' ? (photos.length === 0 ? t('dashboard.empty.noPhotos') : t('dashboard.empty.noResults')) : 'Aucune série IA'}
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">
                                {assetType === 'videos'
                                    ? (videos.length === 0 ? t('dashboard.empty.videosCta') : t('dashboard.empty.filterHint'))
                                    : assetType === 'photos' ? (photos.length === 0 ? t('dashboard.empty.photosCta') : t('dashboard.empty.filterHint')) : 'Lancez votre propre mini-série ou saga avec MAVEED IA Studio.'}
                            </p>
                            {(assetType === 'videos' ? videos.length === 0 : assetType === 'photos' ? photos.length === 0 : true) && (
                                <button
                                    onClick={() => router.push(assetType === 'series' ? '/studio' : '/generate')}
                                    className={`px-8 py-4 ${assetType === 'series' ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-black shadow-[#e2a9f1]/30' : 'bg-black text-white hover:bg-gray-900'} font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-sm active:scale-95`}
                                >
                                    {assetType === 'videos' ? t('dashboard.empty.generateVideo') : assetType === 'photos' ? t('dashboard.empty.generatePhoto') : 'Créer ma première série'}
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <>
                            {/* Items Grid */}
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                            >
                                <AnimatePresence mode="popLayout">
                                    {paginatedItems.map((item) => (
                                        <motion.div
                                            key={item.id || item._id}
                                            variants={itemVariants}
                                            layout
                                            exit={{ opacity: 0, scale: 0.85, filter: 'blur(4px)' }}
                                        >
                                            {assetType === 'videos' ? (
                                                <VideoCard
                                                    video={item}
                                                    onDelete={handleDelete}
                                                    onUpdate={loadData}
                                                    tiktokAccounts={tiktokAccounts}
                                                    selected={selectedVideoIds.includes(item.id)}
                                                    onSelect={toggleVideoSelection}
                                                    compact={true}
                                                />
                                            ) : (
                                                <PhotoCard
                                                    photo={item}
                                                    onDelete={handleDelete}
                                                    compact={true}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center justify-center gap-2 mt-12"
                                >
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-3 rounded-xl bg-white border-2 border-gray-100 hover:border-[#e2a9f1] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`w-12 h-12 rounded-xl font-black text-sm transition-all ${currentPage === page
                                                ? 'bg-black text-white shadow-xl scale-110'
                                                : 'bg-white border-2 border-gray-100 text-gray-400 hover:border-[#e2a9f1] hover:text-gray-900'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-3 rounded-xl bg-white border-2 border-gray-100 hover:border-[#e2a9f1] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </button>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>

                {showBatchModal && (
                    <BatchScheduleModal
                        videoIds={selectedVideoIds}
                        tiktokAccounts={tiktokAccounts}
                        onSuccess={handleBatchSuccess}
                        onClose={() => setShowBatchModal(false)}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="w-10 h-10 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
