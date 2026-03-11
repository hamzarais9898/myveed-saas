'use client';

import { useState } from 'react';

export type VideoStyle = 'cinematic' | 'cartoon' | 'anime' | '3d' | 'realistic';

interface StyleSelectorProps {
    selectedStyle: VideoStyle;
    onSelect: (style: VideoStyle) => void;
}

export default function StyleSelector({ selectedStyle, onSelect }: StyleSelectorProps) {
    const styles: { id: VideoStyle; label: string; icon: string; desc: string }[] = [
        { id: 'cinematic', label: 'Film / Cinématique', icon: '🎬', desc: 'Rendu réaliste et dramatique' },
        { id: 'cartoon', label: 'Dessin Animé', icon: '🎨', desc: 'Style coloré et ludique' },
        { id: 'anime', label: 'Manga / Anime', icon: '👘', desc: 'Style animation japonaise' },
        { id: '3d', label: 'Rendu 3D', icon: '🧊', desc: 'Style Pixar/Disney moderne' },
        { id: 'realistic', label: 'Ultra Réaliste', icon: '📸', desc: 'Comme une vraie vidéo' },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                    3. Style Visuel
                </label>
                <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                    Veo 3 Enhanced
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        type="button"
                        onClick={() => onSelect(style.id)}
                        className={`relative p-3 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col gap-2 hover:scale-[1.02] ${selectedStyle === style.id
                                ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200 shadow-md'
                                : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'
                            }`}
                    >
                        <span className="text-2xl">{style.icon}</span>
                        <div>
                            <div className={`font-bold text-sm ${selectedStyle === style.id ? 'text-pink-900' : 'text-gray-900'}`}>
                                {style.label}
                            </div>
                            <div className="text-[10px] text-gray-500 leading-tight mt-1">
                                {style.desc}
                            </div>
                        </div>

                        {selectedStyle === style.id && (
                            <div className="absolute top-2 right-2 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
