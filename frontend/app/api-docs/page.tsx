'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function APIDocsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-blue-600 font-semibold tracking-wide uppercase">Ressources</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        API <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Documentation</span>
                    </h1>
                </div>

                <div className="bg-gray-900 rounded-3xl p-8 text-white font-mono text-sm overflow-hidden shadow-2xl">
                    <div className="flex gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <p className="text-blue-400"># Authenticate with API Key</p>
                    <p className="mb-4">curl -X POST &quot;https://api.maveed.io/v1/generate&quot; \</p>
                    <p className="pl-4"> -H &quot;Authorization: Bearer YOUR_API_KEY&quot; \</p>
                    <p className="pl-4"> -d &apos;{"{"}&quot;text&quot;: &quot;Hello world&quot;{"}"}&apos;</p>
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
