'use client';

import { motion } from 'framer-motion';

export const LayoutGridIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
    </motion.svg>
);

export const YouTubeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="2" y="4" width="20" height="16" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path d="M10 9L15 12L10 15V9Z" fill="currentColor" variants={{ hover: { scale: 1.2, x: 1 } }} />
    </motion.svg>
);

export const ShortsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="7" y="3" width="10" height="18" rx="3" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path d="M10 10L14 12L10 14V10Z" fill="currentColor" variants={{ hover: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 1 } } }} />
    </motion.svg>
);

export const TikTokIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path
            d="M12 2V12C12 14.2091 10.2091 16 8 16C5.79086 16 4 14.2091 4 12C4 9.79086 5.79086 8 8 8V10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12V2H12ZM12 2C12 5 14.5 7.5 17.5 7.5V5.5C15.5 5.5 14 4 14 2H12Z"
            fill="currentColor"
            variants={{
                hover: { filter: ["drop-shadow(-1px 0px 0px #ff0050) drop-shadow(1px 0px 0px #00f2ea)", "none", "drop-shadow(-1px 0px 0px #ff0050) drop-shadow(1px 0px 0px #00f2ea)"], transition: { repeat: Infinity, duration: 0.5 } }
            }}
        />
    </motion.svg>
);

export const InstagramIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" />
    </motion.svg>
);

export const FacebookIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
    </motion.svg>
);

export const ScheduledIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" variants={{ hover: { rotate: 360, transition: { duration: 2, repeat: Infinity, ease: "linear" } } }} style={{ originX: "12px", originY: "12px" }} />
    </motion.svg>
);

export const PublishedIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} />
    </motion.svg>
);

export const MagicWandIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <path d="M15 4L18 7L7 18L4 15L15 4Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path d="M18 4V2M18 4H20M4 18V20M4 18H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" variants={{ hover: { opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8], transition: { repeat: Infinity, duration: 1.5 } } }} />
    </motion.svg>
);

export const LightbulbIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <path d="M9 21H15M12 3C8.134 3 5 6.134 5 10C5 12.38 6.19 14.47 8 15.74V18H16V15.74C17.81 14.47 19 12.38 19 10C19 6.134 15.866 3 12 3Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
    </motion.svg>
);

export const MicIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"
            variants={{ hover: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 1 } } }}
        />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
);

export const TypeIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path
            d="M4 7V4h16v3M9 20h6M12 4v16"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            variants={{ hover: { scaleY: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1.5 } } }}
        />
    </motion.svg>
);

export const FilmIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.path
            d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            variants={{ hover: { y: [0, -4, 0], transition: { repeat: Infinity, duration: 2, ease: "linear" } } }}
        />
    </motion.svg>
);

export const AnalyticsIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path
            d="M12 20V10M18 20V4M6 20v-4"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            variants={{ hover: { height: ["0%", "100%", "0%"], transition: { repeat: Infinity, duration: 2 } } }}
        />
    </motion.svg>
);

export const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path
            d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            variants={{ hover: { x: [0, 2, 0], transition: { repeat: Infinity, duration: 1.5 } } }}
        />
        <circle cx="9" cy="7" r="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
    </motion.svg>
);

export const VideoIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
        <motion.polygon
            points="10 8 14 12 10 16 10 8"
            fill="currentColor"
            variants={{ hover: { scale: 1.2, transition: { repeat: Infinity, duration: 0.8, repeatType: "reverse" } } }}
        />
    </motion.svg>
);

export const StarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <motion.svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} whileHover="hover">
        <motion.path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" variants={{ hover: { rotate: 72, scale: 1.1 } }} />
    </motion.svg>
);
