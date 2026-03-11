'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center px-6 py-24 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-100/50 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>

                <div className="text-center max-w-3xl mx-auto z-10">
                    <div className="inline-flex items-center justify-center p-4 mb-8 bg-red-50 rounded-3xl border border-red-100 shadow-sm animate-bounce-slow">
                        <span className="text-4xl">🛸</span>
                    </div>

                    <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 tracking-tighter">
                        404
                    </h1>

                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-outfit">
                        Page Introuvable
                    </h2>

                    <p className="text-xl text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
                        Oups ! Il semblerait que vous vous soyez perdu dans l&apos;hyperespace. Cette page n&apos;existe pas ou a été déplacée.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] hover:from-[#d58ce6] hover:to-[#b76dd3] text-white text-xl font-bold rounded-2xl transition-all shadow-xl shadow-purple-200 hover:-translate-y-1 group"
                    >
                        <span>Retour à l&apos;accueil</span>
                        <svg className="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
