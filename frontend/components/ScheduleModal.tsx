'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useScheduledTasks } from '@/context/ScheduledTasksContext';
import { useToast } from '@/context/ToastContext';
import { TikTokIcon, FacebookIcon, YouTubeIcon } from './ModernIcons';
import { schedulePlatformVideo } from '@/services/videoService';

interface ScheduleModalProps {
    videoId: string;
    video?: any;
    tiktokAccounts: Array<{ _id: string; id?: string; accountName: string; tiktokUsername: string }>;
    onSchedule: (updatedVideo: any) => void;
    onClose: () => void;
}

export default function ScheduleModal({
    videoId,
    video,
    tiktokAccounts,
    onSchedule,
    onClose
}: ScheduleModalProps) {
    const { scheduleTask } = useScheduledTasks();
    const { showToast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 15);
        return d;
    });
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [platforms, setPlatforms] = useState({
        tiktok: true,
        facebook: false,
        youtube: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const togglePlatform = (p: keyof typeof platforms) => {
        setPlatforms(prev => ({ ...prev, [p]: !prev[p] }));
    };

    const handleSchedule = async () => {
        const selectedPlatforms = Object.entries(platforms)
            .filter(([_, enabled]) => enabled)
            .map(([p]) => p);

        if (selectedPlatforms.length === 0) {
            setError('Veuillez sélectionner au moins une plateforme');
            return;
        }

        if (platforms.tiktok && !selectedAccount) {
            setError('Veuillez sélectionner un compte TikTok');
            return;
        }

        // Basic ObjectId validation (24 hex chars)
        if (platforms.tiktok && (selectedAccount.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(selectedAccount))) {
            setError("Identifiant de compte TikTok invalide");
            return;
        }

        if (selectedDate <= new Date()) {
            setError('La date doit être dans le futur');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Schedule each selected platform individually
            for (const platform of selectedPlatforms) {
                const response = await schedulePlatformVideo(
                    videoId,
                    platform,
                    selectedDate.toISOString(),
                    platform === 'tiktok' ? selectedAccount : undefined
                );

                if (!response.success) {
                    throw new Error(response.message || `Erreur lors de la planification sur ${platform}`);
                }

                // Update local task context for desktop notifications/monitoring if used
                scheduleTask({
                    videoId,
                    platforms: [platform],
                    scheduledDate: selectedDate.toISOString(),
                    tiktokAccountId: platform === 'tiktok' ? selectedAccount : undefined,
                    videoTitle: video?.promptText
                });

                // Notify parent with the latest video state
                onSchedule(response.video);
            }

            showToast("Planification enregistrée ✅", "success");
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erreur lors de la planification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Planifier la publication</h2>

                {/* Platforms Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                        Plateformes
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => togglePlatform('tiktok')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${platforms.tiktok ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <TikTokIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">TikTok</span>
                        </button>
                        <button
                            onClick={() => togglePlatform('facebook')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${platforms.facebook ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <FacebookIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">Facebook</span>
                        </button>
                        <button
                            onClick={() => togglePlatform('youtube')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${platforms.youtube ? 'bg-red-500/20 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                        >
                            <YouTubeIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold">YouTube</span>
                        </button>
                    </div>
                </div>

                {/* TikTok Account Selector */}
                {platforms.tiktok && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Compte TikTok
                        </label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                            <option value="">Sélectionner un compte</option>
                            {tiktokAccounts.map((account) => {
                                const accId = account._id || (account as any).id;
                                return (
                                    <option key={accId} value={accId}>
                                        @{account.tiktokUsername || 'tiktok'} ({account.accountName || 'Compte'})
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                )}

                {/* Date & Time Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date et heure
                    </label>
                    <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => date && setSelectedDate(date)}
                        showTimeSelect
                        timeFormat="HH:mm"
                        timeIntervals={15}
                        dateFormat="dd/MM/yyyy HH:mm"
                        minDate={new Date()}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSchedule}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Planification...' : 'Planifier'}
                    </button>
                </div>
            </div>
        </div>
    );
}
