'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function BlogPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-blue-600 font-semibold tracking-wide uppercase">Ressources</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        Blog & <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Astuces</span>
                    </h1>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((post) => (
                        <div key={post} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-blue-50/50 hover:scale-[1.02] transition-all">
                            <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-50"></div>
                            <div className="p-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Comment devenir viral en 2026</h3>
                                <p className="text-gray-600 mb-6 text-sm">Découvrez nos secrets pour exploser votre audience TikTok à l&apos;aide de l&apos;IA.</p>
                                <button className="text-blue-600 font-bold text-sm hover:underline">Lire la suite →</button>
                            </div>
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
