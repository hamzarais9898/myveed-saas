'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [mounted, setMounted] = useState(false);
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

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

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

                scheduleTask({
                    videoId,
                    platforms: [platform],
                    scheduledDate: selectedDate.toISOString(),
                    tiktokAccountId: platform === 'tiktok' ? selectedAccount : undefined,
                    videoTitle: video?.promptText
                });

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

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] font-outfit p-4 overflow-hidden">
            {/* Overlay */}
            <div className="absolute inset-0 z-0" onClick={onClose}></div>

            <div className="relative z-10 bg-[#111827] border border-white/5 
                rounded-[2.5rem] 
                p-8 sm:p-10 
                w-full max-w-[420px] 
                shadow-2xl animate-scaleIn 
                max-h-[90vh] 
                overflow-y-auto
            ">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-8 tracking-tight">Planifier la publication</h2>

                {/* Platforms Selector (Clean 3-Col Grid) */}
                <div className="mb-8">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">
                        Plateformes
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => togglePlatform('tiktok')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 ${platforms.tiktok ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg shadow-purple-500/10' : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10'}`}
                        >
                            <TikTokIcon className={`w-6 h-6 transition-transform ${platforms.tiktok ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">TikTok</span>
                        </button>
                        <button
                            onClick={() => togglePlatform('facebook')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 ${platforms.facebook ? 'bg-blue-500/10 border-blue-500 text-white shadow-lg shadow-blue-500/10' : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10'}`}
                        >
                            <FacebookIcon className={`w-6 h-6 transition-transform ${platforms.facebook ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">FB</span>
                        </button>
                        <button
                            onClick={() => togglePlatform('youtube')}
                            className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 ${platforms.youtube ? 'bg-red-500/10 border-red-500 text-white shadow-lg shadow-red-500/10' : 'bg-white/[0.03] border-white/5 text-gray-500 hover:border-white/10'}`}
                        >
                            <YouTubeIcon className={`w-6 h-6 transition-transform ${platforms.youtube ? 'scale-110' : ''}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">YouTube</span>
                        </button>
                    </div>
                </div>

                {/* TikTok Account Selector */}
                {platforms.tiktok && (
                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">
                            Compte TikTok
                        </label>
                        <div className="relative group">
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full h-14 px-6 bg-[#1f2937]/50 border border-white/10 rounded-2xl text-white text-base font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
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
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Date & Time Picker */}
                <div className="mb-10">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-1">
                        Date et heure
                    </label>
                    <div className="relative custom-datepicker">
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date: Date | null) => date && setSelectedDate(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={15}
                            dateFormat="dd/MM/yyyy HH:mm"
                            minDate={new Date()}
                            className="w-full h-14 px-6 bg-[#1f2937]/50 border border-white/10 rounded-2xl text-white text-base font-bold focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-bold flex items-center gap-3">
                        <span className="text-base">⚠️</span> {error}
                    </div>
                )}

                {/* Actions (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="w-full h-14 bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white font-black rounded-2xl transition-all border border-white/5 text-[11px] uppercase tracking-widest"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSchedule}
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-95 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-500/20 text-[11px] uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {loading ? '...' : 'Planifier'}
                    </button>
                </div>
            </div>

            <style jsx global>{`
                .react-datepicker-wrapper {
                    width: 100%;
                }
                .react-datepicker__input-container input {
                    width: 100%;
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>,
        document.body
    );
}

