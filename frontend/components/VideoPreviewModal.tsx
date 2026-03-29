'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DownloadCloud, Loader2, Sparkles, Video } from 'lucide-react';
import { downloadResource, getMaveedFilename } from '@/utils/downloadHelper';

interface VideoPreviewModalProps {
    video: any | null;
    onClose: () => void;
}

/**
 * Shared premium video preview modal.
 * Mounted via ReactDOM.createPortal() directly on document.body,
 * so it is NEVER constrained by the VideoCard's overflow:hidden or
 * any transform/stacking context in the card hierarchy.
 */
export default function VideoPreviewModal({ video, onClose }: VideoPreviewModalProps) {
    const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Ensure portal target is available (SSR-safe)
    useEffect(() => {
        setMounted(true);
    }, []);

    // Lock body scroll when open
    useEffect(() => {
        if (video) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [video]);

    // Close on Escape key
    useEffect(() => {
        if (!video) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [video, onClose]);

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {video && (
                /* Full-viewport backdrop */
                <div
                    className="fixed inset-0 flex items-end sm:items-center justify-center sm:p-6 bg-black/85 backdrop-blur-md"
                    style={{ zIndex: 9999 }}
                    onClick={onClose}
                >
                    {/* Modal container — completely independent from any parent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 24 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="bg-[#111] border border-white/10 shadow-2xl relative w-full rounded-t-[2rem] sm:rounded-[2rem] flex flex-col md:flex-row overflow-hidden sm:max-w-6xl max-h-[92dvh] sm:max-h-[88dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20 backdrop-blur-md group"
                        >
                            <X className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Mobile drag handle */}
                        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-0 shrink-0" />

                        {/* Video Player Side */}
                        <div className="flex-[3] bg-black flex items-center justify-center relative overflow-hidden min-h-[200px] sm:min-h-0">
                            <video
                                key={video.videoUrl}
                                src={video.videoUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full object-contain max-h-[50dvh] sm:max-h-none"
                            />
                            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
                        </div>

                        {/* Info / Metadata Side */}
                        <div className="flex-[2] min-w-0 p-6 sm:p-8 md:p-10 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 bg-gradient-to-br from-[#161616] to-[#0a0a0a] overflow-y-auto">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-500/20 rounded-2xl shrink-0">
                                        <Video className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] block truncate">
                                            {video.provider ? video.provider.toUpperCase() + ' Engine' : 'AI Engine'}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                                            High-Fidelity Render
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3 h-3 text-orange-400 shrink-0" /> Prompt Créatif
                                        </h3>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-sm text-gray-300 font-medium leading-relaxed italic line-clamp-5">
                                                &ldquo;{video.promptText || 'Scène générée via le studio IA'}&rdquo;
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-[8px] font-black text-gray-500 uppercase tracking-widest">État</h3>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">
                                                    {video.status || 'COMPLETED'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Format</h3>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-wider">
                                                {video.outputAspectRatio || video.format || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <h3 className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ID Unique</h3>
                                        <span className="text-[8px] font-mono text-gray-600 break-all">{video.id || video._id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row gap-3 shrink-0">
                                <button
                                    onClick={async () => {
                                        if (!video.videoUrl) return;
                                        setIsDownloadingVideo(true);
                                        const name = video.promptText ? video.promptText.slice(0, 20) : 'video';
                                        const filename = getMaveedFilename(name, 'video', video.id || video._id);
                                        await downloadResource(video.videoUrl, filename);
                                        setIsDownloadingVideo(false);
                                    }}
                                    disabled={isDownloadingVideo}
                                    className="flex-[2] py-4 sm:py-5 bg-blue-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
                                >
                                    {isDownloadingVideo
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <DownloadCloud className="w-4 h-4" />
                                    }
                                    Télécharger
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-4 sm:py-5 bg-white/5 border border-white/10 text-white rounded-[1.25rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // Mount via portal on document.body — escapes all parent stacking contexts
    return createPortal(modalContent, document.body);
}
