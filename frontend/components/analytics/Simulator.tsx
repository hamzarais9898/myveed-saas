'use client';

import React, { useState, useMemo } from 'react';
import {
    Youtube,
    Facebook,
    Instagram,
    Music2,
    TrendingUp,
    Calculator,
    Info,
    Target,
    Sparkles,
    ArrowRight,
    AlertCircle
} from 'lucide-react';

interface PlatformData {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    shadow: string;
    rpm: {
        min: number;
        avg: number;
        max: number;
    };
    explanation: string;
}

const PLATFORMS: PlatformData[] = [
    {
        id: 'youtube',
        name: 'YouTube',
        icon: <Youtube className="w-6 h-6" />,
        color: 'text-red-500',
        gradient: 'from-red-50 to-red-100/50',
        shadow: 'shadow-red-200/40',
        rpm: { min: 0.5, avg: 2, max: 5 },
        explanation: 'YouTube paie via le programme Partner Program. Le RPM dépend du pays, de la niche et du taux de rétention.'
    },
    {
        id: 'tiktok',
        name: 'TikTok',
        icon: <Music2 className="w-6 h-6" />,
        color: 'text-black',
        gradient: 'from-gray-50 to-gray-200/50',
        shadow: 'shadow-gray-300/40',
        rpm: { min: 0.02, avg: 0.2, max: 0.5 },
        explanation: 'TikTok Creator Fund paie peu par vue. Les revenus principaux viennent des lives et des partenariats.'
    },
    {
        id: 'facebook',
        name: 'Facebook',
        icon: <Facebook className="w-6 h-6" />,
        color: 'text-blue-600',
        gradient: 'from-blue-50 to-blue-100/50',
        shadow: 'shadow-blue-200/40',
        rpm: { min: 0.3, avg: 1.2, max: 3 },
        explanation: 'Facebook Ads on Reels et In-Stream Ads offrent des revenus stables basés sur le temps de lecture.'
    },
    {
        id: 'instagram',
        name: 'Instagram',
        icon: <Instagram className="w-6 h-6" />,
        color: 'text-pink-600',
        gradient: 'from-pink-50 to-pink-100/50',
        shadow: 'shadow-pink-200/40',
        rpm: { min: 0, avg: 0, max: 0 },
        explanation: 'Instagram ne paie pas directement par vue. Les revenus proviennent principalement des collaborations sponsorisées.'
    }
];

