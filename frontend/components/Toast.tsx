'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

const toastStyles = {
    success: {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        border: 'border-emerald-500/20',
        bg: 'bg-emerald-500/10',
        glow: 'shadow-emerald-500/20'
    },
    error: {
        icon: <XCircle className="w-5 h-5 text-rose-400" />,
        border: 'border-rose-500/20',
        bg: 'bg-rose-500/10',
        glow: 'shadow-rose-500/20'
    },
    warning: {
        icon: <AlertCircle className="w-5 h-5 text-amber-400" />,
        border: 'border-amber-500/20',
        bg: 'bg-amber-500/10',
        glow: 'shadow-amber-500/20'
    },
    info: {
        icon: <Info className="w-5 h-5 text-blue-400" />,
        border: 'border-blue-500/20',
        bg: 'bg-blue-500/10',
        glow: 'shadow-blue-500/20'
    }
};

export default function Toast({ id, message, type, onClose }: ToastProps) {
    const style = toastStyles[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [id, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl 
                backdrop-blur-xl border ${style.border} ${style.bg}
                text-white shadow-2xl ${style.glow}
                min-w-[320px] max-w-md pointer-events-auto
            `}
        >
            <div className="flex-shrink-0">
                {style.icon}
            </div>

            <p className="flex-grow text-sm font-bold tracking-tight opacity-90 leading-snug">
                {message}
            </p>

            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
