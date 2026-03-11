'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
}

// ─── Base shimmer layer ────────────────────────────────────────────────────────
// Uses a CSS keyframe animation via a Tailwind arbitrary class or an inline style.
// The shimmer gradient sweeps left-to-right, just like YouTube.
function ShimmerBase({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-gray-100 ${className}`}
            aria-hidden="true"
        >
            {/* Travelling shimmer */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
    );
}

// ─── Public exports ────────────────────────────────────────────────────────────

export default function Skeleton({ className = '' }: SkeletonProps) {
    return <ShimmerBase className={`rounded-lg ${className}`} />;
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
    return <ShimmerBase className={`rounded-full ${className}`} />;
}

export function SkeletonText({ className = '', lines = 1 }: SkeletonProps & { lines?: number }) {
    return (
        <div className="space-y-2.5 w-full">
            {[...Array(lines)].map((_, i) => (
                <ShimmerBase
                    key={i}
                    className={`h-4 rounded-full ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'} ${className}`}
                />
            ))}
        </div>
    );
}

// ─── VideoCard / PhotoCard skeleton — matches the real card layout ─────────────
export function VideoCardSkeleton() {
    return (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {/* Thumbnail */}
            <ShimmerBase className="aspect-square w-full rounded-none" />

            {/* Info section (mirrors the dark strip on the real card) */}
            <div className="p-3 space-y-3 bg-gray-50">
                {/* Resolution badge + date */}
                <div className="flex justify-between items-center">
                    <ShimmerBase className="h-5 w-16 rounded-full" />
                    <ShimmerBase className="h-4 w-20 rounded-full" />
                </div>

                {/* Prompt text */}
                <SkeletonText lines={2} />

                {/* Action buttons row */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <ShimmerBase className="h-9 rounded-xl" />
                    <ShimmerBase className="h-9 rounded-xl" />
                    <ShimmerBase className="h-9 rounded-xl" />
                </div>
            </div>
        </div>
    );
}
