'use client';

import { useState } from 'react';
import { X, Target, Calendar, BarChart3, TrendingUp, Music2, Youtube, Facebook } from 'lucide-react';

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (goal: any) => void;
    token: string | null;
    apiUrl: string;
}

export default function GoalModal({ isOpen, onClose, onSuccess, token, apiUrl }: GoalModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        platform: 'global',
        metric: 'views',
        targetValue: 1000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${apiUrl}/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                onSuccess(data.data);
                onClose();
            } else {
                setError(data.message || 'Une erreur est survenue');
            }
        } catch (err) {
            console.error('Error creating goal:', err);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#e2a9f1]/10 rounded-xl text-[#c77ddf]">
                        <Target className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Nouvel Objectif</h2>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-rose-50 text-rose-500 text-sm font-medium rounded-xl border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-gray-400" /> Plateforme
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'global', label: 'Global', icon: <Target className="w-4 h-4" /> },
                                { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
                                { id: 'tiktok', label: 'TikTok', icon: <Music2 className="w-4 h-4" /> },
                                { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-4 h-4" /> }
                            ].map((p) => (
                                <button
                                    type="button"
                                    key={p.id}
                                    onClick={() => setFormData({ ...formData, platform: p.id })}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-sm font-bold ${formData.platform === p.id
                                            ? 'bg-[#c77ddf]/5 border-[#c77ddf] text-[#c77ddf]'
                                            : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {p.icon} {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" /> Métrique
                        </label>
                        <select
                            value={formData.metric}
                            onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e2a9f1] focus:border-transparent transition-all font-semibold appearance-none"
                        >
                            <option value="views">Nombre de Vues</option>
                            <option value="videos">Vidéos publiées</option>
                            <option value="engagement">Taux d'engagement (%)</option>
                            <option value="revenue">Revenus (€)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-400" /> Valeur cible
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.targetValue}
                            onChange={(e) => setFormData({ ...formData, targetValue: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e2a9f1] focus:border-transparent transition-all font-semibold"
                            placeholder="Ex: 10000"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" /> Début
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e2a9f1] focus:border-transparent transition-all text-sm font-semibold text-gray-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" /> Fin
                            </label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e2a9f1] focus:border-transparent transition-all text-sm font-semibold text-gray-600"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-[#e2a9f1]/20 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Création...' : "Créer l'objectif"}
                    </button>
                </form>
            </div>
        </div>
    );
}
