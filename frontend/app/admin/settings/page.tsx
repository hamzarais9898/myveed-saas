'use client';

import { motion } from 'framer-motion';

export default function SettingsPage() {
    const settingsGroups = [
        {
            title: "Configuration Générale",
            icon: "⚙️",
            items: [
                { id: "site_name", label: "Nom de la plateforme", value: "MAVEED", type: "text" },
                { id: "admin_email", label: "Email de contact admin", value: "contact@maveed.io", type: "email" },
                { id: "currency", label: "Devise par défaut", value: "EUR (€)", type: "select" }
            ]
        },
        {
            title: "Paramètres d'Infrastructure IA",
            icon: "🤖",
            items: [
                { id: "default_model", label: "Modèle vidéo par défaut", value: "Runway Gen-3 Alpha", type: "select" },
                { id: "img_model", label: "Modèle image par défaut", value: "Imagen 3 Ultra", type: "select" },
                { id: "token_limit", label: "Limite de jetons journalière", value: "1,000,000", type: "number" }
            ]
        },
        {
            title: "Limites & Quotas",
            icon: "🛡️",
            items: [
                { id: "max_duration", label: "Durée vidéo max (sec)", value: "15", type: "number" },
                { id: "concurrent_jobs", label: "Générations simultanées/user", value: "3", type: "number" }
            ]
        }
    ];

    return (
        <div className="space-y-10 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Configuration Système</h1>
                    <p className="text-gray-500 font-medium mt-1">Ajustez les paramètres globaux et les limites de l&apos;infrastructure</p>
                </div>
                <button className="px-10 py-5 bg-gray-900 text-white rounded-[1.8rem] font-black hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gray-400/50">
                    ENREGISTRER LES MODIFICATIONS
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {settingsGroups.map((group, gIdx) => (
                    <motion.div
                        key={gIdx}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: gIdx * 0.1 }}
                        className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-2xl shadow-gray-200/50"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                {group.icon}
                            </div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{group.title}</h3>
                        </div>

                        <div className="space-y-6">
                            {group.items.map((item) => (
                                <div key={item.id} className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{item.label}</label>
                                    <div className="relative">
                                        <input
                                            type={item.type === 'number' ? 'number' : 'text'}
                                            defaultValue={item.value}
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl font-bold text-gray-800 outline-none focus:ring-4 focus:ring-[#e2a9f1]/20 transition-all"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300">
                                            ✏️
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-50 rounded-[2.5rem] p-10 border border-rose-100"
            >
                <div className="flex items-center gap-4 mb-4">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-xl font-black text-rose-900 tracking-tight">Zone de Sécurité</h3>
                </div>
                <p className="text-rose-700 font-medium mb-6">Les actions ci-dessous impactent directement le fonctionnement critique du serveur.</p>
                <div className="flex flex-wrap gap-4">
                    <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                        Vider les caches système
                    </button>
                    <button className="px-8 py-4 bg-white border border-rose-200 text-rose-600 rounded-2xl font-black hover:bg-rose-50 transition-all">
                        Réinitialiser les compteurs journaliers
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
