'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllVideos } from '@/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

const VideoRow = ({ video, index }: any) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group hover:bg-gray-50/80 transition-all border-b border-gray-100"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden relative group-hover:scale-105 transition-transform shadow-inner">
                        {video.videoUrl ? (
                            <video src={video.videoUrl} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl bg-gray-50 text-gray-300">🎬</div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                            <button className="text-white text-[10px] font-black tracking-widest uppercase">VOIR</button>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 line-clamp-1 max-w-[300px] tracking-tight">{video.promptText || 'Sans prompt'}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{video.userId?.email || 'Utilisateur Inconnu'}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${video.format === 'short' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                    {video.format === 'short' ? 'FORMAT VERTICAL' : 'FORMAT STANDARD'}
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{video.provider}</span>
                    <span className={`w-2 h-2 rounded-full ${video.status === 'generated' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-gray-300'}`} />
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{(video.cost || 0).toFixed(2)}€</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest underline decoration-indigo-200">Coût</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">{(video.tokens || 0).toLocaleString()}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Jetons</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${video.status === 'generated' ? 'bg-emerald-100 text-emerald-700' :
                    video.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    {video.status === 'generated' ? 'GÉNÉRÉ' : video.status === 'failed' ? 'ÉCHEC' : 'EN COURS'}
                </span>
            </td>
            <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {new Date(video.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </td>
        </motion.tr>
    );
};

export default function AdminVideos() {
    const [videos, setVideos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        page: 1,
        limit: 50,
        status: '',
        provider: '',
        search: ''
    });
    const [stats, setStats] = useState({
        totalCost: 0,
        totalTokens: 0,
        avgCost: 0
    });

    const loadVideos = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllVideos(filters);
            if (response.success) {
                setVideos(response.videos);

                const totalC = response.videos.reduce((acc: number, v: any) => acc + (v.cost || 0), 0);
                const totalT = response.videos.reduce((acc: number, v: any) => acc + (v.tokens || 0), 0);
                setStats({
                    totalCost: totalC,
                    totalTokens: totalT,
                    avgCost: response.videos.length > 0 ? totalC / response.videos.length : 0
                });
            }
        } catch (error) {
            console.error('Error loading videos:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadVideos();
    }, [loadVideos]);

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestion des Contenus</h1>
                    <p className="text-gray-500 font-medium mt-1">Surveillance des générations IA et des coûts d&apos;infrastructure</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="px-6 py-4 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Coût Total Vision</p>
                        <p className="text-2xl font-black text-gray-900">{stats.totalCost.toFixed(2)}€</p>
                    </div>
                    <div className="px-6 py-4 bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Coût Moyen / Unité</p>
                        <p className="text-2xl font-black text-[#c77ddf]">{stats.avgCost.toFixed(2)}€</p>
                    </div>
                    <div className="hidden md:block px-6 py-4 bg-gray-900 rounded-3xl shadow-2xl shadow-gray-400/50">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Infrastructure</p>
                        <p className="text-2xl font-black text-emerald-400 text-center tracking-tighter">OPTIMISÉ</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un prompt ou un utilisateur..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full pl-16 pr-6 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all outline-none"
                        />
                    </div>
                    <select
                        value={filters.provider}
                        onChange={(e) => setFilters({ ...filters, provider: e.target.value, page: 1 })}
                        className="px-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                    >
                        <option value="">Tous les Moteurs</option>
                        <option value="runway">Runway Gen-3</option>
                        <option value="luma">Luma Dream</option>
                        <option value="veo">Google Veo</option>
                        <option value="banana">Imagen 3</option>
                        <option value="gemini">Gemini Pro</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                        className="px-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                    >
                        <option value="">Tout Statut</option>
                        <option value="generated">Généré ✅</option>
                        <option value="failed">Échec ❌</option>
                        <option value="generating">Calcul en cours ⏳</option>
                    </select>
                    <button
                        onClick={loadVideos}
                        className="p-5 bg-gray-900 text-white rounded-[1.8rem] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-400/40"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden text-left">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Accès au coffre-fort de données...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Asset / Détenteur</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Format</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Moteur</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Unité Infras.</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Statut</th>
                                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Horodatage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {videos.map((v, i) => (
                                        <VideoRow key={v._id} video={v} index={i} />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                        {videos.length === 0 && (
                            <div className="py-20 text-center">
                                <span className="text-5xl mb-6 block">📡</span>
                                <p className="text-gray-400 font-black uppercase text-sm tracking-widest">Aucun signal détecté sur cette fréquence</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
