'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    getPlatformStatus,
    disconnectPlatform,
    connectPlatform,
    savePlatformToken,
    handleInstagramCallback
} from '@/services/platformService';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Facebook,
    Linkedin,
    Youtube,
    Instagram,
    Music,
    CheckCircle2,
    Circle,
    ArrowRight,
    BarChart3,
    Users,
    Eye,
    History,
    Info,
    ChevronRight,
    TrendingUp,
    Zap,
    ShieldCheck,
    Smartphone
} from 'lucide-react';
import Image from 'next/image';

function PlatformsContent() {
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const searchParams = useSearchParams();

    const [accounts, setAccounts] = useState<any[]>([]);
    const [youtubeConnected, setYoutubeConnected] = useState(false);
    const [instagramConnected, setInstagramConnected] = useState(false);
    const [facebookConnected, setFacebookConnected] = useState(false);
    const [tiktokConnected, setTiktokConnected] = useState(false);
    const [instagramName, setInstagramName] = useState<string | null>(null);
    const [facebookName, setFacebookName] = useState<string | null>(null);
    const [tiktokName, setTiktokName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectLoading, setConnectLoading] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('connections');

    const displayName = (value?: string | null) =>
        value && value !== 'undefined' ? value : null;

    useEffect(() => {
        loadPlatformStatus();

        // Handle callbacks
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const tiktokConnected = searchParams.get('tiktok');
        const instagramConnectedStatus = searchParams.get('instagram');
        const facebookConnectedStatus = searchParams.get('facebook');

        if (code && state) {
            handleInstagramCallback(code, state);
        } else if (token) {
            if (instagramConnectedStatus) handleOAuthCallback('instagram', token);
        } else if (tiktokConnected !== null) {
            handleTikTokResponse(tiktokConnected);
        } else if (facebookConnectedStatus !== null) {
            handleFacebookResponse(facebookConnectedStatus);
        } else if (instagramConnectedStatus !== null) {
            handleInstagramResponse(instagramConnectedStatus);
        }
    }, [searchParams]);

    const handleTikTokResponse = (status: string) => {
        if (status === 'success') {
            showToast('Compte TikTok connecté avec succès', 'success');
        } else {
            showToast('Échec de la connexion TikTok', 'error');
        }
        router.replace('/platforms');
        loadPlatformStatus();
    };

    const loadPlatformStatus = async () => {
        try {
            const status = await getPlatformStatus();
            setYoutubeConnected(!!status.youtube);
            setInstagramConnected(!!status.instagram);
            setFacebookConnected(!!status.facebook);
            setTiktokConnected(!!status.tiktok);

            setInstagramName(
                displayName(status.instagram?.username) ||
                displayName(status.instagram?.pageName) ||
                null
            );

            setFacebookName(
                displayName(status.facebook?.name) ||
                displayName(status.facebook?.firstPageName) ||
                null
            );

            setTiktokName(
                displayName(status.tiktok?.username) ||
                null
            );
        } catch (err) {
            console.error('Error loading platform status:', err);
        }
    };

    const handleYouTubeResponse = (status: string) => {
        if (status === '1') {
            showToast('Compte YouTube connecté avec succès', 'success');
        } else {
            showToast('Échec de la connexion YouTube', 'error');
        }
        router.replace('/platforms');
        loadPlatformStatus();
    };

    const handleFacebookResponse = (status: string | null) => {
        const pagesFlag = searchParams.get('pages');
        if (status === 'success') {
            showToast('Compte Facebook connecté avec succès', 'success');
            if (pagesFlag === '0') {
                showToast("⚠️ Aucune Page Facebook trouvée. Crée une Page et reconnecte pour publier.", 'info');
            }
        } else {
            showToast('Échec de la connexion Facebook', 'error');
        }
        router.replace('/platforms');
        loadPlatformStatus();
    };


    const handleInstagramResponse = (status: string) => {
        if (status === '1') {
            showToast('Compte Instagram connecté avec succès', 'success');
        } else {
            showToast('Échec de la connexion Instagram', 'error');
        }
        router.replace('/platforms');
        loadPlatformStatus();
    };

    const handleOAuthCallback = async (platform: string, token: string) => {
        try {
            await savePlatformToken(platform, token);
            showToast(`Compte ${platform.charAt(0).toUpperCase() + platform.slice(1)} associé avec succès`, 'success');
            await loadPlatformStatus();
            router.replace('/platforms');
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Erreur lors de la connexion', 'error');
        }
    };

    const handleConnectPlatform = async (platform: string) => {
        setConnectLoading(platform);
        try {
            const response = await connectPlatform(platform);
            window.location.href = response.authUrl;
        } catch (err: any) {
            showToast(err.response?.data?.message || 'Erreur lors de la connexion', 'error');
            setConnectLoading(null);
        }
    };

    const handleDisconnectTikTok = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter votre compte TikTok ?')) return;
        try {
            await disconnectPlatform('tiktok');
            showToast('Compte TikTok déconnecté', 'info');
            loadPlatformStatus();
        } catch (err: any) {
            showToast('Erreur lors de la déconnexion TikTok', 'error');
        }
    };

    const handleDisconnectYouTube = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter votre compte YouTube ?')) return;
        try {
            await disconnectPlatform('youtube');
            showToast('Compte YouTube déconnecté', 'info');
            setYoutubeConnected(false);
        } catch (err: any) {
            showToast('Erreur lors de la déconnexion YouTube', 'error');
        }
    };

    const handleDisconnectInstagram = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter votre compte Instagram ?')) return;
        try {
            await disconnectPlatform('instagram');
            showToast('Compte Instagram déconnecté', 'info');
            setInstagramConnected(false);
        } catch (err: any) {
            showToast('Erreur lors de la déconnexion Instagram', 'error');
        }
    };

    const handleDisconnectFacebook = async () => {
        if (!confirm('Voulez-vous vraiment déconnecter votre compte Facebook ?')) return;
        try {
            await disconnectPlatform('facebook');
            showToast('Compte Facebook déconnecté', 'info');
            loadPlatformStatus();
        } catch (err: any) {
            showToast('Erreur lors de la déconnexion Facebook', 'error');
        }
    };

    const platforms = [
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: Music,
            color: 'from-[#ff0050] to-[#00f2ea]',
            connected: tiktokConnected,
            onConnect: () => handleConnectPlatform('tiktok'),
            onDisconnect: handleDisconnectTikTok,
            kpis: [
                { label: t('login.platforms.kpi.followers'), value: tiktokConnected ? '12.4K' : '--', icon: Users },
                { label: t('login.platforms.kpi.views'), value: tiktokConnected ? '450K' : '--', icon: Eye },
                { label: t('login.platforms.kpi.engagement'), value: tiktokConnected ? '4.8%' : '--', icon: TrendingUp },
            ]
        },
        {
            id: 'youtube',
            name: 'YouTube',
            icon: Youtube,
            color: 'from-[#FF0000] to-[#CC0000]',
            connected: youtubeConnected,
            onConnect: () => handleConnectPlatform('youtube'),
            onDisconnect: handleDisconnectYouTube,
            kpis: [
                { label: t('login.platforms.kpi.followers'), value: youtubeConnected ? '1.2K' : '--', icon: Users },
                { label: t('login.platforms.kpi.views'), value: youtubeConnected ? '15K' : '--', icon: Eye },
                { label: t('login.platforms.kpi.engagement'), value: youtubeConnected ? '4.2%' : '--', icon: TrendingUp },
            ]
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: Instagram,
            color: 'from-[#833AB4] via-[#FD1D1D] to-[#FCAF45]',
            connected: instagramConnected,
            onConnect: () => handleConnectPlatform('instagram'),
            onDisconnect: handleDisconnectInstagram,
            kpis: [
                { label: t('login.platforms.kpi.followers'), value: instagramConnected ? '8.1K' : '--', icon: Users },
                { label: t('login.platforms.kpi.views'), value: instagramConnected ? '250K' : '--', icon: Eye },
                { label: t('login.platforms.kpi.engagement'), value: instagramConnected ? '5.4%' : '--', icon: TrendingUp },
            ]
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'from-[#1877F2] to-[#0D65D3]',
            connected: facebookConnected,
            onConnect: () => handleConnectPlatform('facebook'),
            onDisconnect: () => handleDisconnectFacebook(),
            kpis: [
                { label: t('login.platforms.kpi.followers'), value: '15.2K', icon: Users },
                { label: t('login.platforms.kpi.views'), value: '380K', icon: Eye },
                { label: t('login.platforms.kpi.engagement'), value: '2.8%', icon: TrendingUp },
            ]
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: Linkedin,
            color: 'from-[#0A66C2] to-[#004182]',
            connected: false,
            onConnect: () => handleConnectPlatform('linkedin'),
            kpis: [
                { label: t('login.platforms.kpi.followers'), value: '3.4K', icon: Users },
                { label: t('login.platforms.kpi.views'), value: '45K', icon: Eye },
                { label: t('login.platforms.kpi.engagement'), value: '7.2%', icon: TrendingUp },
            ]
        }
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#e2a9f1]/20">
                {/* Animated Background Elements from Landing Page */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/10 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                    <div className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 right-0"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[300px] bg-gradient-to-r from-blue-100/10 via-purple-100/10 to-pink-100/10 blur-[100px] -z-10 rotate-12" />
                </div>

                <Navbar />

                {/* Hero Section */}
                <div className="relative pt-20 pb-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center space-x-2 bg-white/50 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 shadow-sm">
                                <Zap className="w-4 h-4 text-[#c77ddf]" />
                                <span className="text-xs font-black uppercase tracking-widest text-[#c77ddf]">
                                    Connect & Publish
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-7xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6 tracking-tight leading-tight">
                                {t('login.platforms.title')}
                            </h1>
                            <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                                {t('login.platforms.subtitle')}
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Main Tabs */}
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Sidebar / Navigation */}
                        <div className="lg:w-72 flex-shrink-0">
                            <div className="sticky top-28 space-y-2">
                                {[
                                    { id: 'connections', label: t('login.platforms.connect.title'), icon: Music },
                                    { id: 'kpi', label: t('login.platforms.kpi.title'), icon: BarChart3 },
                                    { id: 'how-to', label: t('login.platforms.instructions.title'), icon: Info }
                                ].map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id
                                                ? 'bg-black text-white shadow-xl shadow-gray-200 translate-x-2'
                                                : 'text-gray-500 hover:bg-white/50 backdrop-blur-md hover:text-gray-900 border border-transparent hover:border-white/20'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[#e2a9f1]' : 'text-gray-400'}`} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 min-h-[600px]">
                            <AnimatePresence mode="wait">
                                {activeTab === 'connections' && (
                                    <motion.div
                                        key="connections"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                    >
                                        {platforms.map((platform) => {
                                            const Icon = platform.icon;
                                            return (
                                                <div key={platform.id} className="group relative">
                                                    <div className="relative p-8 bg-white/70 backdrop-blur-xl border border-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 overflow-hidden h-full flex flex-col">
                                                        {/* Icon with Glowing Background */}
                                                        <div className="relative mb-8 flex justify-between items-start">
                                                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center text-white shadow-2xl transition-all duration-500 group-hover:rotate-6`}>
                                                                <Icon className="w-8 h-8" />
                                                            </div>
                                                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${platform.connected
                                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                                : 'bg-gray-50 text-gray-400 border border-gray-100'
                                                                }`}>
                                                                {platform.connected ? t('login.platforms.connect.statusConnected') : t('login.platforms.connect.statusDisconnected')}
                                                            </div>
                                                        </div>

                                                        <h3 className="text-2xl font-black text-gray-900 mb-2">{platform.name}</h3>
                                                        <p className="text-sm text-gray-500 font-medium mb-8">
                                                            {platform.connected
                                                                ? `${t('login.platforms.connect.statusConnected')} ${platform.id === 'youtube'
                                                                    ? '(Canal YouTube)'
                                                                    : platform.id === 'instagram'
                                                                        ? `: @${instagramName || "Connected"}`
                                                                        : platform.id === 'facebook'
                                                                            ? `: ${facebookName || "Connected"}`
                                                                            : `: @${tiktokName || "Connected"}`
                                                                }`
                                                                : `Connectez votre compte ${platform.name} pour automatiser vos publications.`
                                                            }
                                                        </p>

                                                        <div className="mt-auto">
                                                            {platform.connected ? (
                                                                <button
                                                                    onClick={platform.onDisconnect}
                                                                    className="w-full py-4 bg-gray-50 text-center rounded-2xl font-black text-sm text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                                                >
                                                                    {t('login.platforms.connect.disconnectBtn')}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={platform.onConnect}
                                                                    disabled={connectLoading === platform.id}
                                                                    className={`w-full py-4 bg-black text-white text-center rounded-2xl font-black text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 active:scale-[0.98] ${connectLoading === platform.id ? 'opacity-50' : ''}`}
                                                                >
                                                                    {connectLoading === platform.id ? (
                                                                        <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                                                    ) : (
                                                                        <>
                                                                            <Icon className="w-4 h-4" />
                                                                            {t('login.platforms.connect.connectBtn')}
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {activeTab === 'kpi' && (
                                    <motion.div
                                        key="kpi"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-8"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { label: t('login.platforms.kpi.followers'), value: '25.8K', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
                                                { label: t('login.platforms.kpi.views'), value: '1.2M', icon: Eye, color: 'text-[#e2a9f1]', bg: 'bg-[#e2a9f1]/5' },
                                                { label: t('login.platforms.kpi.engagement'), value: '5.2%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                                            ].map((stat, i) => (
                                                <div key={i} className="p-8 bg-white/70 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                                                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                                    </div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                    <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 text-center">
                                            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                                                <BarChart3 className="w-8 h-8 text-[#e2a9f1]" />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 mb-2">Statistiques par plateforme</h3>
                                            <p className="text-gray-500 font-medium mb-8 max-w-lg mx-auto">
                                                Visualisez les performances détaillées de chaque compte connecté pour optimiser votre stratégie de contenu.
                                            </p>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {platforms.map(p => (
                                                    <div key={p.id} className={`p-6 rounded-[2rem] border transition-all ${p.connected ? 'bg-white border-gray-200' : 'bg-gray-100/50 border-transparent opacity-40'}`}>
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <p className="font-black text-gray-900">{p.name}</p>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {p.kpis.map((kpi, j) => (
                                                                <div key={j} className="flex justify-between items-center text-xs">
                                                                    <span className="text-gray-500 font-bold">{kpi.label}</span>
                                                                    <span className="text-gray-900 font-black">{kpi.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'how-to' && (
                                    <motion.div
                                        key="how-to"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="max-w-3xl mx-auto"
                                    >
                                        <div className="space-y-12">
                                            <div className="text-center mb-12">
                                                <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                                    <ShieldCheck className="w-10 h-10 text-emerald-500" />
                                                </div>
                                                <h3 className="text-3xl font-black text-gray-900 mb-4">{t('login.platforms.instructions.title')}</h3>
                                                <p className="text-gray-500 font-medium">Suivez ces étapes simples pour lier vos comptes en toute sécurité.</p>
                                            </div>

                                            <div className="space-y-6">
                                                {[
                                                    { step: 1, text: t('login.platforms.instructions.step1'), icon: Smartphone },
                                                    { step: 2, text: t('login.platforms.instructions.step2'), icon: ShieldCheck },
                                                    { step: 3, text: t('login.platforms.instructions.step3'), icon: CheckCircle2 }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-start gap-8 p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex-shrink-0 w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-black text-xl">
                                                            {item.step}
                                                        </div>
                                                        <p className="text-lg font-bold text-gray-700 pt-2 leading-relaxed">
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-10 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-[3rem] text-white shadow-2xl shadow-[#e2a9f1]/30">
                                                <h4 className="text-2xl font-black mb-6">{t('login.platforms.instructions.whyTitle')}</h4>
                                                <ul className="space-y-4">
                                                    {[
                                                        t('login.platforms.instructions.benefit1'),
                                                        t('login.platforms.instructions.benefit2'),
                                                        t('login.platforms.instructions.benefit3')
                                                    ].map((benefit, i) => (
                                                        <li key={i} className="flex items-center gap-4 font-bold text-lg">
                                                            <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            {benefit}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </ProtectedRoute>
    );
}

export default function PlatformsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PlatformsContent />
        </Suspense>
    );
}
