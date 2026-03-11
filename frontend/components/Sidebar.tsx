'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Video,
    Star,
    Users,
    Wand2,
    Mic,
    LayoutDashboard,
    BarChart3,
    Music,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const { t } = useLanguage();

    const sidebarItems = [
        { href: '/shorts', label: t('common.nav.shorts'), icon: Video },
        { href: '/stars', label: t('common.nav.stars'), icon: Star },
        { href: '/create-influencer', label: t('features.influencers.title'), icon: Users },
        { href: '/generate', label: t('common.nav.generate'), icon: Wand2 },
        { href: '/text-to-speech', label: t('common.nav.tts'), icon: Mic },
        { href: '/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
        { href: '/analytics', label: t('common.nav.analytics'), icon: BarChart3 },
        { href: '/tiktok-accounts', label: t('common.nav.tiktok'), icon: Music, badge: true },
    ];

    const isActive = (path: string) => pathname === path;

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`hidden lg:flex flex-col ${collapsed ? 'w-20' : 'w-64'} min-h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-300`}
        >
            {/* Collapse Button */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10"
            >
                {collapsed ? (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                ) : (
                    <ChevronLeft className="w-3 h-3 text-gray-500" />
                )}
            </button>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {sidebarItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <motion.div
                            key={item.href}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link
                                href={item.href}
                                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${active
                                    ? 'bg-gradient-to-r from-[#e2a9f1]/20 to-[#c77ddf]/20 text-[#c77ddf]'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                {/* Active indicator */}
                                {active && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#e2a9f1] to-[#c77ddf] rounded-r-full"
                                    />
                                )}

                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-[#c77ddf]' : 'text-gray-400 group-hover:text-gray-600'}`} />

                                {!collapsed && (
                                    <>
                                        <span className={`font-medium text-sm ${active ? 'text-[#c77ddf]' : ''}`}>
                                            {item.label}
                                        </span>

                                        {item.badge && (
                                            <span className="ml-auto flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[#00f2ea] opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2ea]"></span>
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            {!collapsed && (
                <div className="p-4 border-t border-gray-100">
                    <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('common.nav.settings')}</span>
                    </Link>
                </div>
            )}
        </motion.div>
    );
}
