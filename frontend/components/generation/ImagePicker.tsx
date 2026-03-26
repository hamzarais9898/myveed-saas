'use client';

import { useState, useEffect } from 'react';
import { getImages, generateImage } from '@/services/imageService';
import { Loader2, Image as ImageIcon, Plus, Check, Search, Wand2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ImagePickerProps {
    onSelect: (image: { id: string; url: string; sourceType?: string; influencerId?: string; influencerName?: string }) => void;
    selectedImageId?: string | null;
}

export default function ImagePicker({ onSelect, selectedImageId }: ImagePickerProps) {
    const { t } = useLanguage();
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'gallery' | 'generate'>('gallery');

    // Gen State
    const [genPrompt, setGenPrompt] = useState('');
    const [genStyle, setGenStyle] = useState('cinematic');

    const fetchImages = async () => {
        setLoading(true);
        try {
            const data = await getImages(20, 0);
            setImages(data.images || []);
        } catch (err) {
            console.error('Failed to fetch images:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'gallery') {
            fetchImages();
        }
    }, [activeTab]);

    const handleGenerate = async () => {
        if (!genPrompt.trim() || generating) return;
        setGenerating(true);
        try {
            const response = await generateImage(
                genPrompt,
                '1024x1024',
                genStyle as any,
                1,
                'banana'
            );

            const newImage = response.images?.[0] || response.image;
            if (newImage) {
                const imgObj = { 
                    id: newImage._id || newImage.id, 
                    url: newImage.imageUrl || newImage.url,
                    sourceType: 'standard'
                };
                onSelect(imgObj);
                setActiveTab('gallery');
                setGenPrompt('');
            }
        } catch (err) {
            console.error('Generation failed:', err);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                    type="button"
                    onClick={() => setActiveTab('gallery')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'gallery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <ImageIcon className="w-4 h-4" />
                    Ma Galerie
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('generate')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Wand2 className="w-4 h-4" />
                    Générer
                </button>
            </div>

            {activeTab === 'gallery' ? (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4" />
                            <p className="text-sm font-medium">Chargement de la galerie...</p>
                        </div>
                    ) : images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {images.map((img) => (
                                <button
                                    key={img._id}
                                    type="button"
                                    onClick={() => onSelect({ 
                                        id: img._id, 
                                        url: img.imageUrl, 
                                        sourceType: img.sourceType, 
                                        influencerId: img.influencerId,
                                        influencerName: img.influencer?.name
                                    })}
                                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImageId === img._id ? 'border-purple-600 ring-2 ring-purple-100' : 'border-transparent hover:border-gray-200'}`}
                                >
                                    <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                                    {selectedImageId === img._id && (
                                        <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                                            <div className="bg-purple-600 text-white p-1 rounded-full shadow-lg">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 font-medium">Aucune image trouvée</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prompt de l'image</label>
                        <textarea
                            value={genPrompt}
                            onChange={(e) => setGenPrompt(e.target.value)}
                            placeholder="Décris l'image à générer..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none h-24"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style</label>
                            <select
                                value={genStyle}
                                onChange={(e) => setGenStyle(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                            >
                                <option value="cinematic">Cinématique</option>
                                <option value="realistic">Réaliste</option>
                                <option value="anime">Anime</option>
                                <option value="painting">Peinture</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={generating || !genPrompt.trim()}
                                className="w-full h-[40px] bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Générer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
