'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Footer from '@/components/Footer';
import { getCurrentSubscription } from '@/services/subscriptionService';
import { getVoices, getVibes, generateTts } from '@/services/ttsService';

export default function TTSPage() {
    const [text, setText] = useState('');
    const [voices, setVoices] = useState<any[]>([]);
    const [vibes, setVibes] = useState<any[]>([]);
    const [selectedVoice, setSelectedVoice] = useState('');
    const [selectedVibe, setSelectedVibe] = useState('default');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [subData, voicesData, vibesData] = await Promise.all([
                    getCurrentSubscription(),
                    getVoices(),
                    getVibes(),
                ]);
                setSubscription(subData.subscription);
                setVoices(voicesData.voices);
                setVibes(vibesData.vibes);
                if (voicesData.voices && voicesData.voices.length > 0) {
                    setSelectedVoice(voicesData.voices[0].id);
                }
            } catch (err) {
                console.error('Failed to load TTS data:', err);
                setError('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleGenerate = async () => {
        if (!text.trim()) return;
        setError('');
        setGenerating(true);
        setGeneratedAudio(null);

        try {
            const response = await generateTts(
                text,
                selectedVoice,
                selectedVibe
            );
            setGeneratedAudio(response.audioUrl);

            const subData = await getCurrentSubscription();
            setSubscription(subData.subscription);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white">
                <Navbar />

                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="mb-12 text-center">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100/50 rounded-full px-4 py-1.5 mb-6">
                            <span className="w-2 h-2 bg-[#e2a9f1] rounded-full animate-pulse"></span>
                            <span className="text-sm text-gray-600 font-bold tracking-wide uppercase">Voice Lab</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                            MAVEED <span className="bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">TTS</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Transformez vos textes en voix humaines ultra-réalistes grâce à notre catalogue de voix premium.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {subscription && (
                            <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm flex items-center space-x-6">
                                <div className="p-4 bg-blue-50 rounded-2xl flex-shrink-0">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Crédits TTS restants</div>
                                    <div className="text-4xl font-black text-gray-900">
                                        {subscription.plan === 'professional' ? '∞' : subscription.remainingTtsCredits}
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-full border border-blue-100 whitespace-nowrap">
                                        1 crédit par audio
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="p-8 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-3xl shadow-lg shadow-[#e2a9f1]/20 flex items-center justify-between group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-16 translate-x-16"></div>
                            <div className="relative z-10">
                                <div className="text-white/80 font-bold text-sm uppercase tracking-widest mb-1">Qualité Studio</div>
                                <div className="text-2xl font-black text-white">Technologie Neuro-IA ✨</div>
                            </div>
                            <div className="relative z-10 text-4xl group-hover:scale-110 transition-transform">🎭</div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">
                                    Texte à transformer
                                </label>
                                <textarea
                                    className="w-full h-64 px-8 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-gray-900 text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none leading-relaxed"
                                    placeholder="Écrivez le texte que vous souhaitez transformer en voix..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    maxLength={3000}
                                />
                                <div className="mt-4 flex justify-between items-center text-sm font-bold text-gray-400">
                                    <span>{text.length} / 3000 caractères</span>
                                    {text.length > 2500 && <span className="text-orange-500">Limite proche</span>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">
                                        Sélectionner une voix
                                    </label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        value={selectedVoice}
                                        onChange={(e) => setSelectedVoice(e.target.value)}
                                    >
                                        {voices.map((voice: any) => (
                                            <option key={voice.id} value={voice.id}>{voice.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-6">
                                        Style émotionnel (Vibe)
                                    </label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        value={selectedVibe}
                                        onChange={(e) => setSelectedVibe(e.target.value)}
                                    >
                                        {vibes.map((vibe: any) => (
                                            <option key={vibe.id} value={vibe.id}>{vibe.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xl font-black rounded-[2rem] transition-all disabled:opacity-50 shadow-xl shadow-blue-100 hover:-translate-y-1 active:scale-[0.98]"
                                onClick={handleGenerate}
                                disabled={generating || !text}
                            >
                                {generating ? (
                                    <div className="flex items-center justify-center space-x-3">
                                        <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Génération de l&apos;audio...</span>
                                    </div>
                                ) : (
                                    '🎙️ GÉNÉRER L\'AUDIO (1 crédit)'
                                )}
                            </button>

                            {error && (
                                <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold text-center">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-4 space-y-8">
                            {generatedAudio && (
                                <div className="p-8 bg-green-50/50 border border-green-200 rounded-[2.5rem] shadow-sm animate-fadeIn">
                                    <div className="flex items-center space-x-3 mb-6">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">✓</div>
                                        <h3 className="text-2xl font-black text-gray-900">Audio Prêt</h3>
                                    </div>
                                    <div className="bg-white p-4 rounded-3xl shadow-inner mb-6">
                                        <audio controls className="w-full h-12" src={generatedAudio}>
                                            Votre navigateur ne supporte pas l&apos;élément audio.
                                        </audio>
                                    </div>
                                    <a
                                        href={generatedAudio}
                                        download="tts-dawer.mp3"
                                        className="w-full flex items-center justify-center py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all"
                                    >
                                        Télécharger le MP3
                                    </a>
                                </div>
                            )}

                            <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
                                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                                    <span className="text-2xl">⚡</span> Guide Express
                                </h3>
                                <div className="space-y-8">
                                    {[
                                        { step: "1", title: "Saisie", desc: "Copiez votre script" },
                                        { step: "2", title: "Casting", desc: "Choisissez l'émotion" },
                                        { step: "3", title: "Génération", desc: "Audio HD instantané" }
                                    ].map((s, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="w-10 h-10 bg-gray-50 text-gray-900 rounded-xl flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                                                {s.step}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900">{s.title}</div>
                                                <div className="text-sm text-gray-500 font-medium">{s.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 bg-gradient-to-br from-gray-900 to-black rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-12 translate-x-12"></div>
                                <h3 className="text-xl font-black mb-4 relative z-10 flex items-center gap-2">
                                    ⭐ Pro Tip
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 relative z-10">
                                    Utilisez les &quot;Vibes&quot; pour donner une intention spécifique à vos vidéos : Energetic pour la motivation, Soft pour la narration.
                                </p>
                                <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg inline-block relative z-10 border border-white/10">
                                    #SocialMediaReady
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </ProtectedRoute>
    );
}
