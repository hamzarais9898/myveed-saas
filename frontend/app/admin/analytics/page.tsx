'use client';

import { useEffect, useState, useCallback } from 'react';
import { getRevenueAnalytics, getUserGrowthAnalytics } from '@/services/adminService';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const ChartCard = ({ title, children, index }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white rounded-[2.5rem] p-10 border border-gray-50 shadow-2xl shadow-gray-200/50 hover:shadow-gray-200/80 transition-shadow"
    >
        <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight uppercase tracking-[0.1em] text-gray-400 text-xs">{title}</h3>
        <div className="h-[400px] w-full">
            {children}
        </div>
    </motion.div>
);

export default function AnalyticsPage() {
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState(30);
    const [loading, setLoading] = useState(true);

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const [revenueRes, usersRes] = await Promise.all([
                getRevenueAnalytics(timeRange),
                getUserGrowthAnalytics(timeRange)
            ]);
            setRevenueData(revenueRes.data);
            setUserGrowthData(usersRes.data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [timeRange]);

    useEffect(() => {
        loadAnalytics();
    }, [timeRange, loadAnalytics]);

    const totalRevenue = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalUsers = userGrowthData.reduce((sum, d) => sum + (d.count || 0), 0);

    return (
        <div className="space-y-10 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight text-transparent bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text">Analyses Avancées</h1>
                    <p className="text-gray-500 font-medium mt-1">Intelligence économique et croissance de la plateforme</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(parseInt(e.target.value))}
                            className="appearance-none pl-8 pr-12 py-5 bg-white border border-gray-100 rounded-3xl font-black text-gray-900 text-sm shadow-xl shadow-gray-200/50 focus:ring-4 focus:ring-[#e2a9f1]/20 outline-none transition-all cursor-pointer"
                        >
                            <option value={7}>7 DERNIERS JOURS</option>
                            <option value={30}>30 DERNIERS JOURS</option>
                            <option value={90}>90 DERNIERS JOURS</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">▼</div>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-[#e2a9f1]/30 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">Volume d&apos;Affaires</p>
                    <div className="text-6xl font-black tracking-tighter mb-4">{totalRevenue.toFixed(2)}€</div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-md">
                        <span className="animate-pulse">📈</span> {revenueData.length} transactions enregistrées
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-400/30 relative overflow-hidden"
                >
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c77ddf]/20 rounded-full -ml-20 -mb-20 blur-3xl" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-4">Nouveaux Profils</p>
                    <div className="text-6xl font-black tracking-tighter mb-4">{totalUsers}</div>
                    <div className="flex items-center gap-2 text-sm font-bold bg-emerald-500/20 text-emerald-400 w-fit px-4 py-2 rounded-full backdrop-blur-md border border-emerald-500/10">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" /> Acquisition stable
                    </div>
                </motion.div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="w-16 h-16 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin shadow-lg" />
                    <p className="font-black text-gray-400 animate-pulse tracking-widest uppercase text-xs">Extraction des data-streams...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    <ChartCard title="Évolution du Chiffre d'Affaires" index={0}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e2a9f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#e2a9f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis
                                    dataKey="_id"
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `${val}€`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: '16px',
                                        border: 'none',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                    itemStyle={{ color: '#e2a9f1', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#e2a9f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <ChartCard title="Flux Transactionnel" index={1}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userGrowthData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="_id"
                                        stroke="#94a3b8"
                                        fontSize={10}
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderRadius: '16px',
                                            border: 'none',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#c77ddf" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        <ChartCard title="Performance Combinée" index={2}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="_id" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#e2a9f1" strokeWidth={4} dot={{ r: 4, fill: '#e2a9f1', strokeWidth: 2, stroke: '#fff' }} />
                                    <Line yAxisId="right" type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={4} dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                </div>
            )}
        </div>
    );
}
