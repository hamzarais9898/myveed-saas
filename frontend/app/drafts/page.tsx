'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoCard from '@/components/VideoCard';
import { getVideos, deleteVideo } from '@/services/videoService';
import { VideoCardSkeleton } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trash2, Calendar, Send, Play, LayoutGrid, Type, Search, Layout } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { MagicWandIcon, ScheduledIcon } from '@/components/ModernIcons';

export default function DraftsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [videos, setVideos] = useState<any[]>([]);
    const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [videos, dateFilter, searchQuery]);

    const loadData = async () => {
        try {
            const [videosResponse] = await Promise.all([
                getVideos()
            ]);
            const allVideos = videosResponse.videos || [];
            setVideos(allVideos.filter((v: any) => v.status === 'generated'));
        } catch (error) {
            console.error('Error loading drafts:', error);
            showToast(t('common.errorLoadingData'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...videos];

        // Date Filter
        const now = new Date();
        if (dateFilter === 'today') {
            filtered = filtered.filter(v => {
                const d = new Date(v.createdAt);
                return d.toDateString() === now.toDateString();
            });
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(v => new Date(v.createdAt) >= weekAgo);
        } else if (dateFilter === 'month') {
            const monthAgo = new Date(new Date().setMonth(now.getMonth() - 1));
            filtered = filtered.filter(v => new Date(v.createdAt) >= monthAgo);
        }

        // Search Filter
        if (searchQuery) {
            filtered = filtered.filter(v =>
                v.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.prompt?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredVideos(filtered);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce brouillon ?')) return;
        try {
            await deleteVideo(id);
            showToast('Brouillon supprimé', 'success');
            await loadData();
        } catch (error) {
            showToast('Erreur lors de la suppression', 'error');
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#fafafa] selection:bg-[#c77ddf]/20">
                <Navbar />

                <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center space-x-2 bg-purple-500/5 border border-purple-500/10 rounded-full px-4 py-1.5 mb-6"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-[#c77ddf]" />
                                <span className="text-[10px] font-black text-[#c77ddf] tracking-[0.2em] uppercase">{t('shorts.drafts.title')}</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tighter"
                            >
                                Mes <span className="bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">Brouillons</span>
                            </motion.h1>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{filteredVideos.length} {t('shorts.drafts.itemsFound')}</p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[2rem] shadow-sm border border-gray-100">
                            {/* Search */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#c77ddf] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#e2a9f1]/20 w-48 transition-all"
                                />
                            </div>

                            <div className="h-8 w-px bg-gray-100" />

                            {/* Date Filter */}
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                {[
                                    { id: 'all', label: t('shorts.drafts.filters.all') },
                                    { id: 'today', label: t('shorts.drafts.filters.today') },
                                    { id: 'week', label: t('shorts.drafts.filters.week') }
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => setDateFilter(f.id as any)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${dateFilter === f.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-8 w-px bg-gray-100" />

                            {/* View Switcher */}
                            <div className="flex bg-gray-50 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                                >
                                    <Layout className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Content */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5].map(i => <VideoCardSkeleton key={i} />)}
                        </div>
                    ) : filteredVideos.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-[3rem] p-16 border border-gray-100 text-center"
                        >
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <MagicWandIcon className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Aucun résultat</h3>
                            <p className="text-gray-400 text-sm mb-8">Essayez de modifier vos filtres ou créez un nouveau contenu.</p>
                            <button
                                onClick={() => router.push('/shorts')}
                                className="px-8 py-4 bg-black text-white font-black rounded-2xl shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-[10px]"
                            >
                                Créer un Short
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            layout
                            className={viewMode === 'grid'
                                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                                : "space-y-4"
                            }
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredVideos.map((video) => (
                                    <motion.div
                                        key={video._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        {viewMode === 'grid' ? (
                                            <div className="group relative bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500">
                                                {/* Preview */}
                                                <div className="aspect-[9/16] bg-black relative">
                                                    <video
                                                        src={video.videoUrl}
                                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                        muted
                                                        onMouseEnter={e => (e.target as any).play()}
                                                        onMouseLeave={e => (e.target as any).pause()}
                                                    />
                                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                                    {/* Floating Badge */}
                                                    <div className="absolute top-4 left-4">
                                                        <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                                                            Draft
                                                        </span>
                                                    </div>

                                                    {/* Delete Button (Quick Action) */}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(video.id || video._id); }}
                                                        className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500 backdrop-blur-md text-red-500 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Info & Basic Actions */}
                                                <div className="p-4 space-y-4">
                                                    <div>
                                                        <h4 className="text-xs font-black text-gray-900 truncate mb-1">{video.title || "Sans titre"}</h4>
                                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                                            {new Date(video.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => router.push(`/shorts?edit=${video.id || video._id}`)}
                                                            className="py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-900 font-black rounded-xl transition-all uppercase tracking-widest text-[8px] flex items-center justify-center gap-1.5"
                                                        >
                                                            Modifier
                                                        </button>
                                                        <button
                                                            onClick={() => router.push('/dashboard')}
                                                            className="py-2.5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-black rounded-xl transition-all uppercase tracking-widest text-[8px] flex items-center justify-center gap-1.5 shadow-sm"
                                                        >
                                                            Publier
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* List View Row */
                                            <div className="group bg-white rounded-2xl p-3 border border-gray-100 hover:border-[#e2a9f1]/30 hover:shadow-lg transition-all flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0">
                                                        <video src={video.videoUrl} className="w-full h-full object-cover" muted />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-black text-gray-900 truncate">{video.title || "Sans titre"}</h4>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Généré le {new Date(video.createdAt).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-[#c77ddf]">TikTok Short</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => router.push(`/shorts?edit=${video.id || video._id}`)} className="px-4 py-2 hover:bg-gray-50 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Infos</button>
                                                    <button onClick={() => router.push(`/shorts?edit=${video.id || video._id}`)} className="p-2.5 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all"><LayoutGrid className="w-4 h-4" /></button>
                                                    <button onClick={() => router.push('/dashboard')} className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-black transition-all"><Calendar className="w-4 h-4" /></button>
                                                    <button onClick={() => router.push('/dashboard')} className="p-2.5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white rounded-xl shadow-md active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
                                                    <div className="h-6 w-px bg-gray-100 mx-2" />
                                                    <button onClick={() => handleDelete(video.id || video._id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>

                <Footer />
            </div>
        </ProtectedRoute>
    );
}
