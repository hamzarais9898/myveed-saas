'use client';

import { Target, Award, Clock, Trash2, Youtube, Music2, Facebook, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface GoalCardProps {
    goal: any;
    onDelete: (id: string) => void;
}

export default function GoalCard({ goal, onDelete }: GoalCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const progress = goal?.targetValue > 0
        ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
        : 0;
    const isCompleted = goal.status === 'completed';
    const isExpired = goal.status === 'expired';

    const getMetricLabel = (metric: string) => {
        switch (metric) {
            case 'views': return 'Vues';
            case 'videos': return 'Vidéos';
            case 'engagement': return 'Engagement';
            case 'revenue': return 'Revenus';
            default: return metric;
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'tiktok': return <Music2 className="w-4 h-4 text-black" />;
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            default: return <Target className="w-4 h-4 text-[#c77ddf]" />;
        }
    };

    const formatValue = (val: number, metric: string) => {
        if (metric === 'engagement') return `${val.toFixed(1)}%`;
        if (metric === 'revenue') return `${val.toLocaleString()} €`;
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
        return val.toLocaleString();
    };

    const handleDelete = async () => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
            setIsDeleting(true);
            await onDelete(goal._id);
            setIsDeleting(false);
        }
    };

    return (
        <div className={`bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-[#e2a9f1]/10 transition-all group relative overflow-hidden ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Background patterns */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none transform translate-x-4 -translate-y-4">
                <Target className="w-32 h-32 text-[#c77ddf]" />
            </div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${isCompleted ? 'bg-emerald-50 text-emerald-500' :
                        isExpired ? 'bg-rose-50 text-rose-500' : 'bg-violet-50 text-violet-500'
                        }`}>
                        {getPlatformIcon(goal.platform)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">{getMetricLabel(goal.metric)}</h3>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${isCompleted ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                isExpired ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                    'bg-violet-50 border-violet-100 text-violet-600'
                                }`}>
                                {goal.status}
                            </span>
                        </div>
                        <p className="text-gray-400 text-xs font-semibold capitalize">{goal.platform === 'global' ? 'Toutes plateformes' : goal.platform}</p>
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            <div className="mb-6 relative z-10">
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-3xl font-black text-gray-900">{formatValue(goal.currentValue, goal.metric)}</span>
                        <span className="text-gray-400 text-sm font-bold ml-1">/ {formatValue(goal.targetValue, goal.metric)}</span>
                    </div>
                    <div className={`text-sm font-black ${isCompleted ? 'text-emerald-500' : 'text-[#c77ddf]'}`}>
                        {Math.round(progress)}%
                    </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3.5 mb-2 overflow-hidden border border-gray-50">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                            'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf]'
                            }`}
                        style={{ width: `${progress}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-gray-400 pt-4 border-t border-gray-50 relative z-10">
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(goal.startDate).toLocaleDateString()}</span>
                </div>
                {goal.endDate && (
                    <div className="flex items-center gap-1.5">
                        <span>→</span>
                        <span>{new Date(goal.endDate).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {isCompleted && (
                <div className="absolute top-4 right-12 animate-bounce">
                    <Award className="w-6 h-6 text-yellow-400 drop-shadow-md" />
                </div>
            )}
        </div>
    );
}
