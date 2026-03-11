'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllSubscriptions } from '@/services/adminService';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentRow = ({ payment, index }: any) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="group hover:bg-gray-50/80 transition-all border-b border-gray-100"
        >
            <td className="px-8 py-5">
                <div className="text-[10px] font-black text-indigo-600 font-mono tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
                    {payment.id.substring(0, 16).toUpperCase()}...
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg shadow-sm">
                        👤
                    </div>
                    <div>
                        <div className="font-black text-gray-900 tracking-tight">{payment.user?.name || 'Anonyme'}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{payment.user?.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-8 py-5">
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${payment.plan === 'professional' ? 'bg-purple-100 text-purple-700' :
                        payment.plan === 'expert' ? 'bg-blue-100 text-blue-700' :
                            payment.plan === 'creator' ? 'bg-pink-100 text-pink-700' :
                                'bg-gray-100 text-gray-700'
                    }`}>
                    {payment.plan}
                </span>
            </td>
            <td className="px-8 py-5">
                <div className="text-sm font-black text-gray-900">
                    {payment.amount.toFixed(2)}€
                </div>
            </td>
            <td className="px-8 py-5">
                <span className="inline-flex px-3 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-widest">
                    SUCCÈS
                </span>
            </td>
            <td className="px-8 py-5 text-xs font-bold text-gray-400">
                {new Date(payment.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </td>
        </motion.tr>
    );
};

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPayments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllSubscriptions({ limit: 100 });
            const paymentsData = response.subscriptions
                .filter((sub: any) => sub.lastPaymentAmount && sub.lastPaymentDate)
                .map((sub: any) => ({
                    id: sub._id,
                    user: sub.userId,
                    plan: sub.plan,
                    amount: sub.lastPaymentAmount,
                    date: sub.lastPaymentDate,
                    status: 'succeeded'
                }));
            setPayments(paymentsData);
        } catch (error) {
            console.error('Error loading payments:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPayments();
    }, [loadPayments]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Flux Financiers</h1>
                    <p className="text-gray-500 font-medium mt-1">Historique complet des transactions et revenus générés</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="px-8 py-5 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] text-white rounded-[2rem] shadow-2xl shadow-[#e2a9f1]/40 border border-white/20">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 text-center">Chiffre d&apos;Affaires</p>
                        <p className="text-3xl font-black text-center">{totalRevenue.toFixed(2)}€</p>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden text-left">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Chargement du grand livre...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Utilisateur</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Plan</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Montant</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">État</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date & Heure</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-32 text-center text-gray-400 font-bold uppercase text-sm tracking-widest">
                                                Aucun mouvement financier détecté
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment, i) => (
                                            <PaymentRow key={payment.id} payment={payment} index={i} />
                                        ))
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sync Status Overlay */}
            <div className="flex justify-center">
                <div className="px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 border border-emerald-100/50">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Connecté à l&apos;infrastructure Stripe Real-time</span>
                </div>
            </div>
        </div>
    );
}
