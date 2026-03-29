'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOCK_SEASON, MOCK_SHOTS_SC1 } from '@/lib/studio-mock-data';
import { ChevronLeft, PlayCircle, Download, Share2, Layers, Music, Volume2, Save, Clapperboard, MonitorPlay, Sparkles } from 'lucide-react';

export default function StudioAssembleEpisode({ params }: { params: { id: string } }) {
    const router = useRouter();
    const season = MOCK_SEASON;
    const episode = season.episodes.find(e => e.id === params.id) || season.episodes[0];
    
    // We mock that all shots from scene 1 are used to "assemble" the total video.
    const allShotsDone = MOCK_SHOTS_SC1.filter(s => s.status === 'done');
    const totalDurationSeconds = allShotsDone.reduce((acc, shot) => acc + parseInt(shot.duration), 0);
    const formattedDuration = `00:${totalDurationSeconds < 10 ? '0' : ''}${totalDurationSeconds}`;

    return (
        <div className="max-w-[1400px] mx-auto pb-20 mt-4">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push(`/studio/scene/sc_1/shots`)}
                        className="p-3 bg-[#151521] border border-gray-800 rounded-xl hover:bg-[#1a1a27] transition-all flex mt-1"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div>
                        <div className="text-xs font-bold text-[#e2a9f1] uppercase tracking-widest mb-1 flex items-center gap-2">
                            <MonitorPlay className="w-3.5 h-3.5" /> 
                            {season.title} • Ép {episode.number}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">{episode.title} - FinalCut</h1>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#151521] border border-gray-800 text-white hover:bg-[#1a1a27] transition-all shadow-sm">
                        <Save className="w-4 h-4 text-gray-400" /> Sauvegarder
                    </button>
                    <button 
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-black font-black uppercase tracking-widest text-sm rounded-xl shadow-[0_0_20px_rgba(226,169,241,0.3)] hover:shadow-[0_0_30px_rgba(226,169,241,0.5)] hover:scale-105 transition-all"
                        onClick={() => alert("L'assemblage a commencé sur nos serveurs. Vous recevrez une notification.")}
                    >
                        <Layers className="w-4 h-4" /> Fusionner & Exporter
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 h-full">
                {/* Main Player Area Left (2/3) */}
                <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                    {/* Fake Video Player Container */}
                    <div className="w-full aspect-video bg-[#0a0a0f] border border-gray-800 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center group">
                        {/* Background Mock Thumbnail of the first done shot */}
                        {allShotsDone.length > 0 && (
                            <div 
                                className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm scale-105 transition-all duration-700"
                                style={{ backgroundImage: `url(${allShotsDone[0].thumbnail})` }}
                            />
                        )}
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <button className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border hover:bg-white/20 border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-transform hover:scale-110">
                                <PlayCircle className="w-10 h-10 text-white" />
                            </button>
                            <span className="mt-4 text-sm font-bold bg-black/60 px-3 py-1 rounded-lg text-white backdrop-blur-md uppercase tracking-widest">Aperçu Basse Résolution</span>
                        </div>

                        {/* Player Controls Mock */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                            <div className="flex items-center gap-4">
                                <PlayCircle className="w-6 h-6 text-white cursor-pointer hover:text-[#e2a9f1] transition-colors" />
                                <div className="text-xs text-white font-mono">00:00 / {formattedDuration}</div>
                                <div className="flex-1 h-1 bg-gray-600 rounded-full relative cursor-pointer group-hover:h-2 transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-[#e2a9f1] rounded-full" />
                                </div>
                                <Volume2 className="w-5 h-5 text-white hover:text-[#e2a9f1] cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 flex-1 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#c77ddf]" /> Chronologie des Plans ({allShotsDone.length})
                            </h3>
                            <span className="text-xs text-gray-500 font-bold uppercase">Durée Totale : {formattedDuration}</span>
                        </div>

                        <div className="flex gap-2 p-4 bg-[#0a0a0f] rounded-2xl overflow-x-auto border border-gray-900 border-inset">
                            {allShotsDone.map((shot, idx) => (
                                <div 
                                    key={shot.id} 
                                    className="flex-shrink-0 relative group h-24 rounded-lg overflow-hidden border border-gray-700 hover:border-[#e2a9f1] cursor-pointer transition-all"
                                    style={{ width: `${parseInt(shot.duration) * 30}px` }} // visual width based on mock duration
                                >
                                    <img src={shot.thumbnail || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-1 left-1 bg-black/80 text-[10px] text-white font-mono px-1.5 py-0.5 rounded border border-gray-800">
                                        {shot.duration}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/50 group-hover:bg-[#e2a9f1] transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Settings Panel */}
                <div className="space-y-6">
                    {/* Audio & Music */}
                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Music className="w-5 h-5 text-[#c77ddf]" /> Bande Son & Voix
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-bold text-white">Voix Off Gérée (Kaelen)</div>
                                    <div className="text-xs text-green-400 uppercase font-bold tracking-widest bg-green-400/10 px-2 py-1 rounded">Généré</div>
                                </div>
                                <div className="flex items-center gap-3 w-full mt-3">
                                    <Volume2 className="w-4 h-4 text-gray-500" />
                                    <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#e2a9f1]" defaultValue="80" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-bold text-white">Musique Cyberpunk (Epic)</div>
                                    <button className="text-xs text-[#e2a9f1] underline underline-offset-2">Changer</button>
                                </div>
                                <div className="flex items-center gap-3 w-full mt-3">
                                    <Music className="w-4 h-4 text-gray-500" />
                                    <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#e2a9f1]" defaultValue="45" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-black/40 border border-gray-800 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-bold text-white">Sound Effects (SFX)</div>
                                    <button className="text-xs text-[#e2a9f1] underline underline-offset-2">Ajuster IA</button>
                                </div>
                                <div className="flex items-center gap-3 w-full mt-3">
                                    <Layers className="w-4 h-4 text-gray-500" />
                                    <input type="range" className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#e2a9f1]" defaultValue="60" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Export summary */}
                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#e2a9f1]/10 rounded-full blur-[40px] group-hover:bg-[#e2a9f1]/20 transition-all duration-500" />
                        
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Clapperboard className="w-5 h-5 text-[#c77ddf]" /> Résumé Export 
                        </h3>
                        
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                                <span className="text-gray-400">Format Cible</span>
                                <span className="text-white font-bold">{season.format || 'Horizontal (16:9)'}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                                <span className="text-gray-400">Qualité</span>
                                <span className="text-white font-bold">4K Ultra HD</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-800">
                                <span className="text-gray-400">Prix estimé</span>
                                <span className="text-[#e2a9f1] font-bold">12 crédits</span>
                            </div>
                            <div className="flex justify-between text-sm py-2">
                                <span className="text-gray-400">Disponibilité</span>
                                <span className="text-green-400 font-bold text-right leading-tight">Post-génération<br/>~15 min</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0a0f] text-gray-400 hover:text-white border border-gray-800 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                <Download className="w-4 h-4" /> MP4
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#e2a9f1]/10 text-[#e2a9f1] hover:bg-[#e2a9f1]/20 border border-[#e2a9f1]/30 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors">
                                <Share2 className="w-4 h-4" /> Social
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
