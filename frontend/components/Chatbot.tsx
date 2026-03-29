'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function Chatbot() {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string, sender: 'bot' | 'user' }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    const suggestions = [
        {
            title: "Influenceurs IA 🌟",
            description: "Créez et gérez vos propres influenceurs IA pour générer des vidéos personnalisées",
            buttonText: "Créer",
            link: "/create-influencer",
            icon: "🤖",
            isNew: true,
            color: "from-[#e2a9f1] to-[#c77ddf]"
        },
        {
            title: "Générer 🚀",
            description: "Créez des vidéos virales à partir d'un simple prompt. L'IA fait tout le travail pour vous",
            buttonText: "Générer",
            link: "/generate",
            icon: "🪄",
            color: "from-amber-400 to-orange-600"
        },
        {
            title: "Tableau de bord 📁",
            description: "Gérez toutes vos vidéos générées, téléchargez-les et publiez-les sur vos réseaux",
            buttonText: "Accéder",
            link: "/dashboard",
            icon: "📂",
            color: "from-emerald-400 to-teal-600"
        },
        {
            title: "Analyses 📈",
            description: "Suivez vos performances sur TikTok, Instagram et YouTube avec des graphiques détaillés.",
            buttonText: "Analyser",
            link: "/analytics",
            icon: "📊",
            color: "from-violet-500 to-purple-700"
        },
        {
            title: "Publication Programmée 📅",
            description: "Programmez vos vidéos à l'avance et laissez MAVEED publier automatiquement sur tous vos réseaux.",
            buttonText: "Programmer",
            link: "/platforms",
            icon: "⏰",
            color: "from-rose-400 to-red-600"
        },
        {
            title: "Simulateur de Revenus 💰",
            description: "Estimez vos gains potentiels sur YouTube et TikTok en fonction de vos vues",
            buttonText: "Analyser",
            link: "/analytics?tab=simulator",
            icon: "💸",
            color: "from-green-500 to-emerald-700"
        },
        {
            title: "Objectifs 🎯",
            description: "Lancez-vous des défis et suivez votre progression pour booster votre motivation",
            buttonText: "Créer",
            link: "/analytics?tab=goals",
            icon: "🏆",
            color: "from-indigo-500 to-blue-700"
        }
    ];

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ text: t('chatbot.welcome'), sender: 'bot' }]);
        }
    }, [isOpen, messages.length, t]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    return (
        <div className="fixed bottom-6 right-6 z-[60]">
            {/* Chat Bubble */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform duration-300"
            >
                {isOpen ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 sm:w-[450px] bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <div className="p-8 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Dawer Bot ⚡</h3>
                            <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                <p className="text-[10px] font-bold uppercase tracking-widest">{t('chatbot.online')}</p>
                            </div>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                            <span className="text-2xl">⚡</span>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        className="h-[500px] overflow-y-auto px-6 py-6 space-y-8 scroll-smooth"
                    >
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.sender === 'bot'
                                    ? 'bg-gray-50 text-gray-800 rounded-bl-none border border-gray-100'
                                    : 'bg-indigo-600 text-white rounded-br-none shadow-lg shadow-indigo-200'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Suggestions & Outils</p>
                            <div className="grid grid-cols-1 gap-4">
                                {suggestions.map((suggestion, idx) => (
                                    <div
                                        key={idx}
                                        className="group p-5 bg-white rounded-3xl border border-gray-100 hover:border-[#e2a9f1] hover:shadow-xl hover:shadow-[#e2a9f1]/5 transition-all duration-300"
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 shrink-0 bg-gradient-to-br ${suggestion.color} rounded-2xl flex items-center justify-center text-xl shadow-lg`}>
                                                {suggestion.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-gray-900 text-sm tracking-tight">{suggestion.title}</h4>
                                                    {suggestion.isNew && (
                                                        <span className="px-1.5 py-0.5 bg-black text-white text-[8px] font-black rounded tracking-widest">NOUVEAU</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 font-medium leading-normal mb-3">
                                                    {suggestion.description}
                                                </p>
                                                <Link
                                                    href={suggestion.link}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${suggestion.color} hover:scale-105 active:scale-95 transition-all shadow-md`}
                                                >
                                                    {suggestion.buttonText}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
                        <Link
                            href="/register"
                            onClick={() => setIsOpen(false)}
                            className="flex-1 py-4 px-6 bg-indigo-600 text-white rounded-2xl text-center text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                        >
                            {t('chatbot.register')}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
