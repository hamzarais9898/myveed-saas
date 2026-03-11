'use client';

import { useEffect, useState, useCallback } from 'react';
import { getNewsletterSubscribers, sendBulkNewsletterEmail } from '@/services/newsletterService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';

const EMAIL_TEMPLATES = [
    {
        id: 'welcome',
        name: 'Bienvenue',
        subject: 'Bienvenue chez MAVEED ! 🎬',
        content: `<h3>Bonjour !</h3>
<p>Nous sommes ravis de vous compter parmi nous. MAVEED est en constante évolution pour vous offrir le meilleur de l'IA vidéo.</p>
<p>Préparez-vous à recevoir du contenu exclusif et des conseils pour vos créations.</p>`
    },
    {
        id: 'announcement',
        name: 'Annonce',
        subject: 'Du nouveau sur MAVEED ! 🚀',
        content: `<h3>Grande Nouvelle !</h3>
<p>Nous venons de déployer de nouvelles fonctionnalités sur la plateforme que vous allez adorer.</p>
<p>Connectez-vous dès maintenant pour les découvrir !</p>`
    },
    {
        id: 'promotion',
        name: 'Promotion',
        subject: 'Offre Spéciale : -20% sur votre abonnement 🎁',
        content: `<h3>Offre Spéciale !</h3>
<p>Pour vous remercier de votre fidélité, profitez de 20% de réduction sur votre prochain passage à un plan supérieur avec le code <strong>MAVEED20</strong>.</p>`
    }
];

