'use client';

import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { API_URL } from '@/lib/config';

export default function SupportPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch(`${API_URL}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, subject, message })
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setName('');
                setEmail('');
                setSubject('');
                setMessage('');
            } else {
                setError(data.message || 'Une erreur est survenue.');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('Impossible d\'envoyer le message. Veuillez réessayer plus tard.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/20 to-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-16 animate-fadeIn">
                    <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
                        <span className="text-sm text-blue-600 font-semibold tracking-wide uppercase">Ressources</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
                        Support <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">24/7</span>
                    </h1>
                </div>

                <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-blue-100">
                    {success ? (
                        <div className="text-center py-12 animate-fadeIn">
                            <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                            <p className="text-gray-600">Nous reviendrons vers vous dans les plus brefs délais.</p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="mt-8 text-blue-600 font-bold hover:underline"
                            >
                                Envoyer un autre message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center font-medium">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nom</label>
                                    <input
                                        type="text"
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="Votre nom"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                        placeholder="votre@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Sujet</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                    placeholder="Comment pouvons-nous vous aider ?"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Message</label>
                                <textarea
                                    required
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl h-32 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                                    placeholder="Décrivez votre problème..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    'Envoyer'
                                )}
                            </button>
                        </form>
                    )}
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
