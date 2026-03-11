'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function FAQPage() {
    const faqs = [
        { q: "Qu'est-ce que MAVEED ?", a: "MAVEED est une plateforme d'IA tout-en-un pour les créateurs de contenu, permettant de transformer des vidéos YouTube en Shorts, de générer des vidéos par IA et bien plus encore." },
        { q: "Comment fonctionnent les crédits ?", a: "Chaque action (génération de Shorts, TTS, etc.) consomme un certain nombre de crédits selon votre abonnement." },
        { q: "Puis-je annuler mon abonnement ?", a: "Oui, vous pouvez annuler votre abonnement à tout moment depuis vos paramètres de compte. L'accès reste actif jusqu'à la fin de la période payée." },
        { q: "Les voix TTS sont-elles réalistes ?", a: "Absolument. Nous utilisons les dernières technologies de synthèse vocale neuronale pour un rendu ultra-humain." }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-blue-600 font-semibold tracking-wide uppercase">Ressources</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        Centre d&apos;aide <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">(FAQ)</span>
                    </h1>
                </div>

                <div className="space-y-6">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-blue-50/50">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{faq.q}</h3>
                            <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all group">
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
