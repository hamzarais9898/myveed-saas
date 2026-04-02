'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clapperboard, ChevronLeft, MoreVertical, Play, Clock, Wand2, Star, Sparkles, AlertCircle } from 'lucide-react';
import { getStudioSeason } from '@/services/studioService';

export default function StudioSeasonView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [season, setSeason] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSeason = async () => {
        try {
            const data = await getStudioSeason(params.id);
            if (data && data.success) {
                setSeason(data.season);
                setError('');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement de la saison.');
            setSeason(null);
        } finally {
            setLoading(false);
        }
    };

    // Polling logic
    useEffect(() => {
        // Fetch immediately on mount or status change
        fetchSeason();

        let intervalId: NodeJS.Timeout | null = null;
        
        // Only start polling if we haven't loaded yet or if it's currently generating
        if (!season || season.status === 'generating') {
            intervalId = setInterval(() => {
                fetchSeason();
            }, 3000);
        }

        // Cleanup interval on unmount or when status changes
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [params.id, season?.status]);

    // UI: Loading Skeleton
    if (loading && !season) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
                <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(226,169,241,0.5)]" />
                <h2 className="text-xl font-bold mb-2">Chargement du studio...</h2>
            </div>
        );
    }

    // UI: Error 
    if (error && !season) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white px-4">
                <AlertCircle className="w-16 h-16 text-red-500 mb-6 opacity-50" />
                <h2 className="text-2xl font-black mb-4">Erreur de chargement</h2>
                <p className="text-gray-400 mb-8 max-w-md text-center">{error}</p>
                <button onClick={() => router.push('/studio')} className="px-6 py-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] transition-all font-bold">Retour au Studio</button>
            </div>
        );
    }

    // UI: Generation Failed
    if (season?.status === 'failed') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white px-4">
                <div className="w-20 h-20 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black mb-2 text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Le réalisateur IA a échoué</h2>
                <p className="text-gray-400 mb-8 max-w-lg text-center">Une erreur innatendue est survenue lors de l'écriture du script ou de la création de la bible de la série.</p>
                
                <div className="p-4 bg-black/40 border border-red-900/50 rounded-xl mb-8 max-w-lg w-full">
                    <p className="text-xs text-red-400 font-mono text-center">{season.failReason || "Erreur de formatage JSON ou timeout d'OpenAI."}</p>
                </div>
                
                <button onClick={() => router.push('/studio')} className="px-8 py-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all font-black">Recommencer</button>
            </div>
        );
    }

    // UI: Generating Immersive Mode
    if (season?.status === 'generating') {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#e2a9f1]/10 rounded-full blur-[100px] pointer-events-none" />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 flex flex-col items-center text-center p-8 bg-[#151521] border border-[#e2a9f1]/20 rounded-3xl shadow-[0_0_50px_-15px_rgba(226,169,241,0.2)] max-w-xl w-full"
                >
                    <div className="w-20 h-20 relative mb-8">
                        <svg className="w-full h-full animate-[spin_4s_linear_infinite]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3e" strokeWidth="2" />
                            <circle 
                                cx="50" cy="50" r="45" fill="none" stroke="#e2a9f1" strokeWidth="2" 
                                strokeDasharray="100 183" 
                                className="opacity-80"
                            />
                        </svg>
                        <Sparkles className="w-8 h-8 text-[#e2a9f1] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-4">Écriture de la bible en cours...</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Notre IA analyse votre pitch pour générer l'univers, développer les personnages originaux et structurer les {season.rawPromptInput?.episodeCount || 5} épisodes.
                    </p>

                    <div className="w-full bg-black/40 rounded-xl p-4 text-left border border-gray-800 mb-6">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Votre Pitch</span>
                        <p className="text-sm text-gray-300 italic line-clamp-2">"{season.rawPromptInput?.idea || "Idée de série..."}"</p>
                    </div>

                    <div className="w-full text-left">
                        <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                            <span>Progression du modèle IA</span>
                            <span className="text-[#e2a9f1]">{season.progress || 10}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-blue-600 via-purple-500 to-[#e2a9f1]"
                                initial={{ width: "0%" }}
                                animate={{ width: `${season.progress || 10}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ======== UI: READY (Génération terminée) ========
    if (!season) return null;

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header with Breadcrumb */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => router.push('/studio')}
                    className="p-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] transition-all flex mt-1"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-[#e2a9f1] font-bold tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_rgba(226,169,241,0.5)]">
                        <Sparkles className="w-4 h-4" /> Saison Générée
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white">{season.title}</h1>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Serie Overview Info */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6 lg:col-span-1"
                >
                    <div className="bg-[#151521] border border-[#e2a9f1]/20 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_-10px_rgba(226,169,241,0.15)] relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#e2a9f1]/10 rounded-full blur-3xl" />
                        
                        <h3 className="text-lg font-bold text-white mb-2">Le Pitch</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">{season.pitch}</p>
                        
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-xs font-black uppercase text-gray-600 mb-2">Style Visuel</h4>
                                <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs text-gray-300 font-medium">
                                    {season.visualStyle}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-gray-600 mb-2">Règles du Monde</h4>
                                <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs text-gray-300 font-medium">
                                    {season.worldRules}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-[#c77ddf]" /> Personnages
                        </h3>
                        {season.characters && season.characters.length > 0 ? (
                            <div className="space-y-4">
                                {season.characters.map((char: any, idx: number) => (
                                    <div key={idx} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-black/40 transition-colors border border-transparent hover:border-gray-800">
                                        <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center font-bold text-[#e2a9f1] shadow-inner text-lg uppercase">
                                            {char.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{char.name}</div>
                                            <div className="text-xs text-[#e2a9f1]/80 mb-1">{char.role}</div>
                                            <div className="text-[11px] text-gray-500 leading-tight">{char.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">Aucun personnage majeur généré.</p>
                        )}
                    </div>
                </motion.div>

                {/* Right Column: Episodes List */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-4"
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-2xl font-black text-white">Épisodes de la Saison 1</h2>
                        <div className="text-sm font-bold text-gray-500">{season.episodes?.length || 0} épisodes</div>
                    </div>

                    {season.episodes?.map((ep: any) => (
                        <div key={ep.episodeId || ep._id} className="group flex flex-col sm:flex-row gap-6 p-6 sm:p-8 bg-[#151521] border border-gray-800 rounded-3xl hover:border-[#e2a9f1]/40 transition-all shadow-xl relative mt-4">
                            
                            {/* Left part: Number */}
                            <div className="hidden sm:flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-700 to-gray-900 group-hover:from-gray-600 group-hover:to-gray-800 transition-colors">
                                    0{ep.number}
                                </span>
                            </div>

                            {/* Middle part: Info */}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="sm:hidden text-xs font-bold text-[#e2a9f1] mb-1">ÉPISODE {ep.number}</div>
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#e2a9f1] transition-colors line-clamp-1">{ep.title}</h3>
                                    </div>
                                    <button className="text-gray-600 hover:text-white transition-colors p-2">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                    {ep.summary}
                                </p>
                                
                                <div className="p-3 bg-[#e2a9f1]/5 border border-[#e2a9f1]/20 rounded-xl mb-4">
                                    <span className="text-xs font-bold text-[#e2a9f1] uppercase tracking-wider block mb-1">Hook d'ouverture</span>
                                    <span className="text-sm text-white italic">"{ep.hook}"</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-black/40 px-3 py-1.5 rounded-lg">
                                        <Clock className="w-3 h-3" /> {ep.duration} estimée
                                    </div>
                                    
                                    {ep.status === 'ready' ? (
                                        <div className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20">
                                            <Clapperboard className="w-3 h-3" /> Prêt à tourner
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1.5 rounded-lg border border-orange-400/20">
                                            <Wand2 className="w-3 h-3" /> Draft IA
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Right part: Action */}
                            <div className="sm:w-48 flex items-center">
                                {/* In V1, we simulate entering the specific episode studio context */}
                                <button 
                                    onClick={() => router.push(`/studio/episode/${ep.episodeId || ep._id}`)}
                                    className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                                        ep.status === 'ready' 
                                        ? 'bg-white text-black hover:bg-gray-200' 
                                        : 'bg-[#222233] text-white hover:bg-[#2a2a3e] border border-gray-700'
                                    }`}
                                >
                                    <Play className="w-4 h-4" fill="currentColor" />
                                    Ouvrir Studio
                                </button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
