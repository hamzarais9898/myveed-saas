'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MOCK_SCENES_EP1, MOCK_SHOTS_SC1, MOCK_SEASON } from '@/lib/studio-mock-data';
import { ChevronLeft, Camera, RefreshCw, Pencil, Type, MonitorPlay, Film, ArrowRight, Video, StopCircle, Eye, AlertCircle, Play } from 'lucide-react';

export default function StudioShotsStoryboard({ params }: { params: { id: string } }) {
    const router = useRouter();
    const scene = MOCK_SCENES_EP1.find(s => s.id === params.id) || MOCK_SCENES_EP1[0];
    const episode = MOCK_SEASON.episodes[0];
    const [shots, setShots] = useState<any[]>(MOCK_SHOTS_SC1);
    
    // Simulate generation for a specific shot
    const handleRegenerateShot = (shotId: string) => {
        setShots(current => current.map(s => {
            if (s.id === shotId) return { ...s, status: 'generating', progress: 0 };
            return s;
        }));
        
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            if (progress >= 100) {
                clearInterval(interval);
                setShots(current => current.map(s => {
                    if (s.id === shotId) return { ...s, status: 'done', progress: 100, thumbnail: 'https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=600&auto=format&fit=crop' };
                    return s;
                }));
            } else {
                setShots(current => current.map(s => {
                    if (s.id === shotId) return { ...s, progress };
                    return s;
                }));
            }
        }, 500);
    };

    // Calculate completion
    const totalShots = shots.length;
    const completedShots = shots.filter(s => s.status === 'done').length;
    const progressPerc = Math.round((completedShots / totalShots) * 100) || 0;

    return (
        <div className="max-w-[1400px] mx-auto pb-24 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between p-4 bg-[#151521] border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push(`/studio/episode/${episode.id}`)}
                        className="p-2.5 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div>
                        <div className="text-xs font-black text-[#e2a9f1] uppercase tracking-widest mb-1">
                            SCÈNE {scene.number}
                        </div>
                        <h1 className="text-xl font-bold text-white leading-none">{scene.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Global Progress tracking */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Avancement</div>
                            <div className="text-sm font-bold text-white">{completedShots} / {totalShots} Plans</div>
                        </div>
                        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] transition-all duration-1000 ease-out"
                                style={{ width: `${progressPerc}%` }}
                            />
                        </div>
                    </div>

                    <div className="h-8 w-px bg-gray-800"></div>

                    <button 
                        onClick={() => router.push(`/studio/episode/${episode.id}/assemble`)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg text-sm ${
                            progressPerc === 100 
                            ? 'bg-[#e2a9f1] text-black hover:bg-[#c77ddf]' 
                            : 'bg-[#222233] text-gray-400 hover:text-white border border-gray-700'
                        }`}
                    >
                        <span>Assemblage Final</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main View Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Horizontal Storyboard Timeline */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 gap-6 flex">
                    {shots.map((shot, idx) => (
                        <div 
                            key={shot.id} 
                            className={`flex flex-col flex-shrink-0 w-[320px] bg-[#151521] border rounded-2xl overflow-hidden transition-all duration-300 ${
                                shot.status === 'done' ? 'border-gray-800 hover:border-[#e2a9f1]/50 shadow-lg' :
                                shot.status === 'generating' ? 'border-[#e2a9f1] shadow-[0_0_25px_rgba(226,169,241,0.15)] ring-1 ring-[#e2a9f1]/50' :
                                shot.status === 'failed' ? 'border-red-900/50 bg-red-950/10' :
                                'border-gray-800 opacity-80'
                            }`}
                        >
                            {/* Top Info */}
                            <div className="p-3 bg-black/40 border-b border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded flex items-center justify-center bg-gray-800 text-xs font-bold text-white">
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm font-bold text-white truncate max-w-[180px]">{shot.name}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-medium bg-black px-2 py-1 rounded">{shot.duration}</span>
                            </div>

                            {/* Viewer / Thumbnail Area */}
                            <div className="h-[240px] relative bg-black flex items-center justify-center overflow-hidden group">
                                {shot.status === 'done' && shot.thumbnail ? (
                                    <>
                                        <img src={shot.thumbnail} alt={shot.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button className="w-12 h-12 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-md transition-colors">
                                                <Play className="w-6 h-6 text-white ml-1" />
                                            </button>
                                        </div>
                                    </>
                                ) : shot.status === 'generating' ? (
                                    <div className="flex flex-col items-center justify-center w-full h-full p-4 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#e2a9f1]/10 to-transparent animate-pulse" />
                                        
                                        <div className="relative w-24 h-24 flex items-center justify-center mb-4">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="#2a2a3e" strokeWidth="4" />
                                                <circle 
                                                    cx="50" cy="50" r="45" fill="none" stroke="#e2a9f1" strokeWidth="4" 
                                                    strokeDasharray="283" 
                                                    strokeDashoffset={283 - (283 * (shot.progress || 0)) / 100}
                                                    className="transition-all duration-500 ease-out" 
                                                />
                                            </svg>
                                            <div className="absolute text-[#e2a9f1] font-black text-xl">{shot.progress || 0}%</div>
                                        </div>
                                        <div className="text-sm text-[#e2a9f1] font-bold uppercase tracking-widest animate-pulse">Tournage IA en cours...</div>
                                    </div>
                                ) : shot.status === 'failed' ? (
                                    <div className="flex flex-col items-center text-red-500 p-4 text-center">
                                        <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                                        <div className="font-bold mb-1">Échec de génération</div>
                                        <div className="text-xs opacity-70">Le prompt a violé les règles de sécurité.</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-600">
                                        <Camera className="w-12 h-12 mb-2 opacity-20" />
                                        <div className="text-xs uppercase tracking-widest font-black">Plan non généré</div>
                                    </div>
                                )}
                                
                                {/* Status badge */}
                                <div className="absolute top-2 right-2">
                                    {shot.status === 'done' && <div className="px-2 py-1 bg-green-500/80 text-white text-[10px] font-bold rounded shadow-lg backdrop-blur-sm uppercase">Complet</div>}
                                </div>
                            </div>

                            {/* Details Panel */}
                            <div className="p-4 flex-1 flex flex-col bg-gradient-to-b from-[#151521] to-[#0a0a0f]">
                                <div className="flex-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase mb-2">
                                        <Type className="w-3 h-3 text-[#e2a9f1]" /> Prompt Réalisateur
                                    </div>
                                    <div className="p-3 bg-black/50 border border-gray-800 rounded-xl text-xs text-gray-300 font-medium mb-4 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-ns-resize h-[80px] overflow-y-auto custom-scrollbar">
                                        {shot.prompt}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        <div className="p-2 bg-[#222233] rounded-lg">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Caméra</div>
                                            <div className="text-xs text-white truncate">{shot.cameraAngle}</div>
                                        </div>
                                        <div className="p-2 bg-[#222233] rounded-lg">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Mouvement</div>
                                            <div className="text-xs text-white truncate">{shot.cameraMovement}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-800">
                                    <button className="flex items-center justify-center gap-2 py-2 px-3 bg-[#222233] hover:bg-[#2a2a3e] rounded-xl text-xs font-bold text-gray-300 transition-colors">
                                        <Pencil className="w-3.5 h-3.5" /> Éditer prompt
                                    </button>
                                    
                                    {shot.status === 'generating' ? (
                                        <button className="flex items-center justify-center gap-2 py-2 px-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/30 rounded-xl text-xs font-bold transition-colors">
                                            <StopCircle className="w-3.5 h-3.5" /> Stop
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleRegenerateShot(shot.id)}
                                            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors shadow-sm ${
                                                shot.status === 'done' 
                                                ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 border border-blue-900/30' 
                                                : 'bg-[#e2a9f1] text-black hover:bg-[#c77ddf]'
                                            }`}
                                        >
                                            {shot.status === 'done' ? <RefreshCw className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                                            {shot.status === 'done' ? 'Refaire' : 'Générer'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Add Shot Button Placeholder */}
                    <div className="flex-shrink-0 w-[80px] border-2 border-dashed border-gray-800 rounded-2xl flex items-center justify-center hover:bg-[#222233]/50 hover:border-[#e2a9f1]/30 transition-all cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-gray-800 group-hover:bg-[#e2a9f1] flex items-center justify-center transition-colors">
                            <span className="text-xl font-bold text-gray-400 group-hover:text-black">+</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
            `}</style>
        </div>
    );
}
