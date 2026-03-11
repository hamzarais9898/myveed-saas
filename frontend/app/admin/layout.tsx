'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/services/authService';

const IconWrapper = ({ children, color }: { children: React.ReactNode, color: string }) => (
    <motion.div
        whileHover={{ scale: 1.2, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-lg shadow-gray-200/50 group-hover:shadow-indigo-200/50 transition-all duration-300`}
    >
        {children}
    </motion.div>
);

const DashboardIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 13V16H7V13H4ZM9 9V16H12V9H9ZM14 5V16H17V5H14Z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const SubscriptionsIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
    </svg>
);

const PaymentsIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const AnalyticsIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

const VideosIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const NewsletterIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const SettingsIcon = () => (
    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Check authentication
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        // Check if user is admin
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            setUser(userData);
        }
    }, [router]);

    const menuItems = [
        { icon: <DashboardIcon />, label: 'Tableau de bord', href: '/admin', color: 'from-blue-400 to-blue-600' },
        { icon: <UsersIcon />, label: 'Utilisateurs', href: '/admin/users', color: 'from-emerald-400 to-emerald-600' },
        { icon: <SubscriptionsIcon />, label: 'Abonnements', href: '/admin/subscriptions', color: 'from-purple-400 to-purple-600' },
        { icon: <PaymentsIcon />, label: 'Paiements', href: '/admin/payments', color: 'from-amber-400 to-amber-600' },
        { icon: <AnalyticsIcon />, label: 'Analyses', href: '/admin/analytics', color: 'from-rose-400 to-rose-600' },
        { icon: <VideosIcon />, label: 'Vidéos', href: '/admin/videos', color: 'from-indigo-400 to-indigo-600' },
        { icon: <NewsletterIcon />, label: 'Newsletter', href: '/admin/newsletter', color: 'from-pink-400 to-pink-600' },
        { icon: <SettingsIcon />, label: 'Paramètres', href: '/admin/settings', color: 'from-gray-600 to-gray-800' },
    ];

    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-white/80 backdrop-blur-xl border-r border-gray-200/50 transition-all duration-500 z-40 shadow-2xl shadow-gray-200/50 ${sidebarOpen ? 'w-72' : 'w-24'
                    }`}
            >
                {/* Logo */}
                <div className="h-24 flex items-center justify-between px-6 border-b border-gray-100/50">
                    {sidebarOpen ? (
                        <Link href="/admin" className="flex items-center space-x-3">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-10 h-10 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-xl flex items-center justify-center shadow-lg shadow-[#e2a9f1]/20"
                            >
                                <span className="text-white text-xl font-black">M</span>
                            </motion.div>
                            <span className="text-xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                                MAVEED <span className="text-[#c77ddf]">ADMIN</span>
                            </span>
                        </Link>
                    ) : (
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-xl flex items-center justify-center shadow-lg shadow-[#e2a9f1]/20 mx-auto"
                        >
                            <span className="text-white text-xl font-black">M</span>
                        </motion.div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 mt-4">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-4 px-3 py-3 rounded-2xl transition-all duration-300 group relative ${router.toString().includes(item.href) && (item.href === '/admin' ? router.toString() === '/admin' : true)
                                ? 'bg-gradient-to-r from-[#e2a9f1]/5 to-transparent'
                                : 'hover:bg-gray-50/50 hover:px-4'
                                }`}
                        >
                            <IconWrapper color={item.color}>
                                {item.icon}
                            </IconWrapper>

                            {sidebarOpen && (
                                <span className={`font-bold tracking-tight text-sm transition-all duration-300 ${router.toString().includes(item.href) ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'
                                    }`}>
                                    {item.label}
                                </span>
                            )}

                            {router.toString().includes(item.href) && (
                                <motion.div
                                    layoutId="activeIndicator"
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#e2a9f1] rounded-l-full shadow-[0_0_15px_rgba(226,169,241,0.5)]"
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                {/* User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100/50 bg-gray-50/30">
                    <Link
                        href="/dashboard"
                        className="flex items-center space-x-4 p-3 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                    >
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xl group-hover:rotate-12 transition-transform">
                            👤
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-black text-gray-900 truncate">
                                    {user.name || user.email}
                                </div>
                                <div className="text-[10px] font-bold text-[#c77ddf] uppercase tracking-widest">Quitter l&apos;Admin</div>
                            </div>
                        )}
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-500 ${sidebarOpen ? 'ml-72' : 'ml-24'}`}>
                {/* Top Navbar */}
                <header className="h-24 bg-white/5 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between px-10">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all text-gray-400 hover:text-gray-900"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={sidebarOpen ? "M4 6h16M4 12h16M4 18h7" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Système Opérationnel</span>
                        </div>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Session en cours</p>
                            <p className="text-sm font-bold text-gray-700">
                                {new Date().toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long'
                                })}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-10 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
