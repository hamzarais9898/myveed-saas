'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Image as ImageIcon, Upload, X, GripVertical, CheckCircle2, Download, Video, RefreshCw, Layers } from 'lucide-react';
import { generateFusedImage, ImageFusionOrderMapItem } from '@/services/imageFusionService';
import { getImages } from '@/services/imageService';
import { useLanguage } from '@/context/LanguageContext';

interface SelectedImage {
  id: string; // url or unique raw id
  file?: File; // for local files
  url?: string; // for preview
  source: 'gallery' | 'local';
  type?: 'image' | 'influencer';
}

export default function ImageFusionPanel() {
  const { t } = useLanguage();
  const router = useRouter();
  
  // Selection State
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  
  // Form State
  const [prompt, setPrompt] = useState('');
  const [resolution, setResolution] = useState('1024x1024');
  const [style, setStyle] = useState('cinematic');
  const [model, setModel] = useState('gpt-image-1');
  
  // Workflow State
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [fusedResult, setFusedResult] = useState<any>(null);
  
  // Gallery Modal State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Drag and Drop ordering state
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Gallery Logic ---
  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const data = await getImages(30, 0);
      setGalleryImages(data.images || []);
    } catch (e) {
      console.error('Failed to load gallery', e);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
    if (galleryImages.length === 0) loadGallery();
  };

  const selectFromGallery = (img: any) => {
    // Prevent duplicates
    if (selectedImages.some(s => s.id === img._id)) return;
    
    setSelectedImages(prev => [...prev, {
      id: img._id,
      url: img.imageUrl,
      source: 'gallery',
      type: img.type || 'image'
    }]);
    setIsGalleryOpen(false);
  };

  // --- Local Upload Logic ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        id: file.name + '-' + Date.now(),
        file: file,
        url: URL.createObjectURL(file),
        source: 'local' as const,
        type: 'image' as const
      }));
      setSelectedImages(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOverArea = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropArea = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
          id: file.name + '-' + Date.now(),
          file: file,
          url: URL.createObjectURL(file),
          source: 'local' as const,
          type: 'image' as const
        }));
      setSelectedImages(prev => [...prev, ...newFiles]);
    }
  };

  const removeImage = (idToRemove: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  // --- Reordering Logic ---
  const handleDragStartItem = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Swap items visually
    const items = [...selectedImages];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setSelectedImages(items);
    setDraggedItemIndex(index); // Update dragged index to new position
  };

  const handleDragEndItem = () => {
    setDraggedItemIndex(null);
  };

  // --- Generate Logic ---
  const handleGenerate = async () => {
    if (selectedImages.length === 0) {
      setErrorMessage('Tu dois sélectionner au moins une image.');
      return;
    }

    setStatus('processing');
    setErrorMessage('');
    
    try {
      const selectedGalleryIds = selectedImages.filter(img => img.source === 'gallery').map(img => img.id);
      const localImageObjects = selectedImages.filter(img => img.source === 'local');
      const uploadedLocalFiles = localImageObjects.map(img => img.file as File);
      const localFileIds = localImageObjects.map(img => img.id);
      
      const orderMap: ImageFusionOrderMapItem[] = selectedImages.map((img, idx) => ({
        id: img.id, // now strictly using the unique ID for both local and gallery
        source: img.source,
        index: idx
      }));

      const result = await generateFusedImage({
        prompt,
        resolution,
        style,
        model,
        selectedGalleryIds,
        localFileIds,
        orderMap,
        uploadedLocalFiles
      });

      if (result.success && result.fusedImage) {
        setFusedResult(result.fusedImage);
        setStatus('success');
      } else {
        throw new Error(result.message || 'Error generating image');
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || err.message || 'Une erreur est survenue lors de la fusion.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setFusedResult(null);
    setErrorMessage('');
  };

  const handleDownload = () => {
    if (!fusedResult?.imageUrl) return;
    fetch(fusedResult.imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fused-image-${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
  };

  const handleUseInVideo = () => {
    if (!fusedResult?.imageUrl) return;
    
    // Preparation for Image-to-Video transfer
    // We use sessionStorage to pass a complete context for the next page
    sessionStorage.setItem('animateImageUrl', fusedResult.imageUrl);
    sessionStorage.setItem('animateImageId', fusedResult.genericImageId || fusedResult.id);
    sessionStorage.setItem('animatePromptText', fusedResult.promptText || '');
    sessionStorage.setItem('animateSourceType', 'fused-image');
    
    // Redirect to Video Generation page in Image-to-Video mode
    router.push('/generate?mode=image-to-video');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center">
          <Layers className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Fusion d'Images</h1>
          <p className="text-gray-500 text-sm mt-1">Combine plusieurs images en une seule création grâce à l'IA.</p>
        </div>
      </div>

      {status === 'success' && fusedResult ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Fusion Réussie !</h2>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100 mb-8 max-w-2xl w-full">
              <img src={fusedResult.imageUrl} alt="Result" className="w-full h-auto object-cover" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 w-full">
              <button onClick={handleDownload} className="flex-1 max-w-[200px] h-12 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:border-gray-300 transition-all">
                <Download className="w-5 h-5" /> Télécharger
              </button>
              <button 
                onClick={handleUseInVideo}
                className="flex-1 max-w-[200px] h-12 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
              >
                <Video className="w-5 h-5" /> Utiliser en Vidéo
              </button>
              <button onClick={handleReset} className="flex-1 max-w-[200px] h-12 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                <RefreshCw className="w-5 h-5" /> Nouvelle Fusion
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Image Selection */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">1. Sources d'images</h3>
              
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleOpenGallery}
                  className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all bg-gray-50/50"
                >
                  <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm font-bold text-gray-700">Depuis la Galerie</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all bg-gray-50/50"
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <span className="text-sm font-bold text-gray-700">Fichiers Locaux</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </button>
              </div>

              {/* Selected Images List */}
              <div 
                className="space-y-3 min-h-[150px]"
                onDragOver={handleDragOverArea}
                onDrop={handleDropArea}
              >
                {selectedImages.length === 0 ? (
                  <div className="h-[150px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 text-gray-400 text-sm font-medium">
                    Glissez vos fichiers ici ou sélectionnez-les ci-dessus
                  </div>
                ) : (
                  selectedImages.map((img, index) => (
                    <div
                      key={img.id}
                      draggable
                      onDragStart={() => handleDragStartItem(index)}
                      onDragOver={(e) => handleDragOverItem(e, index)}
                      onDragEnd={handleDragEndItem}
                      className={`flex items-center gap-4 p-3 bg-white border rounded-xl cursor-grab active:cursor-grabbing transition-all ${draggedItemIndex === index ? 'opacity-50 border-purple-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="text-gray-400 hover:text-gray-600 pl-1">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-bold uppercase">
                          {img.source}
                        </div>
                        {img.type === 'influencer' ? (
                          <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md pb-0.5" title="Influenceur">
                            <span className="text-[10px] leading-none">👤</span>
                          </div>
                        ) : (
                          <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center shadow-md pb-0.5" title="Image">
                            <span className="text-[10px] leading-none">🖼️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          Image {index + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          {index === 0 ? 'Sujet principal' : index === 1 ? 'Référence produit' : 'Style / Environnement'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Prompt */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">2. Options de Fusion</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Prompt optionnel (Guidance)</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ajoutez des instructions optionnelles. Sinon, la fusion utilisera automatiquement un prompt professionnel optimisé."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none min-h-[120px]"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    L'IA recevra un prompt professionnel de base garantissant un rendu propre et stable pour la vidéo. Remplissez ce champ uniquement si vous avez des instructions spécifiques à ajouter.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Résolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-gray-700"
                    >
                      <option value="1024x1024">Carré (1024x1024)</option>
                      <option value="1024x1536">Portrait (1024x1536)</option>
                      <option value="1536x1024">Paysage (1536x1024)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Style</label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-gray-700"
                    >
                      <option value="cinematic">Cinématique</option>
                      <option value="realistic">Réaliste (Photo)</option>
                      <option value="illustration">Illustration</option>
                    </select>
                  </div>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={status === 'processing' || selectedImages.length === 0}
                  className="w-full h-14 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-800 disabled:opacity-50 transition-all shadow-lg shadow-gray-900/20 mt-4"
                >
                  {status === 'processing' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Fusion en cours...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Lancer la Fusion (2 Crédits)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Choisir dans la galerie</h2>
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingGallery ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                  <p className="text-gray-500 font-medium">Chargement de vos images...</p>
                </div>
              ) : galleryImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {galleryImages.map(img => (
                    <button
                      key={img._id}
                      onClick={() => selectFromGallery(img)}
                      className="group relative aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-purple-500 hover:ring-2 hover:ring-purple-100 transition-all"
                    >
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      
                      {img.type === 'influencer' ? (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <span>👤</span> Influencer
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                          <span>🖼️</span> Image
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-3 py-1 bg-purple-600 rounded-full">Sélectionner</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-500">
                  Aucune image trouvée dans votre galerie.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const Wand2 = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>
);
