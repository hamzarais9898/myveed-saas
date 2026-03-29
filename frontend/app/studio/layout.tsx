'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#0a0a0f] text-gray-100 selection:bg-[#e2a9f1]/30 flex flex-col font-sans">
                {/* We override the default navbar styling lightly if needed, or just let it be. 
                    Since Navbar has its own backdrop-blur-xl bg-white/80, it might look too bright in the studio.
                    We will include a customized thin header specifically for the Studio, but for simplicity we can use the default Navbar 
                    and add a dark wrapper below it. 
                */}
                <div className="sticky top-0 z-50 shadow-md">
                     <Navbar />
                </div>
                
                {/* The main studio workspace area - dark themed */}
                <main className="flex-1 w-full bg-[#0a0a0f] overflow-x-hidden relative">
                    {/* Ambient glow effects */}
                    <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-[#e2a9f1]/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#c77ddf]/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute top-[40%] -left-[10%] w-[40%] h-[40%] bg-[#e2a9f1]/10 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
