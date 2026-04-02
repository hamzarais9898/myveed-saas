'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion as m, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    Camera, 
    RefreshCw, 
    Pencil, 
    Type, 
    Film, 
    ArrowRight, 
    Video, 
    StopCircle, 
    Eye, 
    AlertCircle, 
    Play, 
    Sparkles, 
    Wand2,
    Zap,
    Cpu,
    CheckCircle2,
    Clock,
    Loader2,
    Download,
    Check
} from 'lucide-react';
import { 
    getStudioScene, 
    generateStudioShots, 
    generateShotVideo,
    generateStudioSegments,
    generateSegmentVideo,
    compileSceneVideo
} from '@/services/studioService';

export default function StudioShotsStoryboard({ params }: { params: { id: string } }) {
    const router = useRouter();
    
    // States
    const [scene, setScene] = useState<any>(null);
    const [shots, setShots] = useState<any[]>([]);
    const [segments, setSegments] = useState<any[]>([]);
    const [durationPlan, setDurationPlan] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGeneratingShots, setIsGeneratingShots] = useState(false);
    const [isGeneratingSegments, setIsGeneratingSegments] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [pollingRetryCount, setPollingRetryCount] = useState(0);
    const [error, setError] = useState('');

    const fetchData = async (showLoading = true) => {
        if (showLoading && !scene) setLoading(true);
        try {
            const data = await getStudioScene(params.id);
            if (data.success) {
                setScene(data.scene);
                setShots(data.shots);
                setSegments(data.segments || []);
                setDurationPlan(data.durationPlan || []);
                
                if (data.scene.status === 'shots_generated') {
                    setIsGeneratingShots(false);
                }

                // Arrêter le spinner si les segments sont arrivés
                if (data.segments && data.segments.length > 0) {
                    setIsGeneratingSegments(false);
                    setPollingRetryCount(0);
                }

                // Arrêter si prêt ou échec via segmentGenerationStatus
                if (data.scene.segmentGenerationStatus === 'ready') {
                    setIsGeneratingSegments(false);
                    setPollingRetryCount(0);
                }

                if (data.scene.segmentGenerationStatus === 'failed') {
                    setIsGeneratingSegments(false);
                    setError("L'optimisation Sora a échoué côté serveur.");
                }

                // Handling Compilation Progress
                if (data.scene.compilationStatus === 'compiling') {
                    setIsCompiling(true);
                } else if (data.scene.compilationStatus === 'completed') {
                    setIsCompiling(false);
                } else if (data.scene.compilationStatus === 'failed') {
                    setIsCompiling(false);
                    setError(`Compilation échec: ${data.scene.compilationError || 'Erreur inconnue'}`);
                }
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Erreur de chargement de la scène");
            // Stop spinners on error
            setIsGeneratingShots(false);
            setIsGeneratingSegments(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [params.id]);

    // Polling pendant la génération du Storyboard OU des Segments OU d'une Vidéo
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        const hasGeneratingShots = shots.some(s => s.generationStatus === 'generating');
        const hasGeneratingSegments = segments.some(s => s.generationStatus === 'generating');

        if (isGeneratingShots || isGeneratingSegments || isCompiling || hasGeneratingShots || hasGeneratingSegments) {
            interval = setInterval(() => {
                if (isGeneratingSegments) {
                    setPollingRetryCount(prev => {
                        if (prev > 30) { // Environ 1min30 (3s * 30)
                            setIsGeneratingSegments(false);
                            setError("Délai d'optimisation dépassé. Vérifiez vos segments plus tard.");
                            return 0;
                        }
                        return prev + 1;
                    });
                }
                fetchData(false);
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isGeneratingShots, isGeneratingSegments, isCompiling, shots, segments]);

    const handleGenerateStoryboard = async () => {
        setIsGeneratingShots(true);
        setError('');
        try {
            await generateStudioShots(params.id);
        } catch (err: any) {
            setError(err.message || "Échec de la génération du storyboard");
            setIsGeneratingShots(false);
        }
    };

    const handleGenerateSegments = async () => {
        setIsGeneratingSegments(true);
        setError('');
        try {
            await generateStudioSegments(params.id);
        } catch (err: any) {
            setError(err.message || "Échec de l'optimisation Sora");
            setIsGeneratingSegments(false);
        }
    };

    const handleGenerateVideo = async (shotId: string) => {
        setShots(current => current.map(s => {
            if (s.shotId === shotId) return { ...s, generationStatus: 'generating' };
            return s;
        }));
        try {
            await generateShotVideo(shotId);
            setTimeout(() => fetchData(false), 1000);
        } catch (err: any) {
            setError(`Erreur Vidéo: ${err.message}`);
        }
    };

    const handleGenerateSegmentVideo = async (segmentId: string) => {
        const seg = segments.find(s => s.segmentId === segmentId);
        
        // Si terminé, on télécharge
        if (seg?.generationStatus === 'completed' && (seg as any).videoUrl) {
            window.open((seg as any).videoUrl, '_blank');
            return;
        }

        setSegments(current => current.map(s => {
            if (s.segmentId === segmentId) return { ...s, generationStatus: 'generating', progress: 0 };
            return s;
        }));
        try {
            await generateSegmentVideo(segmentId);
            setTimeout(() => fetchData(false), 1000);
        } catch (err: any) {
            setError(`Erreur Production: ${err.message}`);
            // Reset status for retry
            setSegments(current => current.map(s => {
                if (s.segmentId === segmentId) return { ...s, generationStatus: 'failed' };
                return s;
            }));
        }
    };

    const handleCompileScene = async () => {
        setIsCompiling(true);
        setError('');
        try {
            await compileSceneVideo(params.id);
            // Launch immediate fetch to update status and activate polling
            fetchData(false);
        } catch (err: any) {
            setError(`Échec Compilation: ${err.message}`);
            setIsCompiling(false);
        }
    };

    if (loading && !scene) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#0a0a0f] space-y-6">
                <Wand2 className="w-12 h-12 text-[#e2a9f1] animate-spin" />
                <p className="text-gray-400 font-black tracking-widest uppercase animate-pulse">Chargement de la scène...</p>
            </div>
        );
    }

    if (!scene) return <div className="text-center py-20 text-red-500">Scène introuvable.</div>;

    return (
        <div className="max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col bg-[#0a0a0f]">
            {/* Header Toolbar */}
            <m.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-6 bg-[#151521] border-b border-gray-800 shrink-0 shadow-2xl relative z-20"
            >
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push(`/studio/episode/${scene.episodeId}`)}
                        className="p-2.5 bg-black border border-gray-800 rounded-xl hover:bg-gray-900 transition-colors group"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
                    </button>
                    <div>
                        <div className="text-xs font-black text-[#e2a9f1] uppercase tracking-widest mb-1 flex items-center gap-2">
                            SCÈNE {scene.sceneNumber} • {scene.mood}
                        </div>
                        <h1 className="text-xl font-bold text-white leading-none">{scene.title}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleGenerateStoryboard}
                        disabled={isGeneratingShots || shots.length > 0}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black transition-all text-xs uppercase tracking-widest ${
                            shots.length > 0 
                            ? 'bg-gray-800/50 text-gray-500 border border-gray-700'
                            : 'bg-[#1c1c2b] text-[#e2a9f1] border border-[#e2a9f1]/30 hover:bg-[#252538]'
                        }`}
                    >
                        {isGeneratingShots ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        {shots.length > 0 ? "Storyboard Prêt" : "Générer Storyboard"}
                    </button>

                    <button 
                        onClick={handleGenerateSegments}
                        disabled={isGeneratingSegments || segments.length > 0}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black transition-all shadow-lg text-xs uppercase tracking-widest ${
                            segments.length > 0 
                            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white text-black hover:scale-105 active:scale-95'
                        }`}
                    >
                        {isGeneratingSegments ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {segments.length > 0 ? "Segments Prêts" : "Préparer Production Sora"}
                    </button>
                </div>
            </m.div>

            {/* Error Area */}
            <AnimatePresence>
                {error && (
                    <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-900/10 border-b border-red-500/20 px-6 py-3 flex items-center gap-3 text-red-400 text-sm overflow-hidden">
                        <AlertCircle className="w-4 h-4" /> {error}
                        <button onClick={() => setError('')} className="ml-auto hover:text-white font-bold">FErmer</button>
                    </m.div>
                )}
            </AnimatePresence>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-12">
                
                {/* 1. SCENE SUMMARY */}
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151521] border border-gray-800 rounded-[2.5rem] p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Film className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 bg-[#e2a9f1]/10 text-[#e2a9f1] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#e2a9f1]/20">Résumé de la Scène</span>
                            <span className="text-gray-500 text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> Durée estimée: {scene.estimatedDuration}</span>
                        </div>
                        <p className="text-xl text-gray-300 font-medium leading-relaxed max-w-4xl italic">"{scene.description}"</p>
                    </div>
                </m.div>

                {/* 2. CREATIVE STORYBOARD (Shots) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-3">
                            <Camera className="w-5 h-5 text-gray-500" /> Storyboard Créatif 
                            <span className="text-xs font-bold text-gray-600 bg-gray-900 px-2 py-0.5 rounded ml-2">{shots.length} PLANS</span>
                        </h2>
                    </div>

                    {shots.length > 0 ? (
                        <div className="flex overflow-x-auto gap-6 pb-4 custom-horizontal-scroll">
                            {shots.map((shot, idx) => (
                                <m.div 
                                    key={shot.shotId} 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    className="flex-shrink-0 w-[320px] bg-[#12121a] border border-gray-800 rounded-[2rem] overflow-hidden group/shot"
                                >
                                    <div className="aspect-video bg-black relative flex items-center justify-center p-4">
                                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md border border-white/5 text-[9px] font-black text-[#e2a9f1] z-10 transition-all group-hover/shot:scale-110">
                                            #{shot.shotNumber}
                                        </div>
                                        <Film className="w-10 h-10 text-gray-800 opacity-20" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-bold text-white truncate max-w-[150px]">{shot.title}</div>
                                                <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{shot.cameraAngle}</div>
                                            </div>
                                            <div className="text-[10px] font-black text-gray-400">{shot.estimatedDuration}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="text-[10px] text-gray-400 line-clamp-3 leading-relaxed min-h-[45px] italic">"{shot.description}"</div>
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-800/50">
                                            <div className="px-2 py-0.5 bg-gray-900 rounded text-[8px] font-black text-gray-500 uppercase">{shot.lighting}</div>
                                            <div className="px-2 py-0.5 bg-gray-900 rounded text-[8px] font-black text-gray-500 uppercase truncate max-w-[100px]">{shot.cameraMovement}</div>
                                        </div>
                                    </div>
                                </m.div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-900/20 border border-dashed border-gray-800 rounded-[2rem] p-12 text-center">
                            <Camera className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Aucun storyboard généré</p>
                        </div>
                    )}

                    {/* Final Production Section */}
                    {(segments.length > 0 || scene?.finalVideoUrl) && (
                        <div className="mt-20 space-y-10">
                            <div className="flex items-center justify-between border-t border-gray-800 pt-12">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                                        <Film className="w-6 h-6 text-[#e2a9f1]" /> Production Finale
                                        {scene?.compilationStatus === 'completed' && (
                                            <span className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black px-3 py-1 rounded-full ml-4 tracking-[0.1em]">PRÊT</span>
                                        )}
                                    </h2>
                                    <p className="text-gray-500 text-sm mt-2 font-medium">Assemblez tous les segments Sora en une seule vidéo finale orchestrée.</p>
                                </div>
                                
                                <button 
                                    onClick={handleCompileScene}
                                    disabled={isCompiling || segments.some(s => s.generationStatus !== 'completed')}
                                    className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 ${
                                        isCompiling 
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                            : segments.some(s => s.generationStatus !== 'completed')
                                                ? 'bg-gray-900/50 text-gray-700 border border-gray-800 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-[#e2a9f1] to-[#ff80b5] text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(226,169,241,0.3)]'
                                    }`}
                                >
                                    {isCompiling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Compilation en cours...
                                        </>
                                    ) : scene?.compilationStatus === 'completed' ? (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Re-compiler la scène
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4" />
                                            Compiler la scène finale
                                        </>
                                    )}
                                </button>
                            </div>

                            {scene?.finalVideoUrl ? (
                                <m.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group/final bg-black"
                                >
                                    <video 
                                        src={scene.finalVideoUrl} 
                                        className="w-full h-full object-contain"
                                        controls
                                    />
                                    <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover/final:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => window.open(scene.finalVideoUrl, '_blank')}
                                            className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white hover:bg-[#e2a9f1] hover:text-black transition-all"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-black text-[#e2a9f1] uppercase tracking-[0.3em]">Scène Complète</div>
                                                <h3 className="text-xl font-black text-white uppercase">{scene.title}</h3>
                                            </div>
                                            <div className="px-4 py-2 bg-white text-black text-[10px] font-black rounded-lg uppercase tracking-widest flex items-center gap-2">
                                                <Check className="w-3 h-3" /> Production Terminée
                                            </div>
                                        </div>
                                    </div>
                                </m.div>
                            ) : isCompiling ? (
                                <div className="aspect-video rounded-[3rem] border-2 border-dashed border-[#e2a9f1]/20 flex flex-col items-center justify-center space-y-6 bg-[#e2a9f1]/5">
                                    <div className="relative w-20 h-20">
                                        <m.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-4 border-[#e2a9f1] border-t-transparent rounded-full shadow-[0_0_30px_rgba(226,169,241,0.2)]"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Cpu className="w-8 h-8 text-[#e2a9f1] animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <div className="text-sm font-black text-white uppercase tracking-[0.2em] animate-pulse">Compilation FFmpeg en cours</div>
                                        <p className="text-xs text-gray-500 font-medium">Assemblage des segments, normalisation et rendu final...</p>
                                    </div>
                                </div>
                            ) : null}

                            {scene?.compilationStatus === 'failed' && (
                                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center gap-4 text-red-500">
                                    <AlertCircle className="w-6 h-6 shrink-0" />
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest">Échec de la compilation</div>
                                        <div className="text-[11px] font-medium opacity-80 mt-1">{scene.compilationError || 'Une erreur inconnue est survenue.'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. SORA PRODUCTION SEGMENTS */}
                <div className="space-y-8 pb-20">
                    <div className="flex items-center justify-between border-t border-gray-800 pt-12 px-2">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                                <Zap className="w-6 h-6 text-[#e2a9f1]" /> Segments Sora
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-black text-[10px] font-black px-3 py-1 rounded-full ml-4 tracking-[0.1em]">OPTIMISÉ COÛT</span>
                            </h2>
                            <p className="text-gray-500 text-sm mt-2 font-medium">Segments compatibles Sora (4, 8, 12 secondes) pour une production cinématographique réelle.</p>
                        </div>

                        {durationPlan.length > 0 && (
                            <div className="p-4 bg-[#151521] border border-gray-800 rounded-2xl flex items-center gap-6 shadow-xl">
                                <div className="text-center">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Production</div>
                                    <div className="text-xl font-black text-white">{durationPlan.length} <span className="text-xs text-gray-500">VIDÉOS</span></div>
                                </div>
                                <div className="h-10 w-px bg-gray-800"></div>
                                <div className="text-center">
                                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Durées</div>
                                    <div className="flex gap-1">
                                        {durationPlan.map((d, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-black/50 border border-white/5 rounded text-[10px] font-bold text-gray-400">{d}s</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {segments.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {segments.map((segment, idx) => (
                                <m.div 
                                    key={segment.segmentId} 
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`flex flex-col bg-[#12121a] border rounded-[2.5rem] overflow-hidden transition-all duration-500 shadow-2xl group ${
                                        segment.generationStatus === 'generating' ? 'border-[#e2a9f1] ring-1 ring-[#e2a9f1]/20' : 'border-gray-800 hover:border-gray-700'
                                    }`}
                                >
                                    <div className="flex h-full min-h-[220px]">
                                        {/* Visual / Video Area */}
                                        <div className="w-[280px] bg-black relative flex items-center justify-center shrink-0 overflow-hidden border-r border-gray-800">
                                            {segment.generationStatus === 'completed' ? (
                                                <div className="w-full h-full relative group/play">
                                                    {(segment as any).videoUrl ? (
                                                        <video 
                                                            src={(segment as any).videoUrl} 
                                                            className="w-full h-full object-cover"
                                                            muted
                                                            playsInline
                                                            onMouseOver={e => (e.target as HTMLVideoElement).play()}
                                                            onMouseOut={e => {
                                                                (e.target as HTMLVideoElement).pause();
                                                                (e.target as HTMLVideoElement).currentTime = 0;
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 bg-[#e2a9f1]/5 flex items-center justify-center">
                                                            <Film className="w-12 h-12 text-[#e2a9f1]/20" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/40 group-hover/play:bg-black/10 transition-colors flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if ((segment as any).videoUrl) window.open((segment as any).videoUrl, '_blank');
                                                            }}
                                                            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover/play:scale-110 active:scale-95"
                                                        >
                                                            <Play className="w-6 h-6 ml-1" fill="black" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : segment.generationStatus === 'generating' ? (
                                                <div className="flex flex-col items-center justify-center space-y-6 w-full px-8">
                                                    <div className="relative w-16 h-16">
                                                        <m.div 
                                                            animate={{ rotate: 360 }}
                                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                            className="absolute inset-0 border-2 border-t-[#e2a9f1] border-transparent rounded-full shadow-[0_0_15px_rgba(226,169,241,0.2)]"
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <Cpu className="w-6 h-6 text-[#e2a9f1] animate-pulse" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="w-full space-y-3">
                                                        <div className="flex justify-between items-center px-1">
                                                            <div className="text-[10px] text-[#e2a9f1] font-black uppercase tracking-widest animate-pulse">
                                                                {segment.progress < 20 ? 'Initialisation...' : 
                                                                 segment.progress < 60 ? 'Génération en cours...' :
                                                                 segment.progress < 90 ? 'Rendu des détails...' :
                                                                 segment.progress < 100 ? 'Finalisation...' : 'Terminé'}
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-mono font-bold">{segment.progress || 0}%</div>
                                                        </div>
                                                        
                                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative p-[1px]">
                                                            <m.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${segment.progress || 0}%` }}
                                                                transition={{ duration: 1, ease: "circOut" }}
                                                                className="h-full bg-gradient-to-r from-[#e2a9f1] via-[#ff80b5] to-[#e2a9f1] bg-[length:200%_100%] animate-gradient shadow-[0_0_12px_rgba(226,169,241,0.4)] rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : segment.generationStatus === 'failed' ? (
                                                <div className="flex flex-col items-center justify-center space-y-4 px-6 text-center">
                                                    <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                                        <AlertCircle className="w-6 h-6 text-red-500" />
                                                    </div>
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-red-500">Erreur Production</div>
                                                    <button 
                                                        onClick={() => handleGenerateSegmentVideo(segment.segmentId)}
                                                        className="text-[9px] text-gray-400 underline uppercase tracking-tighter"
                                                    >
                                                        Réessayer
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center space-y-4 opacity-40 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                                                        <Film className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                    <div className="text-[10px] uppercase font-black tracking-widest text-gray-600">Prêt à produire</div>
                                                </div>
                                            )}
                                            
                                            <div className="absolute bottom-4 left-4">
                                                <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-lg px-2.5 py-1 flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-[#e2a9f1]" />
                                                    <span className="text-xs font-black text-white">{segment.durationSeconds}s</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* info Area */}
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-[10px] font-black text-[#e2a9f1] uppercase tracking-[0.2em] flex items-center gap-2">
                                                       <CheckCircle2 className="w-3 h-3" /> SEGMENT {segment.segmentNumber}
                                                    </div>
                                                    <div className="text-[9px] font-bold text-gray-500 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded uppercase">{segment.providerTarget} Optimized</div>
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm mb-1">{segment.title}</h3>
                                                    <p className="text-[11px] text-gray-400 font-medium line-clamp-2 italic leading-relaxed">"{segment.description}"</p>
                                                </div>
                                                <div className="p-3 bg-black/40 border border-gray-800 rounded-xl">
                                                    <div className="text-[9px] text-gray-600 font-black uppercase mb-1.5 tracking-widest">Director Prompt</div>
                                                    <div className="text-[10px] text-gray-300 font-bold line-clamp-2 uppercase leading-tight font-mono tracking-tight">{segment.directorPrompt}</div>
                                                </div>
                                            </div>

                                            <div className="pt-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{segment.cameraPlan}</span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => handleGenerateSegmentVideo(segment.segmentId)}
                                                    disabled={segment.generationStatus === 'generating'}
                                                    className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                                                        segment.generationStatus === 'completed' 
                                                        ? 'bg-green-500 text-black shadow-green-500/20 hover:scale-105' 
                                                        : segment.generationStatus === 'generating'
                                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                        : segment.generationStatus === 'failed'
                                                        ? 'bg-red-500/80 text-white hover:bg-red-500'
                                                        : 'bg-white text-black hover:rotate-1'
                                                    }`}
                                                >
                                                    {segment.generationStatus === 'completed' ? 'Télécharger' : segment.generationStatus === 'generating' ? 'Génération...' : segment.generationStatus === 'failed' ? 'Réessayer Sora' : 'Lancer Production Sora'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </m.div>
                            ))}
                        </div>
                    ) : !isGeneratingSegments && (
                        <div className="flex flex-col items-center justify-center p-20 bg-[#151521]/50 border border-gray-800 rounded-[3rem] text-center max-w-2xl mx-auto border-dashed">
                             <div className="w-20 h-20 bg-[#e2a9f1]/5 rounded-[2rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Zap className="w-10 h-10 text-gray-800" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Optimisation Sora non prête</h3>
                            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
                                Configurez les segments de production pour commencer la génération réelle. <br/>
                                Le backend calculera le plan optimal (4s, 8s, 12s) pour réduire vos coûts.
                            </p>
                            <button 
                                onClick={handleGenerateSegments}
                                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                            >
                                <Cpu className="w-5 h-5" />
                                Préparer les segments Sora
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 z-30">
                <m.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(segments.filter(s => s.generationStatus === 'completed').length / segments.length) * 100 || 0}%` }}
                    className="h-full bg-[#e2a9f1] shadow-[0_0_10px_rgba(226,169,241,0.5)]"
                />
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
                
                .custom-horizontal-scroll::-webkit-scrollbar { height: 4px; }
                .custom-horizontal-scroll::-webkit-scrollbar-track { background: #0a0a0f; }
                .custom-horizontal-scroll::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
            `}</style>
        </div>
    );
}

