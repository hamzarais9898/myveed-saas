'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOCK_SEASON } from '@/lib/studio-mock-data';
import { Clapperboard, ChevronLeft, MoreVertical, Play, Clock, Wand2, Star, Sparkles } from 'lucide-react';

export default function StudioSeasonView({ params }: { params: { id: string } }) {
    const router = useRouter();
    const season = MOCK_SEASON;

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
                        <div className="space-y-4">
                            {season.characters.map((char, idx) => (
                                <div key={idx} className="flex gap-4 items-center p-3 rounded-2xl hover:bg-black/40 transition-colors border border-transparent hover:border-gray-800">
                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center font-bold text-[#e2a9f1] shadow-inner">
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
                        <div className="text-sm font-bold text-gray-500">{season.episodes.length} épisodes</div>
                    </div>

                    {season.episodes.map((ep, index) => (
                        <div key={ep.id} className="group flex flex-col sm:flex-row gap-6 p-6 sm:p-8 bg-[#151521] border border-gray-800 rounded-3xl hover:border-[#e2a9f1]/40 transition-all shadow-xl relative mt-4">
                            
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
                                <button 
                                    onClick={() => router.push(`/studio/episode/${ep.id}`)}
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
