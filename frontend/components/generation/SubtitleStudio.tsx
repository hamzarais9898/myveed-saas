'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type SubtitleStyle = 'bold' | 'karaoke' | 'clean' | 'box' | 'neon' | 'hormozi';
export type SubtitlePosition = 'top' | 'center' | 'bottom' | 'custom';

interface SubtitleStudioProps {
    style: SubtitleStyle;
    position: SubtitlePosition;
    onStyleChange: (style: SubtitleStyle) => void;
    onPositionChange: (pos: SubtitlePosition) => void;
    fontSize: number;
    onFontSizeChange: (size: number) => void;
    previewMediaUrl?: string | null;
    previewText?: string;
}

export default function SubtitleStudio({ style, position, onStyleChange, onPositionChange, fontSize, onFontSizeChange, previewMediaUrl, previewText }: SubtitleStudioProps) {
    const previewRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [customPos, setCustomPos] = useState({ x: 50, y: 50 }); // Percentage 0-100
    const [showViralStyles, setShowViralStyles] = useState(false);

    // Preset positions map to specific percentages
    useEffect(() => {
        if (position === 'top') setCustomPos({ x: 50, y: 20 });
        if (position === 'center') setCustomPos({ x: 50, y: 50 });
        if (position === 'bottom') setCustomPos({ x: 50, y: 80 });
    }, [position]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !previewRef.current) return;

        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp values
        const clampedX = Math.max(0, Math.min(100, x));
        const clampedY = Math.max(0, Math.min(100, y));

        setCustomPos({ x: clampedX, y: clampedY });
        if (position !== 'custom') onPositionChange('custom');
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Global mouse up to catch drops outside the container
    useEffect(() => {
        const handleGlobalMouseUp = () => setIsDragging(false);
        if (isDragging) {
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, [isDragging]);


    const styles: { id: SubtitleStyle; name: string; preview: React.ReactNode }[] = [
        {
            id: 'hormozi',
            name: 'Hormozi',
            preview: <span className="text-yellow-400 font-black uppercase drop-shadow-[0_4px_0_rgba(0,0,0,1)] text-stroke-2 text-stroke-black">VIRAL</span>
        },
        {
            id: 'neon',
            name: 'Neon',
            preview: <span className="text-white font-bold drop-shadow-[0_0_10px_#cc00ff] uppercase">Glow</span>
        },
        {
            id: 'bold',
            name: 'Bold',
            preview: <span className="text-white font-black uppercase bg-red-600 px-2 rotate-2">POP!</span>
        },
        {
            id: 'karaoke',
            name: 'Karaoke',
            preview: <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400 font-black uppercase">SING</span>
        },
        {
            id: 'box',
            name: 'Boxed',
            preview: <span className="bg-black/90 text-white px-2 py-1 font-bold">FOCUS</span>
        },
        {
            id: 'clean',
            name: 'Clean',
            preview: <span className="text-white font-medium drop-shadow-md">Simple</span>
        }
    ];

    // CSS classes for preview styling
    const styleClasses = {
        hormozi: "font-black uppercase text-yellow-300 drop-shadow-[0_4px_0_rgba(0,0,0,1)] [text-shadow:-2px_-2px_0_#000,2px_-2px_0_#000,-2px_2px_0_#000,2px_2px_0_#000] rotate-1",
        neon: "font-black uppercase text-white drop-shadow-[0_0_10px_#cc00ff] [text-shadow:0_0_20px_#cc00ff]",
        bold: "font-black uppercase text-white bg-red-600 px-3 py-1 rotate-[-2deg] shadow-xl border-4 border-white inline-block",
        karaoke: "font-black uppercase text-white drop-shadow-md tracking-tighter",
        clean: "font-medium text-white drop-shadow-md tracking-wide bg-black/40 px-2 py-1 rounded inline-block",
        box: "font-bold text-white bg-black/80 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20 shadow-2xl inline-block"
    };

    // Animated Text Setup
    const defaultText = "Ceci est un exemple très captivant 🚀";
    const displayText = previewText && previewText.trim() ? previewText : defaultText;
    const words = displayText.split(' ').slice(0, 15); // Show first 15 words max so it fits

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.3, repeat: Infinity, repeatDelay: 2 }
        }
    };

    const wordVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.8 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, damping: 12, stiffness: 200 }
        }
    };

    // Special animation override for Karaoke
    const karaokeWordVariants = {
        hidden: { color: "#ffffff", opacity: 0.5 },
        visible: {
            color: ["#ffffff", "#4ade80", "#eab308", "#ffffff"],
            opacity: 1,
            scale: [1, 1.2, 1],
            transition: { duration: 0.8, times: [0, 0.2, 0.8, 1] }
        }
    };

    return (
        <div className="grid grid-cols-1 gap-8">
            {/* Controls */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Style Viral
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                            {styles.length} Styles Pros
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowViralStyles(!showViralStyles)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${showViralStyles ? 'bg-purple-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${showViralStyles ? 'left-7' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                {showViralStyles && (
                    <div className="grid grid-cols-3 gap-3">
                        {styles.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => onStyleChange(s.id)}
                                className={`h-20 p-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden ${style === s.id
                                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200 scale-105 shadow-md'
                                    : 'border-gray-100 bg-white hover:border-gray-300 hover:scale-105'
                                    }`}
                            >
                                <div className="scale-75 origin-center">{s.preview}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Phone Preview */}
            <div className="relative mx-auto group">
                {/* Drag Hint */}
                <div className="hidden absolute -top-8 left-0 right-0 text-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                    <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        👆 Glissez le texte pour le placer
                    </span>
                </div>

                <div
                    ref={previewRef}
                    onMouseMove={handleMouseMove}
                    className="relative w-[280px] h-[560px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden ring-4 ring-gray-100 cursor-crosshair select-none"
                >
                    {/* Media Background */}
                    <div className="absolute top-0 w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 opacity-50 z-0"></div>
                    {previewMediaUrl ? (
                        <img src={previewMediaUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-black bg-cover opacity-80"></div>
                    )}

                    {/* Status Bar */}
                    <div className="absolute top-4 w-full px-6 flex justify-between text-white text-[10px] font-bold z-20 pointer-events-none drop-shadow-md">
                        <span>9:41</span>
                        <div className="flex gap-1"><span>📶</span><span>🔋</span></div>
                    </div>

                    {/* TikTok UI Elements */}
                    <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center z-20 pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/30"></div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur border border-white/30"></div>
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur border border-white/30"></div>
                    </div>

                    {/* Subtitle Draggable Element */}
                    <div
                        onMouseDown={handleMouseDown}
                        className={`absolute z-30 transform -translate-x-1/2 -translate-y-1/2 cursor-grab transition-transform ${isDragging ? 'scale-105 cursor-grabbing' : ''}`}
                        style={{
                            left: `${customPos.x}%`,
                            top: `${customPos.y}%`,
                            touchAction: 'none',
                            width: '90%'
                        }}
                    >
                        <motion.div
                            className={`flex flex-wrap justify-center gap-x-[0.3em] gap-y-[0.1em] text-center ${styleClasses[style]}`}
                            style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            key={displayText + style} // Re-trigger animation on text/style change
                        >
                            {words.map((word, i) => (
                                <motion.span
                                    key={i}
                                    variants={style === 'karaoke' ? karaokeWordVariants : wordVariants}
                                    className={style === 'karaoke' ? 'inline-block' : 'inline-block'}
                                >
                                    {word}
                                </motion.span>
                            ))}
                            {displayText.split(' ').length > 15 && <span className="opacity-50">...</span>}
                        </motion.div>

                        {/* Drag Handle Indicator */}
                        <div className="absolute -inset-4 border-2 border-dashed border-white/60 rounded-xl opacity-0 hover:opacity-100 transition-opacity pointer-events-none bg-white/5"></div>
                    </div>
                </div>
            </div>

            {/* Position Presets */}
            <div className="flex justify-center gap-2">
                {[
                    { id: 'top', label: 'Haut', icon: '⬆️' },
                    { id: 'center', label: 'Milieu', icon: '↔️' },
                    { id: 'bottom', label: 'Bas', icon: '⬇️' }
                ].map((p) => (
                    <button
                        key={p.id}
                        onClick={() => onPositionChange(p.id as SubtitlePosition)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${position === p.id
                            ? 'bg-gray-900 text-white shadow-lg scale-105'
                            : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
                    >
                        <span>{p.icon}</span>
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Font Size Control */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Taille du texte
                    </label>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm">{fontSize}px</span>
                </div>
                <input
                    type="range"
                    min="16"
                    max="64"
                    value={fontSize}
                    onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
            </div>
        </div>
    );
}
