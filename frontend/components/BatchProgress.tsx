'use client';
import { normalizeProgress } from '@/utils/progressUtil';

interface BatchProgressProps {
    current: number;
    total: number;
    videos: Array<{
        id: string;
        format: string;
        variantNumber: number;
        status: string;
    }>;
}

export default function BatchProgress({ current, total, videos }: BatchProgressProps) {
    const progress = (current / total) * 100;

    return (
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Génération en cours</h3>
                <span className="text-sm text-gray-400">
                    {current}/{total} vidéos
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Video List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg"
                    >
                        <div className="flex items-center space-x-3">
                            <span className="text-xl">
                                {video.format === 'youtube' ? '📺' : '📱'}
                            </span>
                            <div>
                                <div className="text-sm text-white">
                                    {video.format === 'youtube' ? 'YouTube' : 'Short'} - Variante {video.variantNumber}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                    <span>
                                        {video.status === 'generated' ? 'Prête' :
                                            video.status === 'generating' ? 'Génération...' :
                                                video.status === 'transcribing' ? 'Sous-titres...' :
                                                    video.status === 'editing' ? 'Montage...' :
                                                        video.status === 'finishing' ? 'Finition...' : 'En cours...'}
                                    </span>
                                    {video.status !== 'generated' && video.status !== 'failed' && (
                                        <span className="bg-gray-800 px-1 rounded text-gray-400 font-mono">
                                            {normalizeProgress((video as any).progress)}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {video.status === 'generated' ? (
                            <span className="text-green-400">✓</span>
                        ) : (
                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
