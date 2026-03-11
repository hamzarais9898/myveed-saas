'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-blue-600 font-semibold tracking-wide uppercase">Légal</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        Mentions <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">légales</span>
                    </h1>
                </div>

                <div className="space-y-12">
                    <section className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/50 hover:border-blue-200 transition-all duration-300">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">1. Éditeur du site</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Le site MAVEED est édité par l'entrepreneur Othman MEKOUAR, SAS au capital de 10 000€, immatriculée au RCS de Paris sous le numéro 123 456 789.
                        </p>
                    </section>

                    <section className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-blue-50/50 hover:border-blue-200 transition-all duration-300">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">2. Hébergement</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Le site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #1142 Walnut, CA 91789, États-Unis.
                        </p>
                    </section>
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
