'use client';

import React, { useState, useEffect } from 'react';
import { generateImage, getImages, getAvailableStyles, deleteImage, generateVideoFromImage } from '@/services/imageService';
import { ArrowRight, Trash2, Film, Loader, Sparkles, Image as ImageIcon, Zap, Wand2, Download } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PremiumLoading from '@/components/PremiumLoading';

type Resolution = '512x512' | '768x768' | '1024x1024' | '1024x1792' | '1792x1024';
type ImageStyle = 'realistic' | 'cinematic' | 'illustration' | 'anime' | 'painting' | 'photorealistic';

export default function ImageGenerator() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState<Resolution>('1024x1024');
  const [style, setStyle] = useState<ImageStyle>('cinematic');
  const [variants, setVariants] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [selectedImageForVideo, setSelectedImageForVideo] = useState<string | null>(null);
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null);

  // Fetch available styles
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const data = await getAvailableStyles();
        setStyles(data);
      } catch (error) {
        console.error('Failed to fetch styles:', error);
      }
    };
    fetchStyles();
  }, []);

  // Fetch images
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getImages(20);
        setImages(data.images || []);
      } catch (error) {
        console.error('Failed to fetch images:', error);
      }
    };
    fetchImages();
  }, []);

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const result = await generateImage(prompt, resolution, style, variants);
      if (result.success) {
        setImages([...result.images, ...images]);
        setPrompt('');
        showToast('Images générées avec succès', 'success');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      showToast('Échec de la génération d\'image', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      showToast('Image supprimée', 'info');
    } catch (error) {
      console.error('Failed to delete image:', error);
      showToast('Échec de la suppression', 'error');
    }
  };

  const handleGenerateVideo = async (imageId: string) => {
    setGeneratingVideoId(imageId);
    try {
      const result = await generateVideoFromImage(imageId, 'short', 'runway'); // Defaulting to short/runway as per context
      if (result.success) {
        showToast('Génération de la vidéo commencée !', 'success');
      }
    } catch (error) {
      console.error('Video generation failed:', error);
      showToast('Échec de la génération de vidéo', 'error');
    } finally {
      setGeneratingVideoId(null);
    }
  };

  const handleDownload = (imageUrl: string, promptText: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `maveed-${promptText.slice(0, 20).replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#e2a9f1]/20 text-gray-900">
      {/* ... keeping Navbar and Header same ... */}
      {/* Skipping to Images Gallery section to save tokens if possible, or I replace the whole return if needed. 
           Actually, the REPLACE tool is best used for the whole component content or large chunk. 
           Reference lines 27-99 for handlers and 260-302 for card content. 
           I will replace the state declaration down to the end of the map loop for safety.
        */}
    </div>
  );
  // WAIT, I need to match exact content. Let's do smaller chunks.


  return (
    <div className="min-h-screen bg-white relative overflow-hidden selection:bg-[#e2a9f1]/20 text-gray-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/10 rounded-full blur-[120px] -top-20 -left-20"></div>
        <div className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] bottom-0 right-0"></div>
      </div>

      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative z-10">
        {/* Header */}
        <div className="relative mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/50 border border-white/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#c77ddf] animate-pulse" />
            <span className="text-sm font-black text-[#c77ddf] tracking-wider uppercase">Artiste IA</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter leading-tight">
            Générateur <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-x">D'Images</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium">
            {t('imageGenerator.subtitle') || "Transformez vos mots en œuvres d'art numériques époustouflantes avec la puissance de Gemini 2."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Generation Panel */}
          <div className="lg:col-span-4">
            <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 border border-white/40 shadow-2xl shadow-[#e2a9f1]/10">
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#c77ddf] text-white flex items-center justify-center">
                  <Wand2 className="w-5 h-5" />
                </div>
                {t('imageGenerator.createTitle') || "Propulser l'IA"}
              </h2>

              <form onSubmit={handleGenerateImage} className="space-y-8">
                {/* Prompt */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Description de l'image
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Un coucher de soleil sur des sommets montagneux..."
                    className="w-full h-32 px-5 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-3xl text-gray-900 font-bold placeholder-gray-300 focus:outline-none focus:border-[#c77ddf] transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Style */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as ImageStyle)}
                      className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-[#c77ddf] transition-all text-sm"
                    >
                      <option value="cinematic">Cinématique</option>
                      <option value="realistic">Réaliste</option>
                      <option value="illustration">Illustration</option>
                      <option value="anime">Anime</option>
                      <option value="painting">Peinture</option>
                      <option value="photorealistic">Photoréaliste</option>
                    </select>
                  </div>

                  {/* Resolution */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Résolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as Resolution)}
                      className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-[#c77ddf] transition-all text-sm"
                    >
                      <option value="1024x1024">Carré</option>
                      <option value="1024x1792">Portrait</option>
                      <option value="1792x1024">Paysage</option>
                    </select>
                  </div>
                </div>

                {/* Variants */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre de variantes</label>
                    <span className="text-xs font-black text-[#c77ddf]">{variants}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={variants}
                    onChange={(e) => setVariants(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-[#c77ddf]"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-[length:200%_auto] hover:bg-right text-white font-black py-6 rounded-[2rem] transition-all duration-700 flex flex-col items-center justify-center gap-1 uppercase tracking-widest text-sm shadow-xl shadow-[#e2a9f1]/20 group active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <span>Générer l'Art</span>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-[10px] opacity-70 font-black tracking-[0.2em]">{variants * 5} CRÉDITS</span>
                </button>
              </form>
            </div>
          </div>

          {/* Images Gallery */}
          <div className="lg:col-span-8">
            <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              Ma Galerie
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {loading && Array.from({ length: variants }).map((_, i) => (
                  <motion.div
                    key={`loading-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative aspect-square rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl"
                  >
                    <PremiumLoading
                      stage="Peinture IA..."
                      subtext="Maveed Vision Engine"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {images.length === 0 && !loading ? (
                <div className="col-span-full bg-white/50 backdrop-blur-sm rounded-[3rem] p-24 text-center border-4 border-dashed border-gray-100 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center text-gray-300">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Votre galerie est vide</p>
                    <p className="text-gray-400 font-medium">Commencez par générer votre premier chef d'oeuvre.</p>
                  </div>
                </div>
              ) : (
                images.map((image) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[3rem] overflow-hidden border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-500 group relative"
                  >
                    {/* Video Generation Loading Overlay */}
                    <AnimatePresence>
                      {generatingVideoId === image.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex items-center justify-center"
                        >
                          <div className="scale-75 origin-center w-full h-full">
                            <PremiumLoading stage="Génération Vidéo..." subtext="Runway Gen-3 Engine" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Image */}
                    <div className="aspect-square overflow-hidden bg-gray-50 relative">
                      <img
                        src={image.imageUrl}
                        alt={image.promptText}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <p className="text-white text-xs font-bold line-clamp-2 italic">"{image.promptText}"</p>
                      </div>
                    </div>

                    {/* Footer / Actions */}
                    <div className="p-6 bg-white border-t border-gray-50 flex items-center justify-between">
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-500">{image.style}</span>
                        <span className="px-3 py-1 bg-[#c77ddf]/10 rounded-full text-[8px] font-black uppercase tracking-widest text-[#c77ddf]">4K Ultra</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(image.imageUrl, image.promptText)}
                          className="w-10 h-10 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all active:scale-90"
                          title="Télécharger"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGenerateVideo(image.id)}
                          disabled={!!generatingVideoId}
                          className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Générer Vidéo"
                        >
                          <Film className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx global>{`
        @keyframes drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(30px, -20px) scale(1.1); }
        }
        .animate-drift {
            animation: drift 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
