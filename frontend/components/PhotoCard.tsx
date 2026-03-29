'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Download as DownloadIcon, Trash2 as TrashIcon, Wand2 } from 'lucide-react';
import { downloadResource, getMaveedFilename } from '@/utils/downloadHelper';
import { downloadImage } from '@/services/imageService';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface PhotoCardProps {
    photo: any;
    onDelete: (id: string) => void;
    compact?: boolean;
}

export default function PhotoCard({ photo, onDelete, compact = false }: PhotoCardProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (downloading) return;
        
        setDownloading(true);
        try {
            const imageId = photo.id || photo._id;
            // 1. Get verified download info from backend (mirroring VideoCard pattern)
            const downloadData = await downloadImage(imageId);
            
            if (downloadData.success && downloadData.downloadUrl) {
                const influencerName = photo.influencerName || 'photo';
                const filename = getMaveedFilename(influencerName, 'photo', imageId);
                // 2. Trigger the robust download via our enhanced helper (includes fl_attachment injection)
                await downloadResource(downloadData.downloadUrl, filename);
            } else {
                throw new Error('Could not get download link');
            }
        } catch (err) {
            console.error('Download error:', err);
            // Fallback to direct URL if backend fails for any reason
            const influencerName = photo.influencerName || 'photo';
            const filename = getMaveedFilename(influencerName, 'photo', photo.id || photo._id);
            await downloadResource(photo.imageUrl, filename);
        } finally {
            setDownloading(false);
        }
    };

    const handleAnimate = () => {
        const imageUrl = photo.imageUrl || photo.url || photo.image || '';
        if (!imageUrl) return;

        // Enhanced logic: if it belongs to an influencer, lock the identity
        if (photo.influencerId || photo.sourceType === 'influencer') {
            sessionStorage.setItem('animateSourceType', 'influencer');
            sessionStorage.setItem('animateInfluencerId', photo.influencerId || photo.id);
            sessionStorage.setItem('animateInfluencerName', photo.influencerName || 'Influenceur');
            sessionStorage.setItem('animateInfluencerImageUrl', imageUrl);
            router.push('/generate?mode=image-to-video&source=influencer');
        } else {
            // Standard image-to-video
            sessionStorage.setItem('animateImageUrl', imageUrl);
            router.push('/generate?mode=image-to-video');
        }
    };

    return (
        <div className={`group relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 border-gray-100`}>
            {/* Image Preview */}
            <div className={`relative ${compact ? 'aspect-square' : 'aspect-square'} bg-gray-100 overflow-hidden`}>
                <img
                    src={photo.imageUrl}
                    alt={photo.promptText}
                    className="w-full h-full object-cover"
                />

                {/* Top Overlay Badges */}
                <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-black text-blue-600 bg-white/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                        {photo.resolution || '1:1'}
                    </span>
                </div>

                {/* Bottom Info Gradient */}
                <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
                    <div className="text-white">
                        <h3 className="font-bold text-sm mb-1 line-clamp-2 leading-tight drop-shadow-md">
                            {photo.promptText || "Sans titre"}
                        </h3>
                        <div className="flex items-center justify-between text-[10px] font-medium text-white/80">
                            <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                                {new Date(photo.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Actions */}
            <div className="p-2 bg-white border-t border-gray-50 flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-2">
                    {/* Download */}
                    <button
                        onClick={handleDownload}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all active:scale-95"
                        title="Télécharger"
                    >
                        {downloading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        ) : (
                            <DownloadIcon className="w-5 h-5" />
                        )}
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('photoCard.save')}</span>
                    </button>

                    {/* Animate */}
                    <button
                        onClick={handleAnimate}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all active:scale-95"
                        title="Animer cette photo"
                    >
                        <Wand2 className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('photoCard.animate')}</span>
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(photo.id || photo._id)}
                        className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95"
                        title="Supprimer"
                    >
                        <TrashIcon className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-tighter">{t('photoCard.delete')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