export default function Simulator() {
    const [selectedPlatform, setSelectedPlatform] = useState<PlatformData>(PLATFORMS[0]);
    const [views, setViews] = useState(100000);

    const results = useMemo(() => {
        const { min, avg, max } = selectedPlatform.rpm;
        return {
            min: (views / 1000) * min,
            avg: (views / 1000) * avg,
            max: (views / 1000) * max
        };
    }, [views, selectedPlatform]);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        });
    };

    const formatViews = (val: number) => {
        if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
        return val.toLocaleString();
    };

    return (
        <div className="max-w-4xl mx-auto py-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#e2a9f1]/10 rounded-full text-[#c77ddf] text-xs font-black uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Estimation Premium
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
                    Simulateur de <span className="bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">Revenus</span>
                </h2>
                <p className="text-gray-500 font-medium max-w-xl mx-auto">
                    Estimez vos gains mensuels potentiels en fonction de votre audience et de la plateforme choisie.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Controls */}
                <div className="lg:col-span-7 space-y-8 text-left h-full">
                    {/* Platform Selection */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                        <label className="text-sm font-black text-gray-400 uppercase tracking-wider mb-4 block">
                            Platforme
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {PLATFORMS.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => setSelectedPlatform(platform)}
                                    className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 group ${selectedPlatform.id === platform.id
                                            ? `bg-white border-[#e2a9f1] ${platform.shadow} scale-105 z-10`
                                            : 'bg-gray-50/50 border-transparent hover:border-gray-200'
                                        }`}
                                >
                                    <div className={`p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110 ${selectedPlatform.id === platform.id
                                            ? 'bg-[#e2a9f1]/20 ' + platform.color
                                            : 'bg-white shadow-sm text-gray-400'
                                        }`}>
                                        {platform.icon}
                                    </div>
                                    <span className={`text-xs font-bold ${selectedPlatform.id === platform.id ? 'text-gray-900' : 'text-gray-400'
                                        }`}>
                                        {platform.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Views Slider */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <label className="text-sm font-black text-gray-400 uppercase tracking-wider mb-2 block">
                                    Vues Mensuelles
                                </label>
                                <div className="text-4xl font-black text-gray-900 flex items-baseline gap-1">
                                    {formatViews(views)}
                                    <span className="text-lg text-[#c77ddf] animate-pulse">●</span>
                                </div>
                            </div>
                            <div className="h-12 w-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-[#c77ddf]" />
                            </div>
                        </div>

                        <div className="relative pt-6 pb-2">
                            <input
                                type="range"
                                min="1000"
                                max="5000000"
                                step="1000"
                                value={views}
                                onChange={(e) => setViews(parseInt(e.target.value))}
                                className="w-full h-2.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#c77ddf] transition-all"
                            />
                            <div className="flex justify-between text-[10px] font-black text-gray-300 mt-4 uppercase tracking-widest">
                                <span>1k</span>
                                <span>1M</span>
                                <span>2.5M</span>
                                <span>5M</span>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Explanation */}
                    <div className={`p-6 rounded-3xl border-2 transition-all duration-500 bg-white border-violet-50/50 shadow-lg shadow-violet-100/10`}>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                <Info className="w-5 h-5 text-[#c77ddf]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Comment ça marche ?</h4>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                    {selectedPlatform.explanation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Results */}
                <div className="lg:col-span-5 h-full">
                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-2xl shadow-[#c77ddf]/10 relative overflow-hidden h-full flex flex-col justify-between">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#e2a9f1]/10 to-transparent rounded-full blur-3xl -mr-24 -mt-24" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <div className="w-8 h-[2px] bg-gradient-to-r from-transparent to-[#e2a9f1]" />
                                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Estimations</span>
                                <div className="w-8 h-[2px] bg-gradient-to-l from-transparent to-[#e2a9f1]" />
                            </div>

                            {selectedPlatform.id === 'instagram' ? (
                                <div className="py-12 space-y-6">
                                    <div className="w-20 h-20 bg-pink-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                        <AlertCircle className="w-10 h-10 text-pink-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900 px-4">Partenariats Recommandés</h3>
                                    <p className="text-gray-500 font-medium px-4">
                                        Sur Instagram, vos revenus dépendent de vos posts sponsorisés et de votre taux d'engagement.
                                    </p>
                                    <button className="flex items-center gap-2 mx-auto py-3 px-6 bg-pink-50 text-pink-600 rounded-2xl font-bold hover:bg-pink-100 transition-colors">
                                        En découvrir plus <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-gray-400">Revenu moyen estimé</p>
                                        <div className="text-6xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent drop-shadow-sm">
                                            {formatCurrency(results.avg)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 hover:scale-[1.02] transition-transform">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Minimum</p>
                                            <p className="text-xl font-black text-gray-900">{formatCurrency(results.min)}</p>
                                        </div>
                                        <div className="bg-violet-50/30 p-5 rounded-3xl border border-violet-50 hover:scale-[1.02] transition-transform">
                                            <p className="text-[10px] font-black text-[#c77ddf] uppercase tracking-wider mb-2">Maximum</p>
                                            <p className="text-xl font-black text-gray-900">{formatCurrency(results.max)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50">
                                        <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-emerald-500 bg-emerald-50 py-2.5 px-4 rounded-xl">
                                            <Target className="w-3.5 h-3.5" />
                                            PRÉVISION BASÉE SUR UN RPM DE {selectedPlatform.rpm.avg.toFixed(2)}€
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="relative z-10 mt-12 bg-gray-50/50 p-5 rounded-2xl space-y-2 border border-gray-100">
                            <div className="flex items-center gap-2 justify-center">
                                <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[9px] font-black text-gray-400 border border-gray-200">BETA</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estimation non contractuelle</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold leading-tight">
                                Les revenus réels dépendent du pays, de la niche, du taux de rétention et de l'engagement global.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
