'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { subscribeToNewsletter } from '@/services/newsletterService';
import { motion, AnimatePresence } from 'framer-motion';

const InstagramIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={2} />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth={2} />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={2} />
    </svg>
);

const TikTokIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 1.15-.36 2.3-.5 3.44-.11 3.01-1.31 6.06-3.8 7.82-2.11 1.54-4.88 2.05-7.4 1.54-3.13-.57-5.91-2.95-6.6-6.04-.61-2.61-.01-5.59 1.74-7.66 1.73-2.11 4.58-3.04 7.22-2.38l-.01 4.09c-1.22-.33-2.6-.14-3.56.71-.97.83-1.37 2.19-1 3.42.33 1.16 1.35 2.14 2.55 2.36 1.05.21 2.22-.05 2.94-.87.72-.81.9-1.95.89-3.02-.01-3.69-.01-7.38-.01-11.07.01-.1-.01-.2.01-.3z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
);

const EmailIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

export default function Footer() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactData, setContactData] = useState({ subject: 'Support Technique', message: '', userEmail: '' });
    const [isSendingContact, setIsSendingContact] = useState(false);

    const CONTACT_SUBJECTS = [
        "Support Technique",
        "Question sur la Facturation",
        "Suggestion de fonctionnalité",
        "Partenariat / Business",
        "Signaler un bug",
        "Autre"
    ];

    const handleSendContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactData.userEmail || !contactData.message) {
            showToast('Veuillez remplir tous les champs', 'error');
            return;
        }

        setIsSendingContact(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    email: contactData.userEmail,
                    subject: contactData.subject,
                    message: contactData.message,
                    name: contactData.userEmail.split('@')[0] // Fallback name
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast('Message envoyé avec succès !', 'success');
                setShowContactModal(false);
                setContactData({ subject: 'Support Technique', message: '', userEmail: '' });
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de l\'envoi du message', 'error');
        } finally {
            setIsSendingContact(false);
        }
    };

    const handleSubscribe = async () => {
        if (!email || !email.includes('@')) {
            showToast('Veuillez entrer une adresse email valide', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await subscribeToNewsletter(email);
            if (response.success) {
                showToast(response.message || 'Merci pour votre inscription !', 'success');
                setEmail('');
            }
        } catch (error) {
            console.error(error);
            showToast('Une erreur est survenue lors de l\'inscription', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <footer className="bg-gray-50 pt-24 pb-12 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Newsletter */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center space-x-3 mb-6 group">
                            <div className="relative w-10 h-10 transition-transform group-hover:scale-110 duration-200">
                                <Image
                                    src="/images/logoremakeit.png"
                                    alt={t('common.logoAlt')}
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-2xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">
                                MAVEED
                            </span>
                        </Link>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            {t('footer.tagline')}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4 mb-8">
                            {[
                                { id: 'insta', icon: <InstagramIcon />, href: "https://www.instagram.com/maveed.io/?hl=fr", color: "hover:bg-gradient-to-tr hover:from-orange-500 hover:via-pink-500 hover:to-purple-600" },
                                { id: 'tiktok', icon: <TikTokIcon />, href: "https://www.tiktok.com/@maveed.io", color: "hover:bg-black" },
                                { id: 'linkedin', icon: <LinkedInIcon />, href: "https://www.linkedin.com/company/maveed/?viewAsMember=true", color: "hover:bg-[#0077b5]" },
                                { id: 'email', icon: <EmailIcon />, href: "#", color: "hover:bg-[#c77ddf]" }
                            ].map((social, idx) => (
                                <motion.a
                                    key={idx}
                                    href={social.href}
                                    target={social.href === '#' ? undefined : "_blank"}
                                    rel={social.href === '#' ? undefined : "noopener noreferrer"}
                                    onClick={(e) => {
                                        if (social.id === 'email') {
                                            e.preventDefault();
                                            setShowContactModal(true);
                                        }
                                    }}
                                    whileHover={{ scale: 1.15, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-11 h-11 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-500 ${social.color} hover:text-white hover:border-transparent transition-all duration-300 shadow-sm shadow-gray-200/50 cursor-pointer`}
                                    title={social.tooltip}
                                >
                                    {social.icon}
                                </motion.a>
                            ))}
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t('footer.newsletter')}</h4>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('footer.newsletter_placeholder')}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#e2a9f1] focus:border-transparent"
                                />
                                <button
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
                                >
                                    {isLoading ? '...' : (t('common.ok') || 'Ok')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">{t('footer.product')}</h4>
                        <ul className="space-y-4">
                            <li><Link href="/shorts" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.shorts')}</Link></li>
                            <li><Link href="/text-to-speech" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.tts')}</Link></li>
                            <li><Link href="/generate" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.ia')}</Link></li>
                            <li><Link href="/#pricing" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.pricing')}</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">{t('footer.resources')}</h4>
                        <ul className="space-y-4">
                            <li><Link href="/faq" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.faq')}</Link></li>
                            <li><Link href="/blog" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.blog')}</Link></li>
                            <li><Link href="/api-docs" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.api')}</Link></li>
                            <li><Link href="/support" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.support')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2">{t('footer.legal')}</h4>
                        <ul className="space-y-4">
                            <li><Link href="/terms" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.terms')}</Link></li>
                            <li><Link href="/privacy" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.privacy')}</Link></li>
                            <li><Link href="/legal" className="text-gray-500 hover:text-blue-600 transition-colors font-medium">{t('footer.links.legal')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center md:items-start gap-4">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <div className="relative w-12 h-12 bg-white rounded-2xl p-1.5 shadow-lg transition-transform group-hover:scale-105">
                                    <Image
                                        src="/images/logoremakeit.png"
                                        alt="MAVEED - Créateur Vidéo IA"
                                        width={48}
                                        height={48}
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-clip-text text-transparent">
                                    MAVEED
                                </span>
                                <div className="text-[10px] text-gray-500 font-medium -mt-1 uppercase tracking-widest">
                                    AI Video Automatisation
                                </div>
                            </div>
                        </Link>
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                        {t('footer.copyright')}
                    </p>
                </div>
            </div>

            {/* Contact Support Modal */}
            <AnimatePresence>
                {showContactModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[100] p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] max-w-xl w-full shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Contacter le Support</h2>
                                    <p className="text-gray-500 font-medium text-sm">Nous vous répondrons sous 24h</p>
                                </div>
                                <button onClick={() => setShowContactModal(false)} className="text-2xl hover:scale-110 transition-transform">❌</button>
                            </div>

                            <form onSubmit={handleSendContact} className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Votre adresse email</label>
                                    <input
                                        type="email"
                                        required
                                        value={contactData.userEmail}
                                        onChange={(e) => setContactData({ ...contactData, userEmail: e.target.value })}
                                        placeholder="votre@email.com"
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sujet de la demande</label>
                                    <select
                                        value={contactData.subject}
                                        onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all cursor-pointer"
                                    >
                                        {CONTACT_SUBJECTS.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message</label>
                                    <textarea
                                        rows={5}
                                        required
                                        value={contactData.message}
                                        onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                                        placeholder="Décrivez votre demande en détail..."
                                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all resize-none"
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowContactModal(false)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all"
                                    >
                                        ANNULER
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSendingContact}
                                        className={`flex-1 py-4 rounded-2xl font-black shadow-xl transition-all ${isSendingContact
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:scale-105 active:scale-95 shadow-indigo-400/40'
                                            }`}
                                    >
                                        {isSendingContact ? 'ENVOI...' : 'ENVOYER LE MESSAGE'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </footer>
    );
}
