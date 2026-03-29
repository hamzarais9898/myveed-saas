'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, LogOut, CreditCard, LayoutDashboard, Languages, User, TrendingUp, Video, Wand2, Mic, Users, Star, BarChart3, Music, Layers, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { logout, getCurrentUser } from '@/services/authService';
import { getCurrentSubscription } from '@/services/subscriptionService';
import { useLanguage } from '@/context/LanguageContext';
import { getPlatformStatus } from '@/services/platformService';
import { TikTokIcon, YouTubeIcon, InstagramIcon } from './ModernIcons';
import { motion, AnimatePresence } from 'framer-motion';

// ... imports remain the same

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const user = getCurrentUser();
    const { language, setLanguage, t } = useLanguage();
    const [subscription, setSubscription] = useState<any>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showLanguages, setShowLanguages] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [showDashboardMenu, setShowDashboardMenu] = useState(false);
    const createMenuRef = useRef<HTMLDivElement>(null);
    const dashboardMenuRef = useRef<HTMLDivElement>(null);

    const [connectedPlatforms, setConnectedPlatforms] = useState({
        tiktok: false,
        youtube: false,
        instagram: false
    });

    useEffect(() => {
        const checkConnections = async () => {
            try {
                const status = await getPlatformStatus();
                setConnectedPlatforms({
                    tiktok: !!status.tiktok,
                    youtube: !!status.youtube,
                    instagram: !!status.instagram
                });
            } catch (error) {
                console.error('Error checking connections:', error);
            }
        };

        checkConnections();
    }, []);

    useEffect(() => {
        loadSubscription();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setShowCreateMenu(false);
            }
            if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(event.target as Node)) {
                setShowDashboardMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadSubscription = async () => {
        try {
            const response = await getCurrentSubscription();
            setSubscription(response.subscription);
        } catch (error) {
            console.error('Error loading subscription:', error);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    // Grouped navigation
    interface NavItem {
        href: string;
        label: string;
        icon: any;
        badge?: boolean;
    }

    const createItems: NavItem[] = [
        { href: '/shorts', label: t('common.nav.shorts'), icon: Video },
        { href: '/generate', label: t('common.nav.generate'), icon: Wand2 },
        { href: '/text-to-speech', label: t('common.nav.tts'), icon: Mic },
        { href: '/image-fusion', label: t('common.nav.imageFusion') || 'Fusion d\'images', icon: Sparkles },
        // { href: '/create-influencer', label: t('features.influencers.title'), icon: Users, badge: true },
    ];
    const dashboardItems = [
        { href: '/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
        { href: '/drafts', label: t('shorts.drafts.title'), icon: Layers },
        { href: '/analytics', label: t('common.nav.analytics'), icon: BarChart3 },
    ];

    const isActive = (path: string) => pathname === path;
    const isGroupActive = (items: { href: string }[]) => items.some(item => pathname === item.href);

    return (
        <>
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="relative w-9 h-9 transition-transform group-hover:scale-110 duration-200">
                                <Image
                                    src="/images/logoremakeit.png"
                                    alt={t('common.logoAlt')}
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                    priority
                                />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">
                                MAVEED
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center space-x-4">
                            {/* Platforms Status */}
                            {(connectedPlatforms.tiktok || connectedPlatforms.youtube || connectedPlatforms.instagram) ? (
                                <Link href="/platforms" className="flex items-center gap-2 mr-2 group">
                                    <div className="flex -space-x-2 hover:space-x-1 transition-all">
                                        {connectedPlatforms.tiktok && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="relative z-30"
                                            >
                                                <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white shadow-lg border-2 border-white">
                                                    <TikTokIcon className="w-4 h-4" />
                                                </div>
                                                <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-white"></span>
                                                </span>
                                            </motion.div>
                                        )}
                                        {/* Placeholders for YouTube/Insta if connected later */}
                                    </div>
                                    <div className="hidden group-hover:block px-2 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase rounded-lg border border-green-100 animate-in fade-in slide-in-from-left-1">
                                        Connecté
                                    </div>
                                </Link>
                            ) : (
                                <Link href="/platforms" className="mr-2">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all"
                                    >
                                        <div className="flex items-center -space-x-1">
                                            <TikTokIcon className="w-3 h-3" />
                                            <YouTubeIcon className="w-3 h-3" />
                                            <InstagramIcon className="w-3 h-3" />
                                        </div>
                                        <span className="text-xs font-bold">{t('common.nav.platforms')}</span>
                                    </motion.button>
                                </Link>
                            )}

                            {/* Stars - Single Link */}
                            <Link
                                href="/create-influencer"
                                className={`relative px-3 py-2 text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${isActive('/create-influencer') ? 'text-[#c77ddf]' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <Users className="w-4 h-4" />
                                {t('common.nav.stars')}
                            </Link>

                            {/* Créer - Dropdown */}
                            <div className="relative" ref={createMenuRef}>
                                <button
                                    onClick={() => { setShowCreateMenu(!showCreateMenu); setShowDashboardMenu(false); }}
                                    className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-lg ${isGroupActive(createItems) ? 'text-[#c77ddf] bg-[#e2a9f1]/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                >
                                    <Wand2 className="w-4 h-4" />
                                    {t('common.create')}
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showCreateMenu && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {createItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setShowCreateMenu(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-gray-50 ${isActive(item.href) ? 'text-[#c77ddf] bg-[#e2a9f1]/5' : 'text-gray-700'}`}
                                                >
                                                    <Icon className={`w-4 h-4 ${isActive(item.href) ? 'text-[#c77ddf]' : 'text-gray-400'}`} />
                                                    <span className="font-medium">{item.label}</span>
                                                    {item.badge && (
                                                        <span className="ml-auto flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Dashboard - Dropdown */}
                            <div className="relative" ref={dashboardMenuRef}>
                                <button
                                    onClick={() => { setShowDashboardMenu(!showDashboardMenu); setShowCreateMenu(false); }}
                                    className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all duration-300 rounded-lg ${isGroupActive(dashboardItems) ? 'text-[#c77ddf] bg-[#e2a9f1]/10' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    {t('common.dashboard')}
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showDashboardMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showDashboardMenu && (
                                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {dashboardItems.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setShowDashboardMenu(false)}
                                                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-gray-50 ${isActive(item.href) ? 'text-[#c77ddf] bg-[#e2a9f1]/5' : 'text-gray-700'}`}
                                                >
                                                    <Icon className={`w-4 h-4 ${isActive(item.href) ? 'text-[#c77ddf]' : 'text-gray-400'}`} />
                                                    <span className="font-medium">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Right Section */}
                        <div className="hidden lg:flex items-center space-x-3">
                            {/* Credits Badge */}
                            {subscription && (
                                <Link href="/subscriptions">
                                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 border border-[#e2a9f1]/20 rounded-full hover:border-[#c77ddf]/40 transition-all cursor-pointer">
                                        <svg className="w-4 h-4 text-[#c77ddf]" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-[#c77ddf]">
                                            {subscription.plan === 'professional' ? '∞' : subscription.remainingCredits}
                                        </span>
                                    </div>
                                </Link>
                            )}

                            {/* Plan Badge */}
                            {subscription && (
                                <Link href="/subscriptions">
                                    <div className="px-3 py-1.5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-full hover:opacity-90 transition-opacity cursor-pointer">
                                        <span className="text-xs font-bold text-white uppercase tracking-wide">
                                            {subscription.plan}
                                        </span>
                                    </div>
                                </Link>
                            )}

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || t('common.nav.user')[0]}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-xs font-semibold text-gray-700 leading-tight">{user?.name || t('common.nav.user')}</p>
                                        <p className="text-[10px] text-gray-500 leading-tight truncate w-32">{user?.email}</p>
                                    </div>
                                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user?.name || t('common.nav.user')}</p>
                                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                        </div>

                                        <Link
                                            href="/analytics"
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                                <span style={{ color: "black" }}>{t('common.nav.kpi')}</span>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <span style={{ color: "black" }}>{t('common.nav.profile')}</span>
                                            </div>
                                        </Link>
                                        <Link
                                            href="/subscriptions"
                                            className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            <span>{t('common.nav.subscriptions')}</span>
                                        </Link>

                                        {user?.role === 'admin' && (
                                            <Link
                                                href="/admin"
                                                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{t('common.nav.admin')}</span>
                                            </Link>
                                        )}

                                        <div className="border-t border-gray-100 mt-2 pt-2">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                <span>{t('common.logout')}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {showMobileMenu && (
                        <div className="lg:hidden py-4 space-y-1 border-t border-gray-200 px-4">
                            {/* Stars */}
                            <Link
                                href="/create-influencer"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/create-influencer')
                                    ? 'bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 text-[#c77ddf] border border-[#e2a9f1]/20'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <Users className="w-4 h-4" />
                                <span>{t('features.influencers.title')}</span>
                            </Link>

                            {/* Create Section */}
                            <div className="pt-2 pb-1">
                                <span className="px-4 text-xs font-semibold text-gray-400 uppercase">{t('common.create')}</span>
                            </div>
                            {createItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(item.href)
                                            ? 'bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 text-[#c77ddf] border border-[#e2a9f1]/20'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                        {item.badge && (
                                            <span className="ml-auto flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Dashboard Section */}
                            <div className="pt-3 pb-1">
                                <span className="px-4 text-xs font-semibold text-gray-400 uppercase">{t('common.dashboard')}</span>
                            </div>
                            {dashboardItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(item.href)
                                            ? 'bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 text-[#c77ddf] border border-[#e2a9f1]/20'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}

                            {/* Platforms Mobile Link */}
                            <Link
                                href="/platforms"
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive('/platforms')
                                    ? 'bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 text-[#c77ddf] border border-[#e2a9f1]/20'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <Music className="w-4 h-4" />
                                <span>{t('common.nav.platforms')}</span>
                                {(connectedPlatforms.tiktok || connectedPlatforms.youtube || connectedPlatforms.instagram) && (
                                    <span className="ml-auto flex items-center gap-1">
                                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                        <span className="text-xs text-green-600">Connecté</span>
                                    </span>
                                )}
                            </Link>

                            <Link
                                href="/subscriptions"
                                className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all border border-transparent"
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <span>{t('common.nav.subscriptions')}</span>
                            </Link>

                            {user?.role === 'admin' && (
                                <Link
                                    href="/admin"
                                    className="flex items-center px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all border border-transparent"
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    <span>{t('common.nav.admin')}</span>
                                </Link>
                            )}

                            {/* Mobile Language Switcher */}
                            <div className="grid grid-cols-5 gap-2 px-2 py-4">
                                {(['fr', 'en', 'es', 'de', 'ar'] as const).map((lang) => (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang)}
                                        className={`px-2 py-2 text-xs font-black uppercase rounded-lg transition-all border ${language === lang
                                            ? 'bg-purple-50 text-purple-600 border-purple-200'
                                            : 'text-gray-400 border-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-200">
                                <div className="px-3 py-2 mb-2">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || t('common.nav.user')}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>{t('common.logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Floating Vertical Language Switcher (Right position, likely above potential chatbot) */}
            <div className="fixed right-4 bottom-24 z-40 hidden lg:flex flex-col gap-2 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100">
                {(['fr', 'en', 'es', 'de', 'ar'] as const).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`w-8 h-8 flex items-center justify-center text-[10px] font-black uppercase rounded-full transition-all ${language === lang
                            ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white shadow-md transform scale-110'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                    >
                        {lang}
                    </button>
                ))}
            </div>
        </>
    );
}
