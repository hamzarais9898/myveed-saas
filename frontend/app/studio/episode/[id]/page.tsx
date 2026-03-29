'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_SEASON, MOCK_SCENES_EP1 } from '@/lib/studio-mock-data';
import { ChevronLeft, Scissors, Clock, Users, Play, Settings2, Sparkles, Video, Clapperboard } from 'lucide-react';

export default function StudioEpisodeView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const season = MOCK_SEASON;
    const episode = season.episodes.find(e => e.id === params.id) || season.episodes[0];
    
    // Simulate generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [scenes, setScenes] = useState<any[]>([]);

    const handleCutScenes = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setScenes(MOCK_SCENES_EP1);
        }, 2000);
    };

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Breadcrumb / Top Bar */}
            <div className="flex items-center gap-4 mb-4">
                <button 
                    onClick={() => router.push(`/studio/season/${season.id}`)}
                    className="p-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">
                        Saison 1 • {season.title}
                    </div>
                </div>
            </div>

            {/* Episode Header Block */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151521] border border-[#e2a9f1]/20 rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_-15px_rgba(226,169,241,0.2)] relative overflow-hidden mb-12"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#e2a9f1]/5 rounded-full blur-[80px]" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c77ddf]/5 rounded-full blur-[80px]" />
                
                <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl mb-6 shadow-inner">
                            <span className="text-[#e2a9f1] font-black">ÉPISODE {episode.number}</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
                            {episode.title}
                        </h1>
                        <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                            {episode.summary}
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-gray-800 rounded-xl text-sm text-gray-400">
                                <Clock className="w-4 h-4 text-gray-500" /> {episode.duration}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-gray-800 rounded-xl text-sm text-gray-400">
                                <Users className="w-4 h-4 text-gray-500" /> 2 Personnages
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0a0a0f] border border-gray-800 p-6 rounded-3xl shadow-inline flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#e2a9f1]/10 to-[#c77ddf]/10 border border-[#e2a9f1]/20 rounded-2xl flex items-center justify-center mb-4">
                            <Sparkles className="w-8 h-8 text-[#e2a9f1]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Phase de Réalisation</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            L'IA va maintenant analyser l'épisode et le découper en scènes prêtes pour le tournage virtuel.
                        </p>
                        
                        <button 
                            onClick={handleCutScenes}
                            disabled={isGenerating || scenes.length > 0}
                            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-white to-gray-200 text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:pointer-events-none disabled:bg-gray-800 disabled:text-gray-400"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-r-transparent rounded-full animate-spin" /> Génération...
                                </>
                            ) : scenes.length > 0 ? (
                                <>
                                    <Sparkles className="w-5 h-5 text-green-500" /> Découpage Terminé
                                </>
                            ) : (
                                <>
                                    <Scissors className="w-5 h-5" /> Découper en Scènes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Scenes Section */}
            <AnimatePresence>
                {scenes.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, staggerChildren: 0.1 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
                            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                                <Clapperboard className="text-[#e2a9f1]" /> 
                                Scénario Technique ({scenes.length})
                            </h2>
                            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#151521] px-4 py-2 rounded-xl border border-gray-800">
                                <Settings2 className="w-4 h-4" /> Ajuster ryhtme
                            </button>
                        </div>

                        {scenes.map((scene, idx) => (
                            <motion.div 
                                key={scene.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 hover:border-[#e2a9f1]/50 transition-colors shadow-lg"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-gray-800 group-hover:bg-[#e2a9f1] rounded-l-3xl transition-colors" />
                                
                                <div className="grid md:grid-cols-4 gap-6 items-center w-full pl-4">
                                    {/* Info Panel */}
                                    <div className="md:col-span-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 bg-white/10 text-white font-bold text-xs rounded-lg uppercase tracking-wider backdrop-blur-sm">
                                                Scène {scene.number}
                                            </span>
                                            <span className="text-gray-500 text-sm"> • {scene.estimatedDuration} estim.</span>
                                        </div>
                                        
                                        <h3 className="text-2xl font-bold text-white mb-2">{scene.title}</h3>
                                        <p className="text-gray-400 leading-relaxed mb-4">{scene.description}</p>
                                        
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-300 font-medium">Ambiance: {scene.mood}</span>
                                            <span className="px-3 py-1.5 border border-gray-800 rounded-lg text-gray-300 font-medium">Perso(s): {scene.characters.join(', ')}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action button */}
                                    <div className="md:col-span-1 flex md:flex-col justify-end gap-3 h-full pt-4 md:pt-0 border-t border-gray-800 md:border-t-0 md:border-l md:pl-6">
                                        <button 
                                            onClick={() => router.push(`/studio/scene/${scene.id}/shots`)}
                                            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-black font-black rounded-2xl shadow-lg hover:shadow-[0_0_20px_rgba(226,169,241,0.4)] transition-all active:scale-95"
                                        >
                                            <Video className="w-5 h-5 flex-shrink-0" />
                                            <span>Tourner les plans</span>
                                        </button>
                                        <button className="w-full py-3 px-4 bg-[#0a0a0f] border border-gray-800 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-colors">
                                            Modifier le script
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
