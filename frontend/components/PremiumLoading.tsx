'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface PremiumLoadingProps {
    stage?: string;
    subtext?: string;
}

export default function PremiumLoading({ stage, subtext }: PremiumLoadingProps) {
    return (
        <div className="absolute inset-0 bg-white z-40 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
            {/* Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[300px] h-[300px] bg-[#e2a9f1]/10 rounded-full blur-[80px] -top-20 -left-20 animate-pulse"></div>
                <div className="absolute w-[300px] h-[300px] bg-blue-400/5 rounded-full blur-[80px] bottom-0 right-0 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo Container with Refined Pulse & Rotating Rings */}
                <div className="relative">
                    {/* Rotating Rings */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-10 border-2 border-dashed border-[#e2a9f1]/30 rounded-full"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-14 border border-dashed border-blue-400/20 rounded-full"
                    />

                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute -inset-8 bg-gradient-to-r from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-full blur-2xl"
                    />

                    <motion.div
                        animate={{
                            y: [0, -10, 0],
                            rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl shadow-[#e2a9f1]/10 border border-gray-50 flex items-center justify-center p-6"
                    >
                        <Image
                            src="/images/logoremakeit.png"
                            alt="Loading"
                            width={80}
                            height={80}
                            className="object-contain"
                            priority
                        />
                    </motion.div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <motion.h4
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-gray-900 font-black text-2xl tracking-tighter uppercase"
                        >
                            {stage || "Génération en cours"}
                        </motion.h4>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-[#c77ddf] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse"
                        >
                            {subtext || "Veo3 AI Engine Propulsion"}
                        </motion.p>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="w-48 h-1 bg-gray-50 rounded-full overflow-hidden relative">
                        <motion.div
                            animate={{
                                x: ["-100%", "100%"]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#e2a9f1] to-transparent w-full"
                        />
                    </div>
                </div>

                {/* Interactive Tip */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 px-6 py-3 bg-gray-50/50 backdrop-blur-sm border border-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-[280px]"
                >
                    Notre IA optimise chaque pixel pour un résultat cinéma 4K.
                </motion.div>
            </div>
        </div>
    );
}
