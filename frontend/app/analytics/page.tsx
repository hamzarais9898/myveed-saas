'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCurrentUser, getToken } from '@/services/authService';
import { Loader2, TrendingUp, Target, Calculator, Plus, X, Award, BarChart3, ArrowUpRight, RefreshCw, Youtube, Facebook, Music2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_URL } from '@/lib/config';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Goals from '@/components/analytics/Goals';
import Simulator from '@/components/analytics/Simulator';

function AnalyticsContent() {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Overview Data
    const [overview, setOverview] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [period, setPeriod] = useState(7);
    const [selectedPlatform, setSelectedPlatform] = useState('all');

    useEffect(() => {
        const currentUser = getCurrentUser();
        const token = getToken();
        setUser(currentUser);
        setToken(token);

        if (token) {
            fetchAllData(token);
        } else {
            setLoading(false);
        }
    }, [period, selectedPlatform]);

    const fetchAllData = async (authToken: string) => {
        try {
            setLoading(true);
            const [overviewRes, trendsRes] = await Promise.all([
                fetch(`${API_URL}/analytics/overview?period=${period}`, { headers: { Authorization: `Bearer ${authToken}` } }),
                fetch(`${API_URL}/analytics/trends?period=${period}&platform=${selectedPlatform}`, { headers: { Authorization: `Bearer ${authToken}` } })
            ]);

            const [ovData, trData] = await Promise.all([overviewRes.json(), trendsRes.json()]);

            if (ovData.success) setOverview(ovData.overview);
            if (trData.success) setTrends(trData.trends);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        if (!token) return;
        setSyncing(true);
        try {
            const res = await fetch(`${API_URL}/analytics/sync-all?limit=20`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchAllData(token);
            }
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSyncing(false);
        }
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num;
    };

    if (loading && !overview) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#c77ddf]" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-2">
                                Analytics & Objectifs
                            </h1>
                            <p className="text-gray-600">Suivez vos performances réelles par plateforme</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={period}
                                onChange={(e) => setPeriod(parseInt(e.target.value))}
                                className="bg-gray-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#e2a9f1] outline-none"
                            >
                                <option value={7}>7 derniers jours</option>
                                <option value={30}>30 derniers jours</option>
                            </select>
                            <button
                                onClick={handleSyncAll}
                                disabled={syncing}
                                className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Synchronisation...' : 'Actualiser'}
                            </button>
                        </div>
                    </div>

                    {/* Custom Tabs */}
                    <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-2xl w-full sm:w-fit mb-8 border border-gray-200">
                        {['overview', 'goals', 'simulator'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-white text-[#c77ddf] shadow-lg shadow-[#e2a9f1]/10 border border-[#e2a9f1]/20'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                            >
                                {tab === 'overview' && <BarChart3 className="w-4 h-4" />}
                                {tab === 'goals' && <Target className="w-4 h-4" />}
                                {tab === 'simulator' && <Calculator className="w-4 h-4" />}
                                <span className="capitalize">
                                    {tab === 'overview' ? "Vue d'ensemble" : tab === 'goals' ? 'Objectifs' : 'Simulateur'}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#e2a9f1]/5 min-h-[500px]">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatsCard
                                        title={`Vues Totales (${period}j)`}
                                        value={formatNumber(overview?.totalViews || 0)}
                                        growth={overview?.viewsGrowth || 0}
                                        icon={<TrendingUp className="w-6 h-6 text-[#c77ddf]" />}
                                    />
                                    <StatsCard
                                        title="Réactions (Likes)"
                                        value={formatNumber(overview?.totalLikes || 0)}
                                        growth={overview?.likesGrowth || 0}
                                        icon={<Award className="w-6 h-6 text-[#c77ddf]" />}
                                    />
                                    <StatsCard
                                        title="Vidéos Publiées"
                                        value={overview?.totalPublishedVideos || 0}
                                        growth={0}
                                        icon={<Target className="w-6 h-6 text-[#c77ddf]" />}
                                        hideGrowth
                                    />
                                </div>

                                <div className="mt-12">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-[#c77ddf]" /> Tendances de Performance
                                        </h3>
                                        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                                            {[
                                                { id: 'all', label: 'Tout', icon: <BarChart3 className="w-3 h-3" /> },
                                                { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-3 h-3" /> },
                                                { id: 'tiktok', label: 'TikTok', icon: <Music2 className="w-3 h-3" /> },
                                                { id: 'facebook', label: 'Facebook', icon: <Facebook className="w-3 h-3" /> }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => setSelectedPlatform(p.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedPlatform === p.id
                                                        ? 'bg-white text-gray-900 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    {p.icon}
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-96 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trends}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                                                <XAxis
                                                    dataKey="label"
                                                    stroke="#9ca3af"
                                                    tick={{ fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    tick={{ fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dx={-10}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        borderColor: '#e5e7eb',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                    }}
                                                    itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="views"
                                                    stroke="#c77ddf"
                                                    strokeWidth={4}
                                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#10B981"
                                                    strokeWidth={4}
                                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GOALS TAB */}
                        {activeTab === 'goals' && (
                            <Goals token={token} apiUrl={API_URL} />
                        )}

                        {/* SIMULATOR TAB */}
                        {activeTab === 'simulator' && (
                            <Simulator />
                        )}
                    </div>
                </div>

            </div>
        </ProtectedRoute>
    );
}

function StatsCard({ title, value, growth, icon, hideGrowth = false }: any) {
    const isPositive = growth >= 0;
    return (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-[#e2a9f1]/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#e2a9f1]/10 rounded-xl group-hover:bg-[#e2a9f1]/20 transition-colors">
                    {icon}
                </div>
                {!hideGrowth && (
                    <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                        <ArrowUpRight className={`w-3 h-3 mr-1 ${!isPositive && 'rotate-90'}`} /> {isPositive ? '+' : ''}{growth.toFixed(1)}%
                    </span>
                )}
            </div>
            <h3 className="text-gray-500 text-sm font-semibold mb-1">{title}</h3>
            <p className="text-4xl font-black text-gray-900">{value}</p>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#c77ddf]" />
            </div>
        }>
            <AnalyticsContent />
        </Suspense>
    );
}
