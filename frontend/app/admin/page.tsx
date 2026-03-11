'use client';

import { useEffect, useState, useCallback } from 'react';
import { getOverviewStats, getRevenueAnalytics, getUserGrowthAnalytics } from '@/services/adminService';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } as any
    })
};

const MetricCard = ({ title, value, subtext, icon, trend, index, color = "purple" }: any) => {
    const colorClasses: any = {
        purple: "from-[#e2a9f1]/10 to-[#c77ddf]/10 text-[#c77ddf] border-[#e2a9f1]/20",
        blue: "from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-500/20",
        green: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20",
        orange: "from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/20",
        rose: "from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-500/20"
    };

    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className={`relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 border transition-all hover:bg-white/80 group ${colorClasses[color]}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-400 font-black text-[10px] mb-2 uppercase tracking-[0.2em]">{title}</p>
                    <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-2 font-bold uppercase tracking-widest">{subtext}</p>}
                </div>
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-gray-200/50`}>
                    <span className="text-2xl">{icon}</span>
                </div>
            </div>
            {trend && (
                <div className="mt-6 flex items-center gap-2">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">vs mois dernier</span>
                </div>
            )}
        </motion.div>
    );
};

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const [statsRes, revenueRes, usersRes] = await Promise.all([
                getOverviewStats(),
                getRevenueAnalytics(30),
                getUserGrowthAnalytics(30)
            ]);

            setStats(statsRes.stats);
            setRevenueData(revenueRes.data);
            setUserGrowthData(usersRes.data);
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-[#e2a9f1]/20 rounded-full" />
                    <div className="w-20 h-20 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                </div>
            </div>
        );
    }

    const COLORS = ['#e2a9f1', '#c77ddf', '#9333ea', '#4f46e5', '#3b82f6'];

    return (
        <div className="space-y-12 pb-12 text-gray-900">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black tracking-tight text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text">Cockpit Décisionnel</h1>
                    <p className="text-gray-500 font-medium mt-1">Métriques de performance en temps réel et analyse de rentabilité</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={loadData}
                        className="px-8 py-4 bg-white border border-gray-100 rounded-[1.8rem] font-black text-gray-700 hover:bg-gray-50 transition-all shadow-xl shadow-gray-200/40 flex items-center gap-3"
                    >
                        <span className="text-lg">🔄</span> SYNCHRONISER
                    </button>
                    <div className="px-8 py-4 bg-gray-900 rounded-[1.8rem] font-black text-white shadow-2xl shadow-gray-400/50 flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-xs tracking-widest uppercase">MONITORING LIVE</span>
                    </div>
                </div>
            </div>

            {/* Core Business Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <MetricCard
                    title="Chiffre d'Affaires"
                    value={`${stats?.revenue?.total || 0}€`}
                    subtext={`${stats?.revenue?.thisMonth || 0}€ ce mois-ci`}
                    icon="💰"
                    index={0}
                    color="green"
                />
                <MetricCard
                    title="Revenu Récurrent"
                    value={`${stats?.subscriptions?.mrr || 0}€`}
                    subtext={`${stats?.subscriptions?.active || 0} abonnés actifs`}
                    icon="📈"
                    trend={12.5}
                    index={1}
                    color="purple"
                />
                <MetricCard
                    title="Base Utilisateurs"
                    value={(stats?.users?.total || 0).toLocaleString()}
                    subtext={`+${stats?.users?.thisMonth || 0} nouveaux inscrits`}
                    icon="👥"
                    trend={stats?.users?.growth}
                    index={2}
                    color="blue"
                />
                <MetricCard
                    title="Production Totale"
                    value={(stats?.videos?.total || 0).toLocaleString()}
                    subtext="Vidéos & Photos générées"
                    icon="🎬"
                    index={3}
                    color="orange"
                />
            </div>

            {/* PROFITABILITY HUB */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-gray-950 to-gray-800 rounded-[3rem] p-12 text-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden group border border-white/5"
            >
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#e2a9f1]/10 blur-[120px] rounded-full -mr-32 -mt-32 group-hover:bg-[#e2a9f1]/15 transition-all duration-1000" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-16 items-center text-left">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-[#e2a9f1]">
                            <span className="text-2xl">💎</span>
                            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Intelligence Financière</span>
                        </div>
                        <h2 className="text-5xl font-black leading-tight tracking-tighter">Analyse du Profit Net</h2>
                        <p className="text-gray-400 font-medium text-lg leading-relaxed">Évaluation de l&apos;efficience opérationnelle basée sur l&apos;infrastructure de génération IA.</p>
                        <div className="pt-4">
                            <div className={`inline-flex items-center gap-4 px-8 py-4 rounded-2xl font-black tracking-widest text-xs ${parseFloat(stats?.profitability?.profit || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {parseFloat(stats?.profitability?.profit || 0) >= 0 ? '✅ OPÉRATION RENTABLE' : '⚠️ MARGE NÉGATIVE'}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-inner">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Profit Net</p>
                            <h4 className={`text-5xl font-black tracking-tighter ${parseFloat(stats?.profitability?.profit || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stats?.profitability?.profit || 0}€
                            </h4>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-inner">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Coûts Directs</p>
                            <h4 className="text-5xl font-black text-white tracking-tighter">
                                {(stats?.profitability?.totalCost || 0).toFixed(2)}€
                            </h4>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/10 shadow-inner">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Marge Nette</p>
                            <h4 className="text-5xl font-black text-[#e2a9f1] tracking-tighter">
                                {stats?.profitability?.margin || 0}%
                            </h4>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Main Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Revenue Evolution */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-200/40 text-left"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Vélocité du Chiffre d&apos;Affaires</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Flux de trésorerie journalier (30 jours)</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                            <span className="w-3 h-3 bg-[#e2a9f1] rounded-full shadow-[0_0_10px_rgba(226,169,241,0.8)]" />
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Revenus</span>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e2a9f1" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#e2a9f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    dy={15}
                                    tickFormatter={(val) => val.split('-').slice(2).join('/')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    tickFormatter={(val) => `${val}€`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#e2a9f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* User Growth */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-200/40 text-left"
                >
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Croissance de l&apos;Audience</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Inscriptions quotidiennes (30 jours)</p>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                            <span className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Nouveaux</span>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowthData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    dy={15}
                                    tickFormatter={(val) => val.split('-').slice(2).join('/')}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '20px' }}
                                />
                                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={5} dot={{ fill: '#3b82f6', r: 6, strokeWidth: 3, stroke: '#fff' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Secondary Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Plan Distribution */}
                <div className="lg:col-span-1 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-2xl shadow-gray-200/40 text-left">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-10">Mix des Offres</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.subscriptions?.distribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={85}
                                    outerRadius={120}
                                    paddingAngle={10}
                                    dataKey="count"
                                >
                                    {(stats?.subscriptions?.distribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Advanced Stats List */}
                <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-100 shadow-2xl shadow-gray-200/40 text-left">
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-10">Efficience Opérationnelle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[
                            { label: "Taux de Conversion", value: `${stats?.users?.total > 0 ? ((stats?.subscriptions?.active / stats?.users?.total) * 100).toFixed(1) : 0}%`, icon: "🎯", color: "blue" },
                            { label: "Revenu Moyen (ARPU)", value: `${stats?.users?.total > 0 ? (stats?.revenue?.total / stats?.users?.total).toFixed(2) : 0}€`, icon: "💎", color: "purple" },
                            { label: "Coût Génération Image", value: `${(stats?.profitability?.imageCost || 0).toFixed(2)}€`, icon: "🖼️", color: "orange" },
                            { label: "Coût Génération Vidéo", value: `${(stats?.profitability?.totalCost || 0).toFixed(2)}€`, icon: "🎥", color: "rose" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-8 bg-gray-50 rounded-[2rem] group hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-6">
                                    <div className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{item.label}</p>
                                        <h5 className="text-3xl font-black text-gray-900 tracking-tighter">{item.value}</h5>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-300 group-hover:bg-gray-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                    →
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
