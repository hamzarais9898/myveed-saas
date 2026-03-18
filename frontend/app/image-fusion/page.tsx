'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ImageFusionPanel from '@/components/generation/ImageFusionPanel';
import { Sparkles, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ImageFusionPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 md:py-20 relative z-10 w-full">
        {/* Header Section */}
        <div className="max-w-4xl mx-auto px-6 mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white border border-gray-200 shadow-sm rounded-full px-5 py-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span className="text-sm font-bold text-gray-800 tracking-wider uppercase">Nouvelle Expérience IA</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Laboratoire de <span className="text-purple-600">Fusion</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
            Combinez plusieurs images de votre galerie ou de votre ordinateur en une œuvre d'art 
            cohérente unique grâce à l'intelligence artificielle avancée.
          </p>
        </div>

        {/* Fusion Panel Integration */}
        <ImageFusionPanel />

      </main>

      <Footer />
    </div>
  );
}
