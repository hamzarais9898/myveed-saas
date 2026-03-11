'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: ReactNode;
    gradient: string;
    glow: string;
    href: string;
    delay: number;
}

export default function FeatureCard({ title, description, icon, gradient, glow, href, delay }: FeatureCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [displayedTitle, setDisplayedTitle] = useState(title);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isHovered) {
            // Reset to empty to start typing
            setDisplayedTitle('');
            let currentIndex = 0;

            const typeChar = () => {
                if (currentIndex < title.length) {
                    setDisplayedTitle(title.substring(0, currentIndex + 1));
                    currentIndex++;
                    // Random typing speed for realism
                    timeout = setTimeout(typeChar, 30 + Math.random() * 50);
                }
            };

            timeout = setTimeout(typeChar, 100); // Small initial delay
        } else {
            // When not hovered, show full title immediately
            setDisplayedTitle(title);
        }

        return () => clearTimeout(timeout);
    }, [isHovered, title]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
        >
            <Link
                href={href}
                className="group relative h-full block"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="relative h-full p-10 bg-white/70 backdrop-blur-xl border border-gray-100 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                    {/* Top Gradient Bar */}
                    <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    {/* Icon with Glowing Background */}
                    <div className="relative mb-8">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-2xl ${glow} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            {icon}
                        </div>
                        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-br ${gradient} blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                    </div>

                    <h3 className="text-2xl font-black mb-4 text-gray-900 min-h-[2em]">
                        {displayedTitle}
                        {isHovered && displayedTitle.length < title.length && (
                            <span className="inline-block w-[3px] h-[1em] bg-[#c77ddf] ml-1 animate-pulse align-middle"></span>
                        )}
                    </h3>

                    <p className="text-gray-500 leading-relaxed font-medium text-lg">
                        {description}
                    </p>

                    {/* Decorative Background Icon */}
                    <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                        <div className="w-32 h-32 transform rotate-12">
                            {icon}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
