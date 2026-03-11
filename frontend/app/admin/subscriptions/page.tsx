'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllSubscriptions } from '@/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

const SubscriptionRow = ({ sub, index }: any) => {
    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'professional': return 'bg-purple-100 text-purple-700';
            case 'expert': return 'bg-blue-100 text-blue-700';
            case 'creator': return 'bg-pink-100 text-pink-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700';
            case 'cancelled': return 'bg-rose-100 text-rose-700';
            case 'past_due': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className="group hover:bg-gray-50/80 transition-all border-b border-gray-100"
        >
            <td className="px-8 py-5">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                        {sub.userId?.name?.[0]?.toUpperCase() || sub.userId?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-gray-900 tracking-tight">{sub.userId?.name || 'Inconnu'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{sub.userId?.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getPlanColor(sub.plan)}`}>
                    {sub.plan}
                </span>
            </td>
            <td className="px-8 py-5">
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${getStatusColor(sub.status)}`}>
                    {sub.status === 'active' ? 'ACTIF' : sub.status === 'cancelled' ? 'ANNULÉ' : 'RECOUVREMENT'}
                </span>
            </td>
            <td className="px-8 py-5">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">{sub.credits - sub.creditsUsed}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Shorts Restants</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600">{sub.ttsCredits - sub.ttsCreditsUsed}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">TTS Restants</span>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900">{sub.lastPaymentAmount ? `${sub.lastPaymentAmount}€` : '-'}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {sub.lastPaymentDate ? new Date(sub.lastPaymentDate).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                </div>
            </td>
            <td className="px-8 py-5 text-xs font-bold text-gray-400">
                {new Date(sub.createdAt).toLocaleDateString('fr-FR')}
            </td>
        </motion.tr>
    );
};

export default function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        plan: '',
        status: '',
        page: 1,
        limit: 50
    });

    const loadSubscriptions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllSubscriptions(filters);
            setSubscriptions(response.subscriptions);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadSubscriptions();
    }, [loadSubscriptions]);

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Gestion des Abonnements</h1>
                    <p className="text-gray-500 font-medium mt-1">Supervisez les engagements et les paliers de vos clients</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-6 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-xl shadow-gray-200/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 text-center">Fidélité</p>
                        <p className="text-2xl font-black text-gray-900 text-center">{subscriptions.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1">
                        <select
                            value={filters.plan}
                            onChange={(e) => setFilters({ ...filters, plan: e.target.value, page: 1 })}
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all appearance-none"
                        >
                            <option value="">Tous les plans d&apos;offre</option>
                            <option value="free">Gratuit</option>
                            <option value="creator">Créateur</option>
                            <option value="expert">Expert</option>
                            <option value="professional">Professionnel</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="w-full px-8 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all appearance-none"
                        >
                            <option value="">Tous les types de statut</option>
                            <option value="active">Actif</option>
                            <option value="cancelled">Annulé</option>
                            <option value="past_due">Impayé</option>
                        </select>
                    </div>
                    <button
                        onClick={loadSubscriptions}
                        className="px-10 py-5 bg-gray-900 text-white rounded-[1.8rem] font-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-400/40"
                    >
                        FILTRER
                    </button>
                </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden text-left">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Analyse des contrats...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Détenteur</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Offre</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">État du contrat</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Consommation</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Flux Financier</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Création</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {subscriptions.map((sub, i) => (
                                        <SubscriptionRow key={sub._id} sub={sub} index={i} />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
