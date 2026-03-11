'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import {
    connectInstagram,
    connectTikTok,
    saveInstagramToken,
    saveTikTokToken,
} from '@/services/publishService';
import { getCurrentUser } from '@/services/authService';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');

    const handleSaveInstagramToken = useCallback(async (token: string) => {
        try {
            await saveInstagramToken(token);
            setMessage('Instagram connecté avec succès !');
            setMessageType('success');
            // Update user in localStorage
            const updatedUser = { ...user, hasInstagram: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            // Clean URL
            router.replace('/settings');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Erreur lors de la sauvegarde');
            setMessageType('error');
        }
    }, [user, router]);

    const handleSaveTikTokToken = useCallback(async (token: string) => {
        try {
            await saveTikTokToken(token);
            setMessage('TikTok connecté avec succès !');
            setMessageType('success');
            // Update user in localStorage
            const updatedUser = { ...user, hasTikTok: true };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            // Clean URL
            router.replace('/settings');
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Erreur lors de la sauvegarde');
            setMessageType('error');
        }
    }, [user, router]);

    useEffect(() => {
        setUser(getCurrentUser());

        // Handle OAuth callbacks
        const instagramToken = searchParams.get('token');
        const instagramConnected = searchParams.get('instagram');
        const tiktokConnected = searchParams.get('tiktok');
        const error = searchParams.get('error');

        if (error) {
            setMessage('Erreur lors de la connexion');
            setMessageType('error');
        } else if (instagramConnected && instagramToken) {
            handleSaveInstagramToken(instagramToken);
        } else if (tiktokConnected && instagramToken) {
            handleSaveTikTokToken(instagramToken);
        }
    }, [searchParams, handleSaveInstagramToken, handleSaveTikTokToken]);

    const handleConnectInstagram = async () => {
        setIsConnecting(true);
        setMessage('');
        try {
            const response = await connectInstagram();
            if (response.authUrl) {
                window.location.href = response.authUrl;
            }
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Erreur lors de la connexion');
            setMessageType('error');
            setIsConnecting(false);
        }
    };

    const handleConnectTikTok = async () => {
        setIsConnecting(true);
        setMessage('');
        try {
            const response = await connectTikTok();
            if (response.authUrl) {
                window.location.href = response.authUrl;
            }
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Erreur lors de la connexion');
            setMessageType('error');
            setIsConnecting(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen">
                <Navbar />

                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">Paramètres</h1>
                        <p className="text-gray-400">Connectez vos comptes de réseaux sociaux</p>
                    </div>

                    {/* Message */}
                    {message && (
                        <div
                            className={`mb-6 p-4 rounded-lg ${messageType === 'success'
                                ? 'bg-green-900/20 border border-green-600 text-green-400'
                                : 'bg-red-900/20 border border-red-600 text-red-400'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    {/* Account Info */}
                    <div className="glass rounded-xl p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Informations du compte</h2>
                        <div className="space-y-2">
                            <p className="text-gray-300">
                                <strong>Email:</strong> {user?.email}
                            </p>
                            <p className="text-gray-300">
                                <strong>ID:</strong> {user?.id}
                            </p>
                        </div>
                    </div>

                    {/* Social Media Connections */}
                    <div className="space-y-6">
                        {/* Instagram */}
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">📷</div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Instagram</h3>
                                        <p className="text-sm text-gray-400">
                                            {user?.hasInstagram ? (
                                                <span className="text-green-400">✓ Connecté</span>
                                            ) : (
                                                'Non connecté'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConnectInstagram}
                                    disabled={isConnecting || user?.hasInstagram}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${user?.hasInstagram
                                        ? 'bg-green-600 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                        }`}
                                >
                                    {user?.hasInstagram ? 'Connecté' : 'Connecter Instagram'}
                                </button>
                            </div>
                        </div>

                        {/* TikTok */}
                        <div className="glass rounded-xl p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl">🎵</div>
                                    <div>
                                        <h3 className="text-xl font-semibold">TikTok</h3>
                                        <p className="text-sm text-gray-400">
                                            {user?.hasTikTok ? (
                                                <span className="text-green-400">✓ Connecté</span>
                                            ) : (
                                                'Non connecté'
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleConnectTikTok}
                                    disabled={isConnecting || user?.hasTikTok}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${user?.hasTikTok
                                        ? 'bg-green-600 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                                        }`}
                                >
                                    {user?.hasTikTok ? 'Connecté' : 'Connecter TikTok'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-8 glass rounded-xl p-6 border-l-4 border-primary-500">
                        <h3 className="font-semibold mb-2">ℹ️ Information</h3>
                        <p className="text-sm text-gray-400">
                            Connectez vos comptes Instagram et TikTok pour publier automatiquement vos vidéos
                            générées. Les connexions sont sécurisées via OAuth et vos identifiants ne sont jamais
                            stockés.
                        </p>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#e2a9f1] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
