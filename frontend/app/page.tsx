'use client';

import { Video, Mic, Type, Film, BarChart3, Users, Link as LinkIcon, Wand2, Sparkles, Calendar, Target, Calculator } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { API_URL } from '@/lib/config';
import { motion } from 'framer-motion';
import { FadeIn, ScaleIn } from '@/components/AnimationWrapper';
import { getVideos } from '@/services/videoService';
import { getCurrentSubscription } from '@/services/subscriptionService';
import { Star, X, MessageSquare, Quote } from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import {
    YouTubeIcon,
    ShortsIcon,
    TikTokIcon,
    MagicWandIcon,
    MicIcon,
    TypeIcon,
    FilmIcon,
    AnalyticsIcon,
    UsersIcon,
    VideoIcon
} from '@/components/ModernIcons';
import FeatureCard from '@/components/FeatureCard';

// Phrases are now handled dynamically via t('hero.phrases')

// Placeholder examples are now handled dynamically via t('hero.placeholderExamples')

export default function LandingPage() {
    const { t, language, setLanguage } = useLanguage();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Typewriter state
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(150);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    // Quick Generate state
    const [quickPrompt, setQuickPrompt] = useState('');
    const [generationMode, setGenerationMode] = useState<'link' | 'manual'>('manual');
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);

    // STT Hook
    const [promptBeforeSpeech, setPromptBeforeSpeech] = useState('');
    const { isListening, transcript, toggleListening, error: sttError } = useSpeechToText({ lang: 'fr-FR' });

    useEffect(() => {
        if (isListening) {
            setQuickPrompt(promptBeforeSpeech + (promptBeforeSpeech && transcript ? ' ' : '') + transcript);
        }
    }, [transcript, isListening, promptBeforeSpeech]);

    useEffect(() => {
        if (sttError === 'not-allowed') {
            console.error("Veuillez autoriser l'accès au micro");
        } else if (sttError) {
            console.error(sttError);
        }
    }, [sttError]);

    const handleSpeech = () => {
        if (!isListening) {
            setPromptBeforeSpeech(quickPrompt);
        }
        toggleListening();
    };

    // Animated counters
    const [videosCount, setVideosCount] = useState(0);
    const [creatorsCount, setCreatorsCount] = useState(0);
    const [satisfactionCount, setSatisfactionCount] = useState(0);

    // Placeholder Typewriter State
    const [placeholderText, setPlaceholderText] = useState('');
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [placeholderCharIndex, setPlaceholderCharIndex] = useState(0);
    const [isPlaceholderDeleting, setIsPlaceholderDeleting] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Review Modal State
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const rawReviews = t('testimonials.list');
    const reviewsData = Array.isArray(rawReviews) ? rawReviews : [];
    const reviews = reviewsData;

    const handleOpenReviewModal = async () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        try {
            const response = await getVideos();
            const videos = response.videos || response || [];

            if (videos.length > 0) {
                setIsReviewModalOpen(true);
                setReviewError('');
            } else {
                alert(t('testimonials.modal.eligibilityError'));
            }
        } catch (error) {
            console.error("Failed to check eligibility:", error);
            alert("Une erreur est survenue lors de la vérification de votre éligibilité.");
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewComment.trim()) {
            setReviewError(t('testimonials.modal.error'));
            return;
        }

        setReviewSubmitting(true);

        // Simulate API call
        setTimeout(() => {
            setReviewSubmitting(false);
            setIsReviewModalOpen(false);
            setReviewComment('');
            setReviewRating(5);
            alert(t('testimonials.modal.success'));
        }, 1500);
    };

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('token');
        const isAuth = !!token;
        setIsAuthenticated(isAuth);

        if (isAuth) {
            getCurrentSubscription()
                .then(data => setCurrentSubscription(data.subscription))
                .catch(err => console.error('Error fetching subscription:', err));
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Typewriter effect
    useEffect(() => {
        const i18nPhrases = t('hero.phrases').split(',');
        const handleTyping = () => {
            const currentPhrase = i18nPhrases[currentWordIndex] || i18nPhrases[0];

            if (isDeleting) {
                setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                setTypingSpeed(50);
            } else {
                setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                setTypingSpeed(150);
            }

            if (!isDeleting && displayText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false);
                setCurrentWordIndex((prev) => (prev + 1) % i18nPhrases.length);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, currentWordIndex, typingSpeed, t]);

    // Placeholder Typewriter Effect
    useEffect(() => {
        if (isInputFocused) return;

        const i18nPlaceholders = t('hero.placeholderExamples') || [];
        const currentExample = i18nPlaceholders[placeholderIndex] || '';

        const handlePlaceholderTyping = () => {
            if (isPlaceholderDeleting) {
                setPlaceholderText(currentExample.substring(0, placeholderCharIndex - 1));
                setPlaceholderCharIndex(prev => prev - 1);
            } else {
                setPlaceholderText(currentExample.substring(0, placeholderCharIndex + 1));
                setPlaceholderCharIndex(prev => prev + 1);
            }

            if (!isPlaceholderDeleting && placeholderCharIndex === currentExample.length) {
                setTimeout(() => setIsPlaceholderDeleting(true), 2000); // Wait before deleting
            } else if (isPlaceholderDeleting && placeholderCharIndex === 0) {
                setIsPlaceholderDeleting(false);
                const i18nPlaceholders = t('hero.placeholderExamples') || [];
                setPlaceholderIndex((prev) => (prev + 1) % i18nPlaceholders.length);
            }
        };

        const typingDelay = isPlaceholderDeleting ? 30 : 50;
        const timer = setTimeout(handlePlaceholderTyping, typingDelay);

        return () => clearTimeout(timer);
    }, [placeholderCharIndex, isPlaceholderDeleting, placeholderIndex, isInputFocused]);

    // Animated counters
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_URL}/analytics/public-stats`);
                const data = await response.json();

                if (data.success) {
                    const duration = 2000; // 2 seconds
                    const steps = 60;
                    const interval = duration / steps;

                    const animateCounter = (target: number, setter: (value: number) => void) => {
                        let current = 0;
                        const increment = target / steps;

                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                setter(target);
                                clearInterval(timer);
                            } else {
                                setter(Math.floor(current));
                            }
                        }, interval);
                    };

                    animateCounter(data.stats.videosCount || 120, setVideosCount);
                    animateCounter(data.stats.creatorsCount || 50, setCreatorsCount);
                    // For satisfaction, we want to keep decimals
                    const targetSatisfaction = data.stats.satisfactionCount || 99.9;
                    let currentSat = 0;
                    const incrementSat = targetSatisfaction / steps;
                    const timerSat = setInterval(() => {
                        currentSat += incrementSat;
                        if (currentSat >= targetSatisfaction) {
                            setSatisfactionCount(targetSatisfaction);
                            clearInterval(timerSat);
                        } else {
                            setSatisfactionCount(currentSat);
                        }
                    }, interval);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                // Fallback animation
                setVideosCount(100);
                setCreatorsCount(50);
                setSatisfactionCount(99.9);
            }
        };

        fetchStats();
    }, []);

    const handleQuickGenerate = () => {
        if (generationMode === 'manual') {
            if (quickPrompt.trim()) {
                localStorage.setItem('initialPrompt', quickPrompt);
            }
            router.push('/generate');
        } else {
            if (quickPrompt.trim()) {
                localStorage.setItem('initialUrl', quickPrompt);
            }
            router.push('/shorts?mode=link');
        }
    };



    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "MAVEED",
        "operatingSystem": "Web",
        "applicationCategory": "MultimediaApplication",
        "description": "Plateforme IA pour créer des vidéos virales, Shorts et Reels automatiquement.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "EUR",
            "priceValidUntil": "2026-12-31",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1240"
        },
        "featureList": [
            "YouTube to Shorts",
            "Text to Speech IA",
            "Clone Vocal",
            "Montage Automatique",
            "Influenceurs IA",
            "Publication Automatique"
        ],
        "screenshot": "https://maveed.io/images/og-image.png",
        "sameAs": [
            "https://twitter.com/dawer_ma"
        ]
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <div className="min-h-screen bg-white">
                {/* Navigation */}
                <header
                    className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled
                        ? 'bg-white/90 backdrop-blur-2xl border-b border-gray-200/50 shadow-lg shadow-[#e2a9f1]/5'
                        : 'bg-white/70 backdrop-blur-lg'
                        }`}
                >
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            {/* Logo */}
                            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group" title="MAVEED - Accueil">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl p-1.5 shadow-lg transition-transform group-hover:scale-105">
                                        <Image
                                            src="/images/logoremakeit.png"
                                            alt="MAVEED - Créateur Vidéo IA"
                                            width={48}
                                            height={48}
                                            className="object-contain"
                                            priority
                                        />
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-clip-text text-transparent">
                                        MAVEED
                                    </span>
                                    <div className="text-[10px] text-gray-500 font-medium -mt-1">{t('hero.tagline')}</div>
                                </div>
                            </Link>

                            {/* Desktop Navigation */}
                            <div className="hidden md:flex items-center space-x-4">
                                <Link
                                    href="#features"
                                    className="px-3 py-2 text-sm text-gray-700 hover:text-[#e2a9f1] transition-all font-medium relative group"
                                >
                                    {t('common.features')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] group-hover:w-full transition-all duration-300"></span>
                                </Link>
                                <Link
                                    href="#pricing"
                                    className="px-3 py-2 text-sm text-gray-700 hover:text-[#e2a9f1] transition-all font-medium relative group"
                                >
                                    {t('common.pricing')}
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] group-hover:w-full transition-all duration-300"></span>
                                </Link>

                                {/* Language Switcher */}
                                <div className="flex items-center bg-gray-100/50 backdrop-blur-sm rounded-full px-1 py-0.5 mr-2 border border-gray-200/50">
                                    {(['fr', 'en', 'de', 'es', 'ar'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => setLanguage(lang)}
                                            className={`px-2 py-1 text-[10px] font-black uppercase rounded-full transition-all ${language === lang
                                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                                                : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>

                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard"
                                        className="relative px-4 py-2.5 text-sm overflow-hidden group rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#e2a9f1]/30 hover:shadow-xl hover:shadow-[#e2a9f1]/40 hover:scale-105"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] transition-all duration-300"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#c77ddf] to-[#e2a9f1] opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                        <span className="relative text-white whitespace-nowrap flex items-center gap-2">
                                            {t('common.mySpace')}
                                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                            </svg>
                                        </span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="px-4 py-2 text-sm text-gray-700 hover:text-[#e2a9f1] transition-colors font-medium"
                                        >
                                            {t('common.login')}
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="relative px-4 py-2.5 text-sm overflow-hidden group rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-[#e2a9f1]/30 hover:shadow-xl hover:shadow-[#e2a9f1]/40 hover:scale-105"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] transition-all duration-300"></div>
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#c77ddf] to-[#e2a9f1] opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                                            <span className="relative text-white whitespace-nowrap flex items-center gap-2">
                                                {t('common.startFree')}
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                </svg>
                                            </span>
                                        </Link>
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 text-gray-700 hover:text-[#e2a9f1] transition-colors rounded-lg hover:bg-gray-100"
                                aria-label="Toggle menu"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Mobile Menu */}
                        {mobileMenuOpen && (
                            <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-200 pt-4 animate-fadeIn">
                                <Link
                                    href="#features"
                                    className="block px-4 py-2.5 text-gray-700 hover:text-[#e2a9f1] hover:bg-[#e2a9f1]/5 rounded-lg transition-all font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('common.features')}
                                </Link>
                                <Link
                                    href="#pricing"
                                    className="block px-4 py-2.5 text-gray-700 hover:text-[#e2a9f1] hover:bg-[#e2a9f1]/5 rounded-lg transition-all font-medium"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('common.pricing')}
                                </Link>

                                {/* Mobile Language Switcher */}
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-2">Lang:</span>
                                    <div className="flex bg-gray-100 rounded-full p-1 overflow-x-auto">
                                        {(['fr', 'en', 'de', 'es', 'ar'] as const).map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => setLanguage(lang)}
                                                className={`px-3 py-1 text-xs font-black uppercase rounded-full transition-all whitespace-nowrap ${language === lang
                                                    ? 'bg-white text-gray-900 shadow-sm'
                                                    : 'text-gray-400'
                                                    }`}
                                            >
                                                {lang}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard"
                                        className="block px-4 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white text-center font-semibold rounded-xl transition-all shadow-lg shadow-[#e2a9f1]/30"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {t('common.mySpace')}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="block px-4 py-2.5 text-gray-700 hover:text-[#e2a9f1] hover:bg-[#e2a9f1]/5 rounded-lg transition-all font-medium text-center"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {t('common.login')}
                                        </Link>
                                        <Link
                                            href="/login"
                                            className="block px-4 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white text-center font-semibold rounded-xl transition-all shadow-lg shadow-[#e2a9f1]/30"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {t('common.startFree')}
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden">
                    {/* Animated Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/20 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                        <div className="absolute w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 -right-20"></div>

                        {/* Floating Icons */}
                        <div className="absolute top-[15%] left-[10%] opacity-20 animate-float">
                            <svg className="w-16 h-16 text-[#c77ddf] transform rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="absolute top-[25%] right-[15%] opacity-15 animate-float-slow">
                            <svg className="w-20 h-20 text-blue-500 transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10 text-center">
                        <div className="inline-flex items-center space-x-2 bg-[#e2a9f1]/10 border border-[#e2a9f1]/30 rounded-full px-4 py-2 mb-8 animate-fadeIn">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                            <span className="text-sm text-[#c77ddf] font-medium">{t('hero.badge')}</span>
                        </div>

                        <FadeIn>
                            <h1 className="text-5xl md:text-6xl lg:text-8xl font-black mb-8 leading-[1.1]">
                                <span className="text-gray-900">{t('hero.title')}</span>
                                <br />
                                <span className="bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent">{displayText}</span>
                                <span className="ml-1 w-1.5 h-12 md:h-16 lg:h-20 bg-[#c77ddf] animate-pulse rounded-full inline-block"></span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={0.2}>
                            <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto font-medium">
                                {t('hero.subtitle')}
                            </p>
                        </FadeIn>

                        <FadeIn delay={0.4}>
                            <div className="max-w-3xl mx-auto mb-12">
                                {/* Mode Switcher */}
                                <div className="flex justify-center gap-4 mb-6">
                                    <button
                                        onClick={() => setGenerationMode('link')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'link' ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white shadow-xl shadow-[#e2a9f1]/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        {t('shorts.generationMode.link')}
                                    </button>
                                    <button
                                        onClick={() => setGenerationMode('manual')}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${generationMode === 'manual' ? 'bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white shadow-xl shadow-[#e2a9f1]/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                                    >
                                        <Wand2 className="w-4 h-4" />
                                        {t('shorts.generationMode.manual')}
                                    </button>
                                </div>

                                <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-[#e2a9f1]/10 border border-[#e2a9f1]/20 flex flex-col sm:flex-row gap-2 relative">
                                    <div className="relative flex-1 flex items-center">
                                        <input
                                            type="text"
                                            placeholder={isInputFocused ? (generationMode === 'link' ? "Collez un lien YouTube, TikTok..." : t('hero.quickPromptPlaceholder')) : placeholderText}
                                            className="flex-1 px-8 py-5 text-base sm:text-lg bg-transparent border-none focus:ring-0 placeholder:text-gray-300 text-gray-600 outline-none font-bold"
                                            value={quickPrompt}
                                            onChange={(e) => setQuickPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleQuickGenerate()}
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                        />
                                        {generationMode === 'manual' && (
                                            <button
                                                onClick={handleSpeech}
                                                className={`mr-4 p-3 rounded-full transition-all ${isListening ? 'bg-[#e2a9f1] text-white animate-pulse' : 'text-gray-300 hover:bg-gray-50 hover:text-[#c77ddf]'}`}
                                            >
                                                <Mic className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleQuickGenerate}
                                        className="px-10 py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white text-base sm:text-lg font-black rounded-[2rem] transition-all shadow-xl shadow-[#e2a9f1]/30 hover:shadow-[#e2a9f1]/40 whitespace-nowrap uppercase tracking-widest flex items-center justify-center gap-3"
                                    >
                                        {generationMode === 'manual' ? <Sparkles className="w-5 h-5 text-white" /> : <MagicWandIcon className="w-5 h-5" />}
                                        {t('hero.generateButton')}
                                    </motion.button>
                                </div>
                                <div className="mt-6 flex flex-col items-center gap-3">
                                    <p className="text-[10px] text-center text-gray-400 font-black uppercase tracking-[0.2em]">
                                        {t('hero.noCardRequired')}
                                    </p>
                                    <div className="flex items-center gap-6">
                                        <Link
                                            href="/shorts"
                                            className="text-xs font-black text-gray-500 hover:text-[#e2a9f1] transition-colors flex items-center gap-2 group uppercase tracking-widest"
                                        >
                                            <YouTubeIcon className="w-4 h-4" />
                                            <span>YouTube</span>
                                        </Link>
                                        <Link
                                            href="/shorts"
                                            className="text-xs font-black text-gray-500 hover:text-[#e2a9f1] transition-colors flex items-center gap-2 group uppercase tracking-widest"
                                        >
                                            <TikTokIcon className="w-4 h-4" />
                                            <span>TikTok</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.6}>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
                                <Link
                                    href={isAuthenticated ? "/dashboard" : "/login"}
                                    className="group px-10 py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white text-xl font-bold rounded-2xl transition-all shadow-xl shadow-[#e2a9f1]/30 hover:scale-105 flex items-center space-x-3"
                                >
                                    <span>{isAuthenticated ? t('common.mySpace') : t('common.startFree')}</span>
                                    <svg className="w-6 h-6 transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <Link href="#features" className="px-10 py-5 bg-white border-2 border-gray-100 text-gray-700 text-xl font-bold rounded-2xl hover:bg-gray-50 transition-colors">
                                    {t('hero.viewFeatures')}
                                </Link>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.8}>
                            <div className="grid grid-cols-3 gap-4 sm:gap-12 md:gap-20 border-t border-gray-100 pt-8 sm:pt-12 max-w-3xl mx-auto">
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-1 sm:mb-2">
                                        {(() => {
                                            const format = (n: number) => {
                                                if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
                                                if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
                                                return n.toString();
                                            };
                                            return format(videosCount);
                                        })()}+
                                    </div>
                                    <div className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-gray-400 font-bold leading-tight">{t('hero.stats.videos')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-1 sm:mb-2">
                                        {(() => {
                                            const format = (n: number) => {
                                                if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
                                                if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
                                                return n.toString();
                                            };
                                            return format(creatorsCount);
                                        })()}+
                                    </div>
                                    <div className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-gray-400 font-bold leading-tight">{t('hero.stats.creators')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-1 sm:mb-2">{satisfactionCount.toFixed(1)}%</div>
                                    <div className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-gray-400 font-bold leading-tight">{t('hero.stats.satisfaction')}</div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* All Features Section */}
                <section className="py-24 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <FadeIn>
                            <div className="text-center mb-16">
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 border border-[#e2a9f1]/20 rounded-full px-4 py-2 mb-6">
                                    <span className="text-sm text-[#c77ddf] font-bold tracking-widest uppercase">🚀 {t('features.badge')}</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                                    {t('features.title')}
                                </h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    {t('features.subtitle')}
                                </p>
                            </div>
                        </FadeIn>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Shorts Feature */}
                            <FadeIn delay={0.1}>
                                <Link href="/shorts" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-red-500/20">
                                            <Video className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.ytToShorts.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.ytToShorts.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.discover')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>



                            {/* AI Influencers Feature */}
                            <FadeIn delay={0.2}>
                                <Link href="/create-influencer" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden">
                                        <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-full text-[10px] font-bold text-white uppercase">Nouveau</div>
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/20">
                                            <Users className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.influencers.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.influencers.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.create')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>

                            {/* Generate Feature */}
                            <FadeIn delay={0.25}>
                                <Link href="/generate" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                                            <Film className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.generate.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.generate.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.generate')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>



                            {/* Dashboard Feature */}
                            <FadeIn delay={0.35}>
                                <Link href="/dashboard" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-slate-500/20">
                                            <Type className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('common.dashboard')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.dashboard.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.access')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>

                            {/* Analytics Feature */}
                            <FadeIn delay={0.4}>
                                <Link href="/analytics" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
                                            <BarChart3 className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('common.nav.analytics')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.analytics.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.analyze')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>

                            {/* TikTok Feature */}
                            <FadeIn delay={0.45}>
                                <Link href="/tiktok-accounts" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                                            <Calendar className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.multiAccount.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.multiAccount.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.schedule')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>

                            {/* Simulator Feature */}
                            <FadeIn delay={0.5}>
                                <Link href="/analytics?tab=simulator" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                                            <Calculator className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.simulator.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.simulator.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.analyze')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>

                            {/* Goals Feature */}
                            <FadeIn delay={0.55}>
                                <Link href="/analytics?tab=goals" className="group">
                                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full">
                                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
                                            <Target className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#c77ddf] transition-colors">{t('features.goals.title')}</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {t('features.goals.description')}
                                        </p>
                                        <div className="mt-4 flex items-center text-[#c77ddf] font-semibold text-sm">
                                            <span>{t('common.create')}</span>
                                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Link>
                            </FadeIn>
                        </div>

                        {/* CTA */}
                        <FadeIn delay={0.5}>
                            <div className="text-center mt-16">
                                <Link href="/subscriptions" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:brightness-110 hover:scale-105 transition-all">
                                    {t('features.unlockAll')}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                {/* Connectivity Section */}
                <section className="py-24 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 max-w-4xl mx-auto">
                            <FadeIn>
                                <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-2 mb-8">
                                    <span className="text-sm text-blue-600 font-bold tracking-widest uppercase">{t('connectivity.badge')}</span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-8 leading-tight">
                                    {t('connectivity.title1')} <span className="text-[#5865F2]">{t('connectivity.title2')}</span>
                                </h2>
                                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                                    {t('connectivity.description')}
                                </p>
                            </FadeIn>
                        </div>

                        <div className="relative max-w-5xl mx-auto">
                            {/* Central Hub */}
                            <ScaleIn delay={0.2} duration={0.8} className="relative z-20 bg-white rounded-[2.5rem] shadow-2xl p-4 sm:p-8 border border-gray-100 max-w-sm mx-auto mb-20 animate-float">
                                <div style={{ gap: "10px" }} className="flex items-center justify-center space-x-3 bg-gray-50 rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-xl flex items-center justify-center p-2 shadow-lg">
                                        <Image
                                            src="/images/logoremakeit.png"
                                            alt="MAVEED - Plateforme Vidéo IA Automatique"
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-contain brightness-0 invert"
                                        />
                                    </div>
                                    <span style={{ display: "none" }} className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">ddddd</span>
                                </div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rotate-45 border-b border-r border-gray-100"></div>
                            </ScaleIn>

                            {/* Connecting Lines (Desktop) */}
                            <div className="hidden md:block absolute top-24 left-1/2 -translate-x-1/2 w-[80%] h-40 pointer-events-none">
                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                    <path d="M100,0 Q50,70 100,140" fill="none" stroke="#000000" strokeWidth="3" strokeDasharray="8 8" className="opacity-20 animate-dash" />
                                    <path d="M90,130 L100,140 L110,130" fill="none" stroke="#000000" strokeWidth="3" className="opacity-20" />
                                    <path d="M370,30 L370,140" fill="none" stroke="#E1306C" strokeWidth="3" strokeDasharray="8 8" className="opacity-30 animate-dash" />
                                    <path d="M360,130 L370,140 L380,130" fill="none" stroke="#E1306C" strokeWidth="3" className="opacity-30" />
                                    <path d="M640,0 Q690,70 640,140" fill="none" stroke="#FF0000" strokeWidth="3" strokeDasharray="8 8" className="opacity-20 animate-dash" />
                                    <path d="M630,130 L640,140 L650,130" fill="none" stroke="#FF0000" strokeWidth="3" className="opacity-20" />
                                </svg>
                            </div>

                            {/* Social Platforms Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                                <FadeIn delay={0.4} direction="right">
                                    <motion.div
                                        className="bg-black text-white p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-black/10 hover:-translate-y-2 group h-full"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                                            <svg className="w-12 h-12 fill-current" viewBox="0 0 448 512">
                                                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a90.25,90.25,0,1,0,52.28,84.15V0H279.79A167.33,167.33,0,0,0,448,209.91Z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">TikTok</span>
                                        <div className="mt-4 px-4 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300 group-hover:bg-white group-hover:text-black transition-colors">{t('features.platforms.tiktok.tag')}</div>
                                    </motion.div>
                                </FadeIn>
                                <FadeIn delay={0.6}>
                                    <motion.div
                                        className="bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 text-white p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-purple-500/20 hover:-translate-y-2 group h-full"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                                            <svg className="w-12 h-12 fill-current" viewBox="0 0 448 512">
                                                <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">Instagram</span>
                                        <div className="mt-4 px-4 py-1 bg-white/20 rounded-full text-xs font-bold group-hover:bg-white group-hover:text-pink-600 transition-colors">{t('features.platforms.instagram.tag')}</div>
                                    </motion.div>
                                </FadeIn>
                                <FadeIn delay={0.8} direction="left">
                                    <motion.div
                                        className="bg-[#FF0000] text-white p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl shadow-red-500/20 hover:-translate-y-2 group h-full"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                                            <svg className="w-12 h-12 fill-current" viewBox="0 0 576 512">
                                                <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
                                            </svg>
                                        </div>
                                        <span className="text-2xl font-bold">YouTube</span>
                                        <div className="mt-4 px-4 py-1 bg-white/20 rounded-full text-xs font-bold group-hover:bg-white group-hover:text-red-600 transition-colors">{t('features.platforms.youtube.tag')}</div>
                                    </motion.div>
                                </FadeIn>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="relative py-32 px-6 overflow-hidden">
                    {/* Background Accents */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-20">
                            <FadeIn>
                                <div className="inline-flex items-center space-x-2 bg-[#e2a9f1]/10 border border-[#e2a9f1]/20 rounded-full px-4 py-2 mb-6">
                                    <span className="text-xs text-[#c77ddf] font-black uppercase tracking-widest">
                                        Powerful Features
                                    </span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                                    {t('features.title')}
                                </h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                    {t('features.subtitle')}
                                </p>
                            </FadeIn>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                { key: 'ytToShorts', icon: <VideoIcon className="w-8 h-8" />, gradient: 'from-[#FF0000] to-[#FF4500]', glow: 'shadow-red-500/20', href: '/shorts' },
                                { key: 'influencers', icon: <Users className="w-8 h-8" />, gradient: 'from-[#c084fc] to-[#a855f7]', glow: 'shadow-purple-500/20', href: '/create-influencer' },
                                { key: 'generate', icon: <FilmIcon className="w-8 h-8" />, gradient: 'from-[#32CD32] to-[#228B22]', glow: 'shadow-green-500/20', href: '/generate' },
                                { key: 'dashboard', icon: <Type className="w-8 h-8" />, gradient: 'from-[#475569] to-[#334155]', glow: 'shadow-slate-500/20', href: '/dashboard' },
                                { key: 'analytics', icon: <AnalyticsIcon className="w-8 h-8" />, gradient: 'from-[#FFD700] to-[#FFA500]', glow: 'shadow-yellow-500/20', href: '/analytics' },
                                { key: 'multiAccount', icon: <UsersIcon className="w-8 h-8" />, gradient: 'from-[#4B0082] to-[#6A5ACD]', glow: 'shadow-indigo-500/20', href: '/tiktok-accounts' }
                            ].map((feature, index) => (
                                <FeatureCard
                                    key={feature.key}
                                    title={t(`features.${feature.key}.title`)}
                                    description={t(`features.${feature.key}.description`)}
                                    icon={feature.icon}
                                    gradient={feature.gradient}
                                    glow={feature.glow}
                                    href={feature.href}
                                    delay={index * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Reviews Section */}
                <section className="py-24 px-6 bg-white overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute w-[800px] h-[800px] bg-yellow-400/5 rounded-full blur-[120px] -top-40 -right-40"></div>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10">
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center space-x-2 bg-yellow-50 border border-yellow-100 rounded-full px-4 py-2 mb-6">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm text-yellow-700 font-bold uppercase tracking-widest">{t('testimonials.badge')}</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">{t('testimonials.title')}</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('testimonials.subtitle')}</p>
                        </div>

                        <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 gap-8 mb-16 pb-8 md:pb-0 hide-scrollbar -mx-6 px-6 md:mx-auto md:px-0">
                            {reviews.map((review: any, index: number) => (
                                <FadeIn key={`${review.id}-${index}`} delay={index * 0.1}>
                                    <div className="snap-center min-w-[85vw] md:min-w-0 flex-shrink-0 h-full">
                                        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 relative group hover:-translate-y-2 transition-transform duration-300 h-full">
                                            <Quote className="absolute top-8 right-8 w-10 h-10 text-gray-200 group-hover:text-[#e2a9f1] transition-colors" />

                                            <div className="flex items-center space-x-1 mb-6">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                            </div>

                                            <p className="text-gray-700 text-lg mb-8 leading-relaxed font-medium">"{review.content}"</p>

                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#e2a9f1] flex items-center justify-center bg-gray-100 text-[#c77ddf] font-black text-xl">
                                                    {review.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{review.name}</div>
                                                    <div className="text-xs text-[#c77ddf] font-bold uppercase tracking-wide">{review.role}</div>
                                                </div>
                                                <div className="ml-auto text-2xl">{review.country}</div>
                                            </div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleOpenReviewModal}
                                className="inline-flex items-center space-x-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                            >
                                <MessageSquare className="w-5 h-5" />
                                <span>{t('testimonials.button')}</span>
                            </button>
                            <p className="mt-4 text-sm text-gray-400">
                                {t('testimonials.note')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Review Modal */}
                {isReviewModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl relative animate-scaleIn">
                            <button
                                onClick={() => setIsReviewModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                                    <Star className="w-8 h-8 fill-yellow-600" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900">{t('testimonials.modal.title')}</h3>
                                <p className="text-gray-500 mt-2">{t('testimonials.modal.subtitle')}</p>
                            </div>

                            <div className="flex justify-center space-x-2 mb-8">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setReviewRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none"
                                    >
                                        <Star
                                            className={`w-10 h-10 ${star <= reviewRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder={t('testimonials.modal.placeholder')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[120px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#c77ddf] focus:border-transparent resize-none"
                            ></textarea>

                            {reviewError && (
                                <p className="text-red-500 text-sm mb-4 font-medium text-center">{reviewError}</p>
                            )}

                            <button
                                onClick={handleSubmitReview}
                                disabled={reviewSubmitting}
                                className="w-full py-4 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {reviewSubmitting ? t('testimonials.modal.submitting') : t('testimonials.modal.submit')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Pricing */}
                <section id="pricing" className="py-24 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">{t('pricing.title')}</h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t('pricing.subtitle')}</p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {['free', 'creator', 'expert', 'professional'].map((plan, index) => (
                                <ScaleIn key={plan} delay={index * 0.1} duration={0.4}>
                                    <div className={`p-8 border-2 rounded-3xl flex flex-col h-full bg-white transition-all relative ${currentSubscription?.plan === plan
                                        ? 'border-green-500 shadow-xl scale-105 ring-4 ring-green-500/10'
                                        : plan === 'creator'
                                            ? 'border-blue-500 shadow-xl scale-105'
                                            : 'border-gray-100 hover:border-gray-200'
                                        }`}>
                                        <h3 className="text-2xl font-bold mb-2 flex items-center justify-between">
                                            {t(`pricing.plans.${plan}.name`)}
                                            {currentSubscription?.plan === plan && (
                                                <span className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full uppercase tracking-wider">Actuel</span>
                                            )}
                                        </h3>
                                        <div className="text-3xl font-black mb-6">{t('pricing.currency')}{t(`pricing.plans.${plan}.priceMonthly`)}<span className="text-sm font-normal text-gray-500">/{t('pricing.period')}</span></div>
                                        <ul className="space-y-4 mb-8 flex-grow">
                                            {t(`pricing.plans.${plan}.features`).split(',').map((f: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-gray-600 text-sm">
                                                    <span className="text-blue-500">✓</span> {f}
                                                </li>
                                            ))}
                                        </ul>
                                        <Link
                                            href={isAuthenticated ? (currentSubscription?.plan === plan ? '/dashboard' : '/subscriptions') : '/login'}
                                            className={`block w-full py-4 text-center font-bold rounded-2xl transition-all hover:scale-105 ${currentSubscription?.plan === plan
                                                ? 'bg-green-500 text-white shadow-lg cursor-default hover:scale-100'
                                                : plan === 'creator'
                                                    ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                                }`}
                                        >
                                            {currentSubscription?.plan === plan ? "Plan Actuel" : t('pricing.start')}
                                        </Link>
                                    </div>
                                </ScaleIn>
                            ))}
                        </div>
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
}
