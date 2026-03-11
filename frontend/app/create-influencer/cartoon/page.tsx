'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    User, Dna, Save, Wand2, RefreshCw, Sparkles, ScanFace,
    Search, X, Loader2, CheckCircle, ArrowRight, Plus,
    Video, Trash2, Users, Camera, Smile, Eye, Scissors,
    Check, Play, Send, LayoutGrid, Layout, Image as ImageIcon, Target, ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import * as influencerService from '@/services/influencerService';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import PremiumLoading from '@/components/PremiumLoading';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

type Gender = 'man' | 'woman' | 'other';

export default function CartoonCreatorPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useLanguage();

    // Ready Player Me State
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isIframeOpen, setIsIframeOpen] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [age, setAge] = useState(25);
    const [gender, setGender] = useState<Gender>('woman');
    const [bodyType, setBodyType] = useState<'calme' | 'athletic' | 'muscular' | 'heavy'>('athletic');
    const [isSaving, setIsSaving] = useState(false);

    const subdomain = 'demo'; // Or 'my-app' if you have one
    const editorUrl = `https://${subdomain}.readyplayer.me/avatar?frameApi`;

    useEffect(() => {
        const receiveMessage = (event: any) => {
            const url = event.data;

            if (url?.toString().startsWith('https://readyplayer.me/avatar')) {
                // Legacy event handling if needed
                setAvatarUrl(url);
                setIsIframeOpen(false);
            }

            // Proper RPM Event Parsing
            try {
                const json = JSON.parse(event.data);

                if (json.source !== 'readyplayerme') {
                    return;
                }

                if (json.eventName === 'v1.frame.ready') {
                    // Frame ready
                }

                if (json.eventName === 'v1.avatar.exported') {
                    const glbUrl = json.data.url;
                    // Convert GLB to PNG for 2D preview
                    const pngUrl = glbUrl.replace('.glb', '.png');
                    setAvatarUrl(pngUrl);
                    setIsIframeOpen(false);
                }

                if (json.eventName === 'v1.user.set') {
                    // User authorized
                }
            } catch (error) {
                // Ignore non-JSON messages
            }
        };

        window.addEventListener('message', receiveMessage);
        return () => window.removeEventListener('message', receiveMessage);
    }, []);

    const handleSaveInfluencer = async () => {
        if (!avatarUrl) return;
        setIsSaving(true);
        try {
            await influencerService.createInfluencer({
                name: name || 'RPM Avatar',
                gender,
                age,
                avatarUrl: avatarUrl,
                bodyType,
                // Additional metadata
                config: {
                    aesthetic: 'rpm-3d',
                    source: 'ready-player-me'
                } as any
            });
            showToast('Avatar 3D créé avec succès', 'success');
            router.push('/create-influencer');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la création', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-100 flex flex-col justify-between">
                <Navbar />
                <main className="flex-grow pt-32 pb-20 px-4 md:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-50/50 via-white to-white">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                                    STUDIO <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">3D</span>
                                </h1>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ready Player Me Integration</p>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 h-[800px]">
                            {/* Editor Area */}
                            <div className="flex-1 bg-gray-100 rounded-[2rem] overflow-hidden border border-gray-200 relative shadow-inner">
                                {isIframeOpen ? (
                                    <iframe
                                        src={editorUrl}
                                        allow="camera *; microphone *"
                                        className="w-full h-full border-none"
                                        title="Ready Player Me"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center flex-col gap-6 bg-white">
                                        <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-purple-500 shadow-2xl relative">
                                            {avatarUrl && <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />}
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900">Avatar Prêt !</h3>
                                        <button
                                            onClick={() => setIsIframeOpen(true)}
                                            className="px-8 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-all uppercase text-xs tracking-widest"
                                        >
                                            Modifier
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Controls */}
                            <div className="w-full lg:w-[350px] bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl flex flex-col gap-8 h-full">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Identité</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-purple-200 transition-all"
                                        placeholder="Nom de l'avatar..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Genre & Age</label>
                                    <div className="flex gap-2 mb-4">
                                        {['woman', 'man'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setGender(g as any)}
                                                className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${gender === g ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="range"
                                        min="18"
                                        max="80"
                                        value={age}
                                        onChange={(e) => setAge(parseInt(e.target.value))}
                                        className="w-full accent-purple-600"
                                    />
                                    <div className="text-center text-xs font-bold text-gray-500 mt-2">{age} Ans</div>
                                </div>

                                <div className="mt-auto">
                                    <button
                                        onClick={handleSaveInfluencer}
                                        disabled={!avatarUrl || isSaving}
                                        className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black rounded-[2rem] text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sauvegarder'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </ProtectedRoute>
    );
}