const SubscriberRow = ({ sub, index, isSelected, onToggle }: any) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`group hover:bg-gray-50/80 transition-all border-b border-gray-100 ${isSelected ? 'bg-indigo-50/30' : ''}`}
        >
            <td className="px-8 py-5">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(sub.email)}
                    className="w-5 h-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
            </td>
            <td className="px-8 py-5">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-[#e2a9f1]/20">
                        {sub.email[0].toUpperCase()}
                    </div>
                    <span className="font-black text-gray-900 tracking-tight">{sub.email}</span>
                </div>
            </td>
            <td className="px-8 py-5 text-sm font-bold text-gray-400">
                {new Date(sub.subscribedAt).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </td>
            <td className="px-8 py-5">
                <span className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${sub.status === 'active'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                    }`}>
                    {sub.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
            </td>
        </motion.tr>
    );
};

export default function NewsletterPage() {
    const { showToast } = useToast();
    const [subscribers, setSubscribers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailData, setEmailData] = useState({ subject: '', content: '' });
    const [sending, setSending] = useState(false);

    const loadSubscribers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getNewsletterSubscribers();
            setSubscribers(response.subscribers);
        } catch (error) {
            console.error('Error loading subscribers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSubscribers();
    }, [loadSubscribers]);

    const filteredSubscribers = subscribers.filter(sub =>
        sub.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleSelectAll = () => {
        if (selectedEmails.length === filteredSubscribers.length) {
            setSelectedEmails([]);
        } else {
            setSelectedEmails(filteredSubscribers.map(s => s.email));
        }
    };

    const toggleSelect = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    const handleApplyTemplate = (templateId: string) => {
        const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setEmailData({ subject: template.subject, content: template.content });
        }
    };

    const handleSendBulkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedEmails.length === 0) return;

        try {
            setSending(true);
            await sendBulkNewsletterEmail(selectedEmails, emailData.subject, emailData.content);

            showToast(`Email envoyé avec succès à ${selectedEmails.length} abonnés`, 'success');
            setShowEmailModal(false);
            setSelectedEmails([]);
            setEmailData({ subject: '', content: '' });
        } catch (error) {
            console.error('Error sending bulk email:', error);
            showToast('Erreur lors de l\'envoi de l\'email', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Email,Date,Status\n"
            + subscribers.map(s => `${s.email},${new Date(s.subscribedAt).toLocaleDateString()},${s.status}`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "abonnés_newsletter.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-10 pb-12 text-gray-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Audience Newsletter</h1>
                    <p className="text-gray-500 font-medium mt-1">Gérez vos abonnés et communiquez avec votre audience</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowEmailModal(true)}
                        disabled={selectedEmails.length === 0}
                        className={`px-8 py-5 rounded-[1.8rem] font-black flex items-center gap-3 transition-all shadow-2xl ${selectedEmails.length > 0
                            ? 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-400/50'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            }`}
                    >
                        <span className="text-xl">✉️</span> ENVOYER UN E-MAIL ({selectedEmails.length})
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-8 py-5 bg-gray-900 text-white rounded-[1.8rem] font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gray-400/50"
                    >
                        <span className="text-xl">📥</span> EXPORTER CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                        <input
                            type="text"
                            placeholder="Rechercher un email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-6 py-5 bg-gray-50 border-none rounded-[1.8rem] font-bold text-gray-800 focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={loadSubscribers}
                        className="px-10 py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white rounded-[1.8rem] hover:opacity-90 transition-all font-black shadow-lg shadow-[#e2a9f1]/30"
                    >
                        RAFRAÎCHIR
                    </button>
                </div>
            </div>

            {/* Subscribers Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-50 overflow-hidden">
                {loading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Synchronisation de l&apos;audience...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 w-20">
                                        <input
                                            type="checkbox"
                                            checked={selectedEmails.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Abonné</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inscrit le</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredSubscribers.length > 0 ? (
                                        filteredSubscribers.map((sub, i) => (
                                            <SubscriberRow
                                                key={sub._id}
                                                sub={sub}
                                                index={i}
                                                isSelected={selectedEmails.includes(sub.email)}
                                                onToggle={toggleSelect}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-32 text-center">
                                                <span className="text-5xl mb-6 block">📭</span>
                                                <p className="text-gray-400 font-black uppercase text-sm tracking-widest">Aucun abonné détecté</p>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Email Modal */}
            <AnimatePresence>
                {showEmailModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] max-w-4xl w-full shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Envoyer un message groupé</h2>
                                    <p className="text-gray-500 font-medium">{selectedEmails.length} destinataires sélectionnés</p>
                                </div>
                                <button onClick={() => setShowEmailModal(false)} className="text-3xl grayscale hover:grayscale-0 transition-all">❌</button>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sujet de l&apos;email</label>
                                        <input
                                            type="text"
                                            value={emailData.subject}
                                            onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                                            placeholder="Saisissez le sujet..."
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contenu (HTML supporté)</label>
                                        <textarea
                                            rows={12}
                                            value={emailData.content}
                                            onChange={(e) => setEmailData({ ...emailData, content: e.target.value })}
                                            placeholder="Écrivez votre message ici..."
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="flex items-center justify-end space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmailModal(false)}
                                            className="px-8 py-4 bg-white border border-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSendBulkEmail}
                                            disabled={sending || !emailData.subject || !emailData.content}
                                            className={`px-10 py-4 rounded-2xl font-black shadow-xl transition-all ${sending || !emailData.subject || !emailData.content
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-400/40'
                                                }`}
                                        >
                                            {sending ? 'ENVOI EN COURS...' : 'DISTRIBUER MAINTENANT'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Templates Prédéfinis</p>
                                    <div className="space-y-4">
                                        {EMAIL_TEMPLATES.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleApplyTemplate(template.id)}
                                                className="w-full p-6 text-left bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-indigo-500/30 hover:bg-white transition-all group"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-black text-gray-900 tracking-tight">{template.name}</span>
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">✅</span>
                                                </div>
                                                <p className="text-xs text-gray-400 line-clamp-2">{template.subject}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-indigo-50 rounded-[1.5rem] p-6 border border-indigo-100">
                                        <p className="text-indigo-700 text-xs font-bold leading-relaxed">
                                            💡 Astuces :<br />
                                            - Utilisez du HTML pour styliser vos messages.<br />
                                            - Testez toujours sur un email personnel avant un envoi groupé.<br />
                                            - Soyez concis et percutant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
