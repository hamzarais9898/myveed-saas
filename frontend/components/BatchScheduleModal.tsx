'use client';

import { useState } from 'react';
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

        // Validate dates
        for (const [key, p] of activePlatforms) {
            if (p.startDate <= new Date()) {
                setError(`La date pour ${p.label} doit être dans le futur`);
                return;
            }
        }

        // Validate TikTok account if TikTok is enabled
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
            // Prepare config payload
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-outfit">
            <div className="bg-gray-900 border border-purple-500/30 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl">📅</div>
                    <div>
                        <h2 className="text-2xl font-black text-white leading-tight">Planification Avancée</h2>
                        <p className="text-gray-400 text-sm font-medium">{videoIds.length} vidéos sélectionnées</p>
                    </div>
                </div>

                {/* TikTok Account Selector (Global) */}
                <div className="mb-6 bg-gray-800/50 p-4 rounded-2xl border border-gray-700">
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Compte TikTok
                    </label>
                    <select
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all appearance-none cursor-pointer"
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

                {/* Platform Schedules */}
                <div className="space-y-4 mb-8">
                    {Object.entries(platforms).map(([key, platform]) => (
                        <div key={key} className={`border rounded-2xl p-5 transition-all ${platform.enabled ? 'bg-gray-800 border-purple-500/30 shadow-lg' : 'bg-gray-800/30 border-gray-800 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${platform.enabled ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-gray-600'}`}></div>
                                    <h3 className="text-lg font-bold text-white tracking-wide">{platform.label}</h3>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={platform.enabled}
                                        onChange={(e) => updatePlatform(key, 'enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                </label>
                            </div>

                            {platform.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date de début</label>
                                        <DatePicker
                                            selected={platform.startDate}
                                            onChange={(date: Date | null) => date && updatePlatform(key, 'startDate', date)}
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            dateFormat="dd/MM/yyyy HH:mm"
                                            minDate={new Date()}
                                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Intervalle</label>
                                        <div className="relative">
                                            <select
                                                value={platform.interval}
                                                onChange={(e) => updatePlatform(key, 'interval', parseInt(e.target.value))}
                                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 appearance-none"
                                            >
                                                <option value={1}>1h</option>
                                                <option value={2}>2h</option>
                                                <option value={4}>4h</option>
                                                <option value={12}>12h</option>
                                                <option value={24}>24h</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">▼</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-bold animate-shake">
                        ⚠️ {error}
                    </div>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all border border-gray-700 hover:border-gray-600"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleBatchSchedule}
                        disabled={loading}
                        className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1"
                    >
                        {loading ? 'Planification...' : 'Confirmer'}
                    </button>
                </div>
            </div>
        </div>
    );
}
