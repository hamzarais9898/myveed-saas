'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface VideoTrimmerProps {
    duration: number; // in seconds
    start: number; // in seconds
    end: number; // in seconds
    onChange: (start: number, end: number) => void;
}

export default function VideoTrimmer({ duration, start, end, onChange }: VideoTrimmerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

    const getPercentage = (value: number) => (value / duration) * 100;

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const newValue = Math.round((x / rect.width) * duration);

        if (isDragging === 'start') {
            if (newValue < end) {
                onChange(newValue, end);
            }
        } else {
            if (newValue > start) {
                onChange(start, newValue);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(null);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>{formatTime(start)}</span>
                <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{formatTime(end - start)} selected</span>
                <span>{formatTime(end)}</span>
            </div>

            <div
                ref={containerRef}
                className="relative h-12 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200"
            >
                {/* Visual Track (could be a thumbnail strip in the future) */}
                <div className="absolute inset-0 flex items-center justify-between px-1 opacity-20 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-gray-400 rounded-full" />
                    ))}
                </div>

                {/* Selected Range Overlay */}
                <div
                    className="absolute h-full bg-[#e2a9f1]/20 border-x-2 border-[#c77ddf] z-10"
                    style={{
                        left: `${getPercentage(start)}%`,
                        width: `${getPercentage(end - start)}%`
                    }}
                >
                    {/* Handles */}
                    <div
                        onMouseDown={() => setIsDragging('start')}
                        className="absolute left-0 top-0 bottom-0 w-4 -ml-2 cursor-ew-resize flex items-center justify-center group z-20"
                    >
                        <div className="w-1.5 h-8 bg-[#c77ddf] rounded-full group-hover:scale-y-110 transition-transform shadow-lg shadow-[#c77ddf]/40" />
                    </div>
                    <div
                        onMouseDown={() => setIsDragging('end')}
                        className="absolute right-0 top-0 bottom-0 w-4 -mr-2 cursor-ew-resize flex items-center justify-center group z-20"
                    >
                        <div className="w-1.5 h-8 bg-[#c77ddf] rounded-full group-hover:scale-y-110 transition-transform shadow-lg shadow-[#c77ddf]/40" />
                    </div>
                </div>

                {/* Progress Indicators */}
                <div className="absolute inset-y-0 left-0 bg-gray-900/5 transition-all" style={{ width: `${getPercentage(start)}%` }} />
                <div className="absolute inset-y-0 right-0 bg-gray-900/5 transition-all" style={{ width: `${100 - getPercentage(end)}%` }} />
            </div>

            <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest">
                Drag handles to trim your video
            </p>
        </div>
    );
}
