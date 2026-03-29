'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Film, Clapperboard, Sparkles, Wand2, ChevronRight, Settings2, ShieldAlert } from 'lucide-react';
import { MOCK_GENRES, MOCK_TONES, MOCK_FORMATS, MOCK_SEASON } from '@/lib/studio-mock-data';
import { useLanguage } from '@/context/LanguageContext';

export default function StudioSeriesCreation() {
    const router = useRouter();
    const { t } = useLanguage();
    
    // Form state
    const [idea, setIdea] = useState("Dans un Paris cyberpunk de 2084, une détective augmentée enquête sur des meurtres liés à une nouvelle drogue numérique corporelle.");
    const [selectedGenre, setSelectedGenre] = useState('Cyberpunk');
    const [selectedTone, setSelectedTone] = useState('Sombre');
    const [selectedFormat, setSelectedFormat] = useState('9:16');
    const [advancedOpen, setAdvancedOpen] = useState(false);
    
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate API call for generating season outline
        setTimeout(() => {
            router.push(`/studio/season/${MOCK_SEASON.id}`);
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(226,169,241,0.2)]">
                    <Clapperboard className="w-8 h-8 text-[#e2a9f1]" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4 tracking-tight">
                    Créer une nouvelle série
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Concevez votre univers narratif. L'IA de MAVEED va structurer la saison, développer les personnages et générer les épisodes.
                </p>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-8"
            >
                {/* 1. Idée Pivot */}
                <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#e2a9f1]/5 rounded-full blur-3xl group-hover:bg-[#e2a9f1]/10 transition-colors" />
                    
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#e2a9f1]/20 text-[#e2a9f1] text-xs">1</span>
                        Pitch Principal
                        <Sparkles className="w-4 h-4 text-gray-500 ml-auto" />
                    </h2>
                    
                    <textarea 
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="Décrivez votre idée de série en quelques phrases..."
                        className="w-full bg-[#0a0a0f] text-gray-200 border border-gray-800 rounded-2xl p-5 min-h-[140px] focus:outline-none focus:border-[#e2a9f1]/50 focus:ring-1 focus:ring-[#e2a9f1]/50 transition-all text-lg resize-none shadow-inner"
                    />
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                        <span>Plus de détails = meilleurs résultats</span>
                        <span>{idea.length} / 500</span>
                    </div>
                </div>

                {/* 2. Style & Ton */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#e2a9f1]/20 text-[#e2a9f1] text-xs">2</span>
                            Univers / Genre
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {MOCK_GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedGenre === genre 
                                        ? 'bg-[#e2a9f1] text-[#0a0a0f] shadow-[0_0_15px_rgba(226,169,241,0.4)]' 
                                        : 'bg-[#222233] text-gray-400 hover:bg-[#2a2a3e] hover:text-white border border-gray-700'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#e2a9f1]/20 text-[#e2a9f1] text-xs">3</span>
                            Tonalité
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {MOCK_TONES.map(tone => (
                                <button
                                    key={tone}
                                    onClick={() => setSelectedTone(tone)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedTone === tone 
                                        ? 'bg-[#e2a9f1] text-[#0a0a0f] shadow-[0_0_15px_rgba(226,169,241,0.4)]' 
                                        : 'bg-[#222233] text-gray-400 hover:bg-[#2a2a3e] hover:text-white border border-gray-700'
                                    }`}
                                >
                                    {tone}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Format */}
                <div className="bg-[#151521] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#e2a9f1]/20 text-[#e2a9f1] text-xs">4</span>
                        Format Cible
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {MOCK_FORMATS.map(format => (
                            <button
                                key={format.id}
                                onClick={() => setSelectedFormat(format.id)}
                                className={`flex items-center gap-4 p-5 rounded-2xl transition-all border-2 ${
                                    selectedFormat === format.id
                                    ? 'border-[#e2a9f1] bg-[#e2a9f1]/10'
                                    : 'border-transparent bg-[#0a0a0f] hover:bg-[#222233]'
                                }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    selectedFormat === format.id ? 'bg-[#e2a9f1] text-[#0a0a0f]' : 'bg-[#2a2a3e] text-gray-400'
                                }`}>
                                    <Film className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-bold">{format.id}</h3>
                                    <p className="text-gray-400 text-sm">{format.label}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Advanced Settings Toggle */}
                <div className="bg-[#151521] border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
                    <button 
                        onClick={() => setAdvancedOpen(!advancedOpen)}
                        className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-[#1a1a27] transition-colors"
                    >
                        <div className="flex items-center gap-3 text-gray-300 font-medium">
                            <Settings2 className="w-5 h-5 text-gray-500" />
                            Paramètres Avancés (Optionnel)
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${advancedOpen ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {advancedOpen && (
                        <div className="p-6 sm:p-8 pt-0 border-t border-gray-800/50">
                            <div className="grid sm:grid-cols-2 gap-8 mt-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Nombre d'épisodes (Saison 1)</label>
                                    <input type="range" min="3" max="10" defaultValue="5" className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#e2a9f1]" />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>3 éps</span>
                                        <span className="text-[#e2a9f1] font-bold">5 éps</span>
                                        <span>10 éps</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Intensité de l'Action</label>
                                    <input type="range" min="1" max="10" defaultValue="7" className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#e2a9f1]" />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>Dialogues</span>
                                        <span>Équilibré</span>
                                        <span>Action pure</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit Block */}
                <div className="pt-8 flex flex-col items-center">
                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating || !idea.trim()}
                        className="group relative flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-black font-black text-lg rounded-2xl shadow-[0_10px_40px_-10px_rgba(226,169,241,0.6)] hover:shadow-[0_10px_50px_-5px_rgba(226,169,241,0.8)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto justify-center"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin" />
                                <span>Génération de la saison...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-6 h-6" />
                                <span>Générer ma série</span>
                            </>
                        )}
                        
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl pointer-events-none" />
                    </button>
                    
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 font-medium">
                        <ShieldAlert className="w-4 h-4" />
                        Environ 4 crédits seront utilisés pour créer la structure.
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
