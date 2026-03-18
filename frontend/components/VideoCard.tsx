'use client';

import { useState, useRef, useEffect } from 'react';
import { saveAs } from 'file-saver';
import ScheduleModal from './ScheduleModal';
import { downloadVideo, cancelSchedule, getVideoStatus } from '@/services/videoService';
import { publishFacebookVideo, publishYouTube, publishToTikTok, getTikTokStatus } from '@/services/publishService';
import { Loader2, Download, Calendar, Trash2, Check, Share2, AlertCircle, Play, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YouTubeIcon, ShortsIcon, TikTokIcon, InstagramIcon, FacebookIcon } from './ModernIcons';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { useScheduledTasks } from '@/context/ScheduledTasksContext';
import { normalizeProgress } from '@/utils/progressUtil';

interface VideoCardProps {
    video: any;
    onDelete: (id: string) => void;
    onUpdate: () => void;
    tiktokAccounts: any[];
    selected?: boolean;
    onSelect?: (id: string) => void;
    compact?: boolean;
}

export default function VideoCard({ video, onDelete, onUpdate, tiktokAccounts, selected, onSelect, compact = false }: VideoCardProps) {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { cancelTasksByVideoId } = useScheduledTasks();
    const [publishing, setPublishing] = useState(false);
    const [uploadingPlatform, setUploadingPlatform] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [extending, setExtending] = useState(false);
    const [tiktokPolling, setTiktokPolling] = useState(false);

    // Polling Control
    const pollingRef = useRef<{ publishId: string | null; timerId: any | null }>({
        publishId: null,
        timerId: null
    });

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current.timerId) {
                clearTimeout(pollingRef.current.timerId);
            }
        };
    }, []);

    const normalizeTikTokStatus = (statusRes: any) => {
        const data = statusRes?.data || {};
        const rawStatus = data.status || data.publish_status || data.state || statusRes?.status || statusRes?.state;
        const errorCode = statusRes?.error?.code;
        const errorMessage = statusRes?.error?.message;

        if (rawStatus === 'SUCCESS') return { status: 'SUCCESS' };
        if (rawStatus === 'FAILED' || (errorCode && errorCode !== 'ok')) {
            return { status: 'FAILED', message: errorMessage || 'Erreur TikTok' };
        }
        if (rawStatus === 'PROCESSING' || rawStatus === 'IN_PROGRESS' || rawStatus === 'PENDING') {
            return { status: 'PROCESSING' };
        }
        return { status: 'UNKNOWN' };
    };

    const handlePublishFacebook = async () => {
        setPublishing(true);
        setUploadingPlatform('facebook');
        setError('');
        try {
            await publishFacebookVideo(video.id || video._id, video.promptText);
            showToast("Publié sur Facebook ✅", "success");
            onUpdate();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Erreur de publication Facebook';
            setError(msg);
            showToast(msg, "error");
        } finally {
            setPublishing(false);
            setUploadingPlatform(null);
        }
    };

    const handlePublishYouTube = async () => {
        setPublishing(true);
        setUploadingPlatform('youtube');
        setError('');
        try {
            await publishYouTube(video.id || video._id, {
                title: video.promptText,
                description: "Published via MyVeed",
                privacyStatus: 'public'
            });
            showToast("Publié sur YouTube ✅", "success");
            onUpdate();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Erreur de publication YouTube';
            setError(msg);
            showToast(msg, "error");
        } finally {
            setPublishing(false);
            setUploadingPlatform(null);
        }
    };

    const handlePublishTikTok = async () => {
        setPublishing(true);
        setUploadingPlatform('tiktok');
        setError('');
        try {
            const res = await publishToTikTok(video.id || video._id, video.promptText);
            showToast("TikTok: upload terminé, traitement en cours...", "info");

            if (res.publishId) {
                startTikTokPolling(res.publishId);
            } else {
                showToast("TikTok: upload OK (pas de publishId)", "info");
            }
            onUpdate();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Erreur de publication TikTok';
            setError(msg);
            showToast(msg, "error");
        } finally {
            setPublishing(false);
            setUploadingPlatform(null);
        }
    };

    const startTikTokPolling = async (publishId: string) => {
        // Prevent redundant polling for the same id
        if (pollingRef.current.publishId === publishId && tiktokPolling) return;

        // Stop any existing polling timer
        if (pollingRef.current.timerId) {
            clearTimeout(pollingRef.current.timerId);
        }

        setTiktokPolling(true);
        pollingRef.current.publishId = publishId;

        let attempts = 0;
        const maxAttempts = 12; // 2 minutes (10s interval)
        const interval = 10000;

        const poll = async () => {
            try {
                console.log(`[TikTok Poll] Attempt ${attempts + 1}/${maxAttempts} for ${publishId}`);
                const statusRes = await getTikTokStatus(publishId);
                const { status, message } = normalizeTikTokStatus(statusRes);

                if (status === 'SUCCESS') {
                    showToast("TikTok publié ✅", "success");
                    stopPolling();
                    onUpdate();
                    return;
                } else if (status === 'FAILED') {
                    showToast(`TikTok échoué: ${message}`, "error");
                    stopPolling();
                    onUpdate();
                    return;
                }

                attempts++;
                if (attempts >= maxAttempts) {
                    showToast("TikTok: Toujours en traitement, réessaye plus tard.", "info");
                    stopPolling();
                    return;
                }

                pollingRef.current.timerId = setTimeout(poll, interval);
            } catch (err) {
                console.error("TikTok Polling Error:", err);
                stopPolling();
            }
        };

        const stopPolling = () => {
            setTiktokPolling(false);
            setUploadingPlatform(null);
            pollingRef.current.publishId = null;
            pollingRef.current.timerId = null;
        };

        poll();
    };

    const handlePublishAll = async () => {
        setPublishing(true);
        setUploadingPlatform('all');
        setError('');

        const results = {
            facebook: { status: 'pending', label: 'Facebook' },
            youtube: { status: 'pending', label: 'YouTube' },
            tiktok: { status: 'pending', label: 'TikTok' }
        };

        try {
            // Parallel or Sequential? Parallel with allSettled is requested
            const [fb, yt, tt] = await Promise.allSettled([
                publishFacebookVideo(video.id || video._id, video.promptText),
                publishYouTube(video.id || video._id, { title: video.promptText }),
                publishToTikTok(video.id || video._id, video.promptText)
            ]);

            let summary = "";

            if (fb.status === 'fulfilled') {
                summary += "Facebook: OK ✅ / ";
            } else {
                summary += "Facebook: Erreur ❌ / ";
            }

            if (yt.status === 'fulfilled') {
                summary += "YouTube: OK ✅ / ";
            } else {
                summary += "YouTube: Erreur ❌ / ";
            }

            if (tt.status === 'fulfilled') {
                summary += "TikTok: en cours ⏳";
                if ((tt.value as any).publishId) {
                    startTikTokPolling((tt.value as any).publishId);
                }
            } else {
                summary += "TikTok: Erreur ❌";
            }

            showToast(summary, "info");
            onUpdate();
        } catch (err) {
            showToast("Erreur lors de la publication globale", "error");
        } finally {
            setPublishing(false);
            setUploadingPlatform(null);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        setError('');
        try {
            const response = await downloadVideo(video.id || video._id);
            saveAs(response.downloadUrl, response.filename);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur de téléchargement');
        } finally {
            setDownloading(false);
        }
    };

    const handleSchedule = () => {
        onUpdate();
    };

    const handleCancelSchedule = async () => {
        if (!confirm('Annuler la planification ?')) return;
        try {
            await cancelSchedule(video.id || video._id);
            cancelTasksByVideoId(video.id || video._id);
            showToast("Planification annulée", "info");
            onUpdate();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur d\'annulation');
        }
    };



    const getStatusIndicator = () => {
        const statuses: Record<string, { label: string; color: string; icon: any }> = {
            generating: { label: 'Génération', color: 'text-amber-600', icon: Loader2 },
            transcribing: { label: 'Sous-titres', color: 'text-blue-600', icon: Loader2 },
            editing: { label: 'Montage', color: 'text-indigo-600', icon: Loader2 },
            finishing: { label: 'Finition', color: 'text-purple-600', icon: Loader2 },
            generated: { label: 'Générée', color: 'text-emerald-600', icon: Check },
            failed: { label: 'Échec', color: 'text-red-600', icon: AlertCircle },
            scheduled: { label: 'Planifiée', color: 'text-blue-600', icon: Calendar },
            published: { label: 'Publiée', color: 'text-purple-600', icon: Share2 },
            publishing: { label: 'Publication...', color: 'text-purple-400', icon: Loader2 }
        };

        const current = statuses[video.status] || { label: 'En cours', color: 'text-amber-600', icon: Loader2 };
        const Icon = current.icon;

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-black ${current.color} bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm w-fit`}>
                        <Icon className={`w-3 h-3 ${Icon === Loader2 ? 'animate-spin' : ''}`} />
                        {current.label}
                    </span>
                    {['generating', 'transcribing', 'editing', 'finishing', 'publishing'].includes(video.status) && (
                        <span className="text-[10px] font-black text-gray-400 bg-white/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
                            {normalizeProgress(video.progress)}%
                        </span>
                    )}
                </div>

                <div className="flex gap-1 flex-wrap mt-1">
                    {video.platformPublished?.includes('facebook') || video.metadata?.facebookPublished && (
                        <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1 rounded">FB ✅</span>
                    )}
                    {video.platformPublished?.includes('youtube') || video.youtubeVideoId && (
                        <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded">YT ✅</span>
                    )}
                    {video.platformPublished?.includes('tiktok') || video.tiktokPublishId && (
                        <span className="text-[8px] font-bold text-purple-600 bg-purple-50 px-1 rounded">TT ✅</span>
                    )}
                </div>

                {['generating', 'transcribing', 'editing', 'finishing'].includes(video.status) && (
                    <div className="flex gap-1 px-1 w-20">
                        {['generating', 'transcribing', 'editing', 'finishing'].map((s, i) => {
                            const steps = ['generating', 'transcribing', 'editing', 'finishing'];
                            const currentIndex = steps.indexOf(video.status);
                            return (
                                <div
                                    key={s}
                                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= currentIndex ? 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]' : 'bg-white/50'}`}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 ${selected ? 'border-[#e2a9f1] ring-2 ring-[#e2a9f1]/50' : 'border-gray-100'}`}>
                {/* Video Preview */}
                <div className={`relative ${compact ? 'aspect-square' : 'aspect-[9/16]'} bg-gray-100 overflow-hidden`}>
                    <video
                        src={video.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />

                    {/* Top Overlay Badges */}
                    <div className={`absolute top-0 left-0 right-0 p-3 flex justify-between items-start transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        <div className="flex flex-col gap-2">
                            {getStatusIndicator()}
                        </div>

                        {onSelect && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelect(video.id || video._id);
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-md ${selected
                                    ? 'bg-[#e2a9f1] text-white ring-2 ring-white'
                                    : 'bg-white/30 text-white hover:bg-white hover:text-[#e2a9f1]'
                                    }`}
                            >
                                <Check className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Bottom Info Gradient */}
                    <div className={`absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        <div className="text-white">
                            <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight drop-shadow-md">
                                {video.promptText || "Sans titre"}
                            </h3>
                            <div className="flex items-center justify-between text-[10px] font-medium text-white/80">
                                <span className="flex items-center gap-1.5 uppercase tracking-tight bg-white/20 px-2 py-0.5 rounded backdrop-blur-md text-[9px] font-black border border-white/10">
                                    {(video.outputAspectRatio === '16:9' || video.format === 'youtube') ? <YouTubeIcon className="w-3 h-3" /> : (video.outputAspectRatio === '9:16' || video.format === 'short') ? <ShortsIcon className="w-3 h-3" /> : '🎬'}
                                    {video.outputAspectRatio || (video.format === 'youtube' ? '16:9' : '9:16')} 
                                    <span className="opacity-60 ml-1 border-l border-white/20 pl-1">
                                        {video.outputOrientation === 'portrait' ? 'PORTRAIT' : video.outputOrientation === 'landscape' ? 'PAYSAGE' : (video.format === 'youtube' ? 'PAYSAGE' : 'PORTRAIT')}
                                    </span>
                                </span>
                                <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm flex items-center gap-1">
                                    {video.outputWidth && video.outputHeight ? `${video.outputWidth}×${video.outputHeight}` : (video.format === 'youtube' ? '1280×720' : '720×1280')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Actions - Compact Grid */}
                <div className={`${compact ? 'p-2' : 'p-3'} bg-white border-t border-gray-50 flex flex-col gap-2`}>
                    {/* Error Message */}
                    {error && (
                        <div className="text-[10px] text-red-500 bg-red-50 px-2 py-1 rounded flex items-center gap-1 font-bold italic">
                            <AlertCircle className="w-3 h-3" /> {error}
                        </div>
                    )}

                    {/* Scheduled Info */}
                    {video.status === 'scheduled' && video.scheduledDate && (
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-blue-600 font-bold mb-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Planifiée
                                    </div>
                                    <div className="text-[10px] text-blue-800 font-medium">
                                        {new Date(video.scheduledDate).toLocaleString('fr-FR')}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCancelSchedule}
                                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Annuler"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Primary Actions Row */}
                    <div className="grid grid-cols-5 gap-1">
                        {/* Download - Main Action */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="col-span-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all group/btn active:scale-95"
                            title="Télécharger"
                        >
                            {downloading ? (
                                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                            ) : (
                                <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            )}
                            <span className="text-[7px] font-black uppercase tracking-tighter">{t('photoCard.save')}</span>
                        </button>

                        {/* Facebook */}
                        {(video.status === 'generated' || video.status === 'published') && (
                            <button
                                onClick={handlePublishFacebook}
                                disabled={publishing || video.platformPublished?.includes('facebook')}
                                className={`col-span-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${video.platformPublished?.includes('facebook')
                                    ? 'text-blue-400 bg-blue-50'
                                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                title="Publier sur Facebook"
                            >
                                {uploadingPlatform === 'facebook' ? <Loader2 className="w-5 h-5 animate-spin" /> : <FacebookIcon className="w-5 h-5" />}
                                <span className="text-[7px] font-black uppercase tracking-tighter">FB</span>
                            </button>
                        )}

                        {/* YouTube */}
                        {(video.status === 'generated' || video.status === 'published') && (
                            <button
                                onClick={handlePublishYouTube}
                                disabled={publishing || video.platformPublished?.includes('youtube')}
                                className={`col-span-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${video.platformPublished?.includes('youtube')
                                    ? 'text-red-400 bg-red-50'
                                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                title="Publier sur YouTube"
                            >
                                {uploadingPlatform === 'youtube' ? <Loader2 className="w-5 h-5 animate-spin" /> : <YouTubeIcon className="w-5 h-5" />}
                                <span className="text-[7px] font-black uppercase tracking-tighter">YouTube</span>
                            </button>
                        )}

                        {/* TikTok */}
                        {(video.status === 'generated' || video.status === 'published' || video.status === 'publishing') && (
                            <button
                                onClick={handlePublishTikTok}
                                disabled={publishing || video.platformPublished?.includes('tiktok') || video.status === 'publishing' || tiktokPolling}
                                className={`col-span-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all active:scale-95 ${video.platformPublished?.includes('tiktok') || video.status === 'publishing'
                                    ? 'text-purple-400 bg-purple-50'
                                    : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                                title="Publier sur TikTok"
                            >
                                {uploadingPlatform === 'tiktok' || tiktokPolling ? <Loader2 className="w-5 h-5 animate-spin" /> : <TikTokIcon className="w-5 h-5" />}
                                <span className="text-[7px] font-black uppercase tracking-tighter">TikTok</span>
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            onClick={() => onDelete(video.id || video._id)}
                            className="col-span-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                            title="Supprimer"
                        >
                            <Trash2 className="w-5 h-5" />
                            <span className="text-[7px] font-black uppercase tracking-tighter">{t('photoCard.delete')}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                        {/* Publish Everywhere */}
                        {(video.status === 'generated') && (
                            <button
                                onClick={handlePublishAll}
                                disabled={publishing}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {uploadingPlatform === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                                Publier partout
                            </button>
                        )}

                        {/* Disable Kling Extend but keep the space for layout if needed or just remove it */}


                        {/* Schedule for Generated videos */}
                        {video.status === 'generated' && (
                            <button
                                onClick={() => setShowScheduleModal(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 border-blue-100 hover:border-blue-600 shadow-sm active:scale-95"
                            >
                                <Calendar className="w-3.5 h-3.5" /> Planifier
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showScheduleModal && (
                <ScheduleModal
                    videoId={video.id || video._id}
                    video={video}
                    tiktokAccounts={tiktokAccounts}
                    onSchedule={handleSchedule}
                    onClose={() => setShowScheduleModal(false)}
                />
            )}
        </>
    );
}
