'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
    Clapperboard, 
    ChevronLeft, 
    Film, 
    Sparkles, 
    Calendar,
    Wand2,
    PlayCircle,
    Users
} from 'lucide-react';
import { getAllStudioSeasons } from '@/services/studioService';

export default function StudioLibrary() {
    const router = useRouter();
    const [seasons, setSeasons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchSeasons = async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            else setLoadingMore(true);

            const data = await getAllStudioSeasons(pageNum, 12);
            if (data.success) {
                if (append) {
                    setSeasons(prev => [...prev, ...data.seasons]);
                } else {
                    setSeasons(data.seasons);
                }
                setTotalPages(data.pagination?.pages || 1);
                setError('');
            }
        } catch (err: any) {
            setError(err.message || 'Impossible de charger vos saisons.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchSeasons(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchSeasons(nextPage, true);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date inconnue';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'ready':
                return { 
                    label: 'Prêt', 
                    color: 'text-green-400', 
                    bg: 'bg-green-400/10', 
                    border: 'border-green-400/20',
                    icon: <Clapperboard className="w-3 h-3" />
                };
            case 'generating':
                return { 
                    label: 'Génération en cours', 
                    color: 'text-[#e2a9f1]', 
                    bg: 'bg-[#e2a9f1]/10', 
                    border: 'border-[#e2a9f1]/20',
                    icon: <Wand2 className="w-3 h-3 animate-pulse" />
                };
            case 'failed':
                return { 
                    label: 'Échec IA', 
                    color: 'text-red-400', 
                    bg: 'bg-red-400/10', 
                    border: 'border-red-400/20',
                    icon: <span className="w-2 h-2 rounded-full bg-red-400" />
                };
            default:
                return { 
                    label: 'Inconnu', 
                    color: 'text-gray-400', 
                    bg: 'bg-gray-400/10', 
                    border: 'border-gray-400/20',
                    icon: null
                };
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pt-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/studio')}
                        className="p-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] transition-all flex group"
                        title="Retour au Studio"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#e2a9f1] tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(226,169,241,0.3)]">
                            <Film className="w-3 h-3" /> Historique Studio
                        </div>
                        <h1 className="text-3xl font-black text-white">Mes Saisons</h1>
                    </div>
                </div>
            </div>

            {/* ERROR STATE */}
            {error && !loading && (
                <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-2xl flex items-center gap-3">
                    <span className="text-red-400 font-medium">{error}</span>
                    <button onClick={() => fetchSeasons(1)} className="ml-auto text-sm bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-lg transition-colors">Réessayer</button>
                </div>
            )}

            {/* LOADING STATE */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-[#151521] border border-gray-800 rounded-3xl p-6 h-[280px] flex flex-col animate-pulse">
                            <div className="h-6 w-3/4 bg-gray-800 rounded mb-4" />
                            <div className="h-4 w-1/4 bg-gray-800 rounded mb-6" />
                            <div className="space-y-2 mb-auto">
                                <div className="h-3 w-full bg-gray-800/50 rounded" />
                                <div className="h-3 w-5/6 bg-gray-800/50 rounded" />
                                <div className="h-3 w-4/6 bg-gray-800/50 rounded" />
                            </div>
                            <div className="mt-6 flex justify-between items-end">
                                <div className="h-8 w-24 bg-gray-800 rounded-lg" />
                                <div className="h-10 w-28 bg-gray-800 rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && !error && seasons.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-[#151521]/50 border border-gray-800 border-dashed rounded-[3rem] shadow-inner"
                >
                    <div className="w-20 h-20 bg-gradient-to-br from-[#e2a9f1]/20 to-transparent rounded-full flex items-center justify-center mb-6 border border-[#e2a9f1]/10">
                        <Clapperboard className="w-10 h-10 text-[#e2a9f1] opacity-50" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Vous n'avez encore créé aucune saison</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        Votre bibliothèque est vide. Utilisez notre IA pour pitcher votre première idée et développer un univers complet en un clic.
                    </p>
                    <button 
                        onClick={() => router.push('/studio')}
                        className="px-8 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-black font-black rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-[0_0_20px_rgba(226,169,241,0.4)]"
                    >
                        <Sparkles className="w-4 h-4" />
                        Créer ma première saison
                    </button>
                </motion.div>
            )}

            {/* GRID OF SEASONS */}
            {!loading && seasons.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {seasons.map((season, i) => {
                            const config = getStatusConfig(season.status);
                            const episodeCount = season.episodes?.length || season.rawPromptInput?.episodeCount || 0;
                            const charCount = season.characters?.length || 0;
                            
                            return (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={season._id} 
                                    className="group bg-[#151521] border border-gray-800 hover:border-[#e2a9f1]/40 rounded-3xl p-6 flex flex-col transition-all shadow-lg hover:shadow-[0_0_30px_-5px_rgba(226,169,241,0.15)] relative overflow-hidden h-[300px]"
                                >
                                    {/* Hover glow */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#e2a9f1]/0 group-hover:bg-[#e2a9f1]/10 transition-colors rounded-full blur-3xl pointer-events-none" />

                                    {/* Header: Title & Badges */}
                                    <div className="flex justify-between items-start mb-3 gap-4">
                                        <h2 className="text-lg font-black text-white line-clamp-2 group-hover:text-[#e2a9f1] transition-colors">{season.title}</h2>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${config.bg} ${config.color} ${config.border}`}>
                                            {config.icon}
                                            {config.label}
                                        </div>
                                    </div>

                                    {/* Sub-info: Date & Format */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium mb-4">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(season.createdAt)}</span>
                                        <span className="px-2 py-0.5 bg-black/40 rounded border border-gray-800">{season.rawPromptInput?.targetFormat}</span>
                                        <span className="px-2 py-0.5 bg-black/40 rounded border border-gray-800">{season.rawPromptInput?.genre}</span>
                                    </div>

                                    {/* Pitch snippet */}
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-auto leading-relaxed">
                                        {season.pitch || season.rawPromptInput?.idea}
                                    </p>

                                    <div className="mt-6 pt-4 border-t border-gray-800/50 flex justify-between items-center">
                                        {/* Counters */}
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
                                            <div className="flex items-center gap-1.5" title="Nombre d'épisodes">
                                                <Film className="w-4 h-4" /> {episodeCount}
                                            </div>
                                            {charCount > 0 && (
                                                <div className="flex items-center gap-1.5" title="Nombre de personnages">
                                                    <Users className="w-4 h-4" /> {charCount}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        <button 
                                            onClick={() => router.push(`/studio/season/${season.seasonId}`)}
                                            className="px-5 py-2.5 bg-white hover:bg-gray-200 text-black text-sm font-black rounded-xl transition-colors flex items-center gap-2 active:scale-95"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            Ouvrir
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Pagination - Load More */}
                    {page < totalPages && (
                        <div className="mt-12 flex justify-center">
                            <button 
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-6 py-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] text-gray-300 font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {loadingMore ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        Chargement...
                                    </>
                                ) : (
                                    "Charger plus d'historique"
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
