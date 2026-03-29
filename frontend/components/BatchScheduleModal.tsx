'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { batchScheduleVideos } from '@/services/videoService';

interface BatchScheduleModalProps {
    videoIds: string[];
    tiktokAccounts: Array<{ _id: string; id?: string; accountName: string; tiktokUsername: string }>;
    onSuccess: () => void;
    onClose: () => void;
}

export default function BatchScheduleModal({
    videoIds,
    tiktokAccounts,
    onSuccess,
    onClose
}: BatchScheduleModalProps) {
    const [platforms, setPlatforms] = useState({
        youtube: { enabled: true, startDate: new Date(Date.now() + 3600000), interval: 2, label: 'YouTube' },
        tiktok: { enabled: true, startDate: new Date(Date.now() + 3600000), interval: 2, label: 'TikTok' },
        instagram: { enabled: true, startDate: new Date(Date.now() + 3600000), interval: 2, label: 'Instagram' }
    });

    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const updatePlatform = (key: string, field: string, value: any) => {
        setPlatforms(prev => ({
            ...prev,
            [key]: { ...prev[key as keyof typeof prev], [field]: value }
        }));
    };

    const handleBatchSchedule = async () => {
        const activePlatforms = Object.entries(platforms).filter(([_, p]) => p.enabled);
        if (activePlatforms.length === 0) {
            setError('Sélectionnez au moins une plateforme');
            return;
        }

        for (const [key, p] of activePlatforms) {
            if (p.startDate <= new Date()) {
                setError(`La date pour ${p.label} doit être dans le futur`);
                return;
            }
        }

        if (platforms.tiktok.enabled && !selectedAccount) {
            setError('Veuillez sélectionner un compte TikTok');
            return;
        }

        if (platforms.tiktok.enabled && selectedAccount && (selectedAccount.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(selectedAccount))) {
            setError("Identifiant de compte TikTok invalide");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const platformConfig = Object.entries(platforms).reduce((acc, [key, p]) => {
                if (p.enabled) {
                    acc[key] = {
                        startDate: p.startDate,
                        intervalHours: p.interval
                    };
                }
                return acc;
            }, {} as any);

            await batchScheduleVideos(videoIds, platformConfig, selectedAccount || undefined);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la planification groupée');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] font-outfit p-4 overflow-hidden">
            {/* Overlay */}
            <div className="absolute inset-0 z-0" onClick={onClose}></div>

            <div className="relative z-10 bg-[#111827] border border-white/5 
                rounded-[3rem] 
                p-6 sm:p-10 
                w-full max-w-2xl 
                shadow-2xl animate-scaleIn 
                max-h-[90vh] 
                overflow-y-auto
            ">
                <div className="flex items-center space-x-6 mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-purple-500/20">📅</div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">Planification Groupée</h2>
                        <p className="text-gray-400 text-xs sm:text-sm font-bold tracking-wide mt-1 uppercase opacity-60">
                            {videoIds.length} Vidéos sélectionnées
                        </p>
                    </div>
                </div>

                {/* TikTok Account Selector */}
                <div className="mb-10 bg-white/[0.02] p-6 sm:p-8 rounded-[2.5rem] border border-white/5">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">
                        Compte de destination (TikTok)
                    </label>
                    <div className="relative group">
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full h-14 sm:h-16 px-6 bg-[#1f2937]/50 border border-white/10 rounded-2xl text-white text-base font-bold focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all appearance-none cursor-pointer"
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

                {/* Platform Schedules */}
                <div className="space-y-6 mb-12">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 px-1">
                        Configuration par plateforme
                    </label>
                    {Object.entries(platforms).map(([key, platform]) => (
                        <div key={key} className={`relative overflow-hidden border rounded-[2.5rem] p-6 sm:p-8 transition-all duration-300 ${platform.enabled ? 'bg-white/[0.03] border-purple-500/30 shadow-xl' : 'bg-transparent border-white/5 opacity-40'}`}>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-3.5 h-3.5 rounded-full ${platform.enabled ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-gray-600'}`}></div>
                                    <h3 className="text-lg font-black text-white tracking-tight">{platform.label}</h3>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={platform.enabled}
                                        onChange={(e) => updatePlatform(key, 'enabled', e.target.checked)}
                                    />
                                    <div className="w-12 h-6.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-purple-600 border border-white/5"></div>
                                </label>
                            </div>

                            {platform.enabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Date de début</label>
                                        <div className="relative custom-datepicker">
                                            <DatePicker
                                                selected={platform.startDate}
                                                onChange={(date: Date | null) => date && updatePlatform(key, 'startDate', date)}
                                                showTimeSelect
                                                timeFormat="HH:mm"
                                                timeIntervals={15}
                                                dateFormat="dd/MM/yyyy HH:mm"
                                                minDate={new Date()}
                                                className="w-full h-14 px-5 bg-[#1f2937]/50 border border-white/10 rounded-2xl text-white text-base font-bold focus:outline-none focus:border-purple-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Intervalle</label>
                                        <div className="relative">
                                            <select
                                                value={platform.interval}
                                                onChange={(e) => updatePlatform(key, 'interval', parseInt(e.target.value))}
                                                className="w-full h-14 px-5 bg-[#1f2937]/50 border border-white/10 rounded-2xl text-white text-base font-bold focus:outline-none focus:border-purple-500 appearance-none transition-colors"
                                            >
                                                <option value={1}>Toutes les 1h</option>
                                                <option value={2}>Toutes les 2h</option>
                                                <option value={4}>Toutes les 4h</option>
                                                <option value={12}>Toutes les 12h</option>
                                                <option value={24}>Toutes les 24h</option>
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-10 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-4">
                         <span className="text-2xl">⚠️</span> {error}
                    </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="w-full h-14 sm:h-16 bg-white/[0.05] hover:bg-white/[0.08] text-gray-400 hover:text-white font-black rounded-2xl transition-all border border-white/5 uppercase tracking-widest text-[11px]"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleBatchSchedule}
                        disabled={loading}
                        className="w-full h-14 sm:h-16 bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] active:scale-95 text-white font-black rounded-2xl transition-all shadow-[0_10px_30px_-5px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-[11px] flex items-center justify-center gap-3"
                    >
                        {loading ? 'Traitement...' : 'Confirmer'}
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

// Helper Loader for the button
function Loader2({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

