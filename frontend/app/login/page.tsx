'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useGoogleLogin } from '@react-oauth/google';
import { login, register, googleLogin, verifyEmail, resendCode } from '@/services/authService';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';

const avatars = [
    '/images/avatars/ai_avatar_1.png',
    '/images/avatars/ai_avatar_2.png',
    '/images/avatars/ai_avatar_3.png',
    '/images/avatars/ai_avatar_4.png'
];

export default function AuthPage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const [currentAvatar, setCurrentAvatar] = useState(0);
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Verification State
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [deviceId, setDeviceId] = useState<string>('');

    useEffect(() => {
        const initFingerprint = async () => {
            try {
                // Dynamically import to avoid SSR issues
                const FingerprintJS = (await import('@fingerprintjs/fingerprintjs')).default;
                const fp = await FingerprintJS.load();
                const result = await fp.get();
                setDeviceId(result.visitorId);
            } catch (error) {
                console.error('Failed to generate fingerprint:', error);
            }
        };
        initFingerprint();
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await login({ email: formData.email, password: formData.password, deviceId });
                showToast(t('login.form.successLogin'), 'success');
                router.push('/dashboard');
            } else {
                if (formData.password !== formData.confirmPassword) {
                    showToast(t('login.form.passwordMismatch'), 'warning');
                    setIsLoading(false);
                    return;
                }
                const response = await register({ email: formData.email, password: formData.password, deviceId });

                if (response.requiresVerification) {
                    setVerificationEmail(response.email);
                    setRequiresVerification(true);
                    setCountdown(60);
                    showToast(t('login.form.verifySubtitle'), 'info');
                } else {
                    showToast(t('login.form.successRegister'), 'success');
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            if (err.response?.data?.requiresVerification) {
                setVerificationEmail(err.response.data.email);
                setRequiresVerification(true);
                setCountdown(60);
                showToast(err.response.data.message, 'info');
            } else {
                showToast(t('login.form.error') || err.response?.data?.message || 'Une erreur est survenue', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            showToast(t('login.form.verifyError'), 'warning');
            return;
        }

        setIsLoading(true);
        try {
            await verifyEmail({ email: verificationEmail, code: verificationCode, deviceId });
            showToast(t('login.form.verifySuccess'), 'success');
            router.push('/dashboard');
        } catch (err: any) {
            // Prioritize local translation for a better user experience
            showToast(t('login.form.verifyError'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (countdown > 0) return;

        try {
            await resendCode(verificationEmail);
            setCountdown(60);
            showToast(t('login.form.resendSuccess'), 'success');
        } catch (err: any) {
            showToast(err.response?.data?.message || t('login.form.resendError'), 'error');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            await googleLogin({ accessToken: credentialResponse.access_token, deviceId });
            showToast(t('login.form.successLogin'), 'success');
            router.push('/dashboard');
        } catch (err: any) {
            showToast(err.response?.data?.message || t('login.form.googleError'), 'error');
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAvatar((prev) => (prev + 1) % avatars.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setFormData({ email: '', password: '', confirmPassword: '' });
        setRequiresVerification(false);
    };

    const googleLoginBtn = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => showToast(t('login.form.googleError'), 'error'),
    });

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white relative overflow-hidden">
            {/* Animated Background Elements from Landing Page */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] bg-[#e2a9f1]/10 rounded-full blur-[120px] animate-drift -top-20 -left-20"></div>
                <div className="absolute w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[140px] animate-drift animation-delay-3000 bottom-0 right-0"></div>
            </div>

            {/* Left Side - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 text-gray-900 selection:bg-[#e2a9f1]/20 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo - Sourced from Landing Page */}
                    <div className="mb-10 sm:mb-12">
                        <Link href="/" className="flex items-center space-x-3 sm:space-x-4 group" title="MAVEED - Accueil">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                                <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl p-2 shadow-lg transition-transform group-hover:scale-105">
                                    <Image
                                        src="/images/logoremakeit.png"
                                        alt="MAVEED - Créateur Vidéo IA"
                                        width={56}
                                        height={56}
                                        className="object-contain text-[#e2a9f1]"
                                        priority
                                    />
                                </div>
                            </div>
                            <div>
                                <span className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-[#e2a9f1] bg-clip-text text-transparent tracking-tight">
                                    MAVEED
                                </span>
                                <div className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest -mt-1">AI Video Automation</div>
                            </div>
                        </Link>
                    </div>

                    <AnimatePresence mode="wait">
                        {requiresVerification ? (
                            <motion.div
                                key="verify"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-gray-900 leading-tight">
                                        {t('login.form.verifyTitle')}
                                    </h1>
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                                        <div className="w-10 h-10 bg-[#e2a9f1]/20 rounded-xl flex items-center justify-center text-[#c77ddf]">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">{t('login.form.verifySubtitle')}</p>
                                            <p className="text-sm font-bold text-gray-700">{verificationEmail}</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyEmail} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 leading-none">{t('login.form.verifyLabel')}</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                required
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-2xl font-black text-4xl tracking-[0.5em] text-center focus:bg-white focus:border-[#e2a9f1] focus:outline-none transition-all placeholder:text-gray-200"
                                                placeholder="000000"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading || verificationCode.length !== 6}
                                        className="relative w-full py-5 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white rounded-2xl font-black tracking-widest uppercase shadow-xl shadow-[#e2a9f1]/30 hover:shadow-[#e2a9f1]/40 hover:scale-[1.02] transition-all disabled:opacity-50 active:scale-[0.98] overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>
                                                    <ShieldCheck className="w-5 h-5" />
                                                    {t('login.form.verifySubmit')}
                                                </>
                                            )}
                                        </span>
                                    </button>
                                </form>

                                <div className="pt-4 border-t border-gray-100 flex flex-col items-center gap-4">
                                    <p className="text-sm font-bold text-gray-400">{t('login.form.resendText')}</p>
                                    <button
                                        onClick={handleResendCode}
                                        disabled={countdown > 0}
                                        className={`flex items-center gap-2 font-black text-sm transition-all ${countdown > 0 ? 'text-gray-300' : 'text-[#e2a9f1] hover:text-[#c77ddf]'
                                            }`}
                                    >
                                        {countdown > 0 ? (
                                            <>{t('login.form.resendCountdown')} {countdown}s</>
                                        ) : (
                                            <>
                                                <RefreshCw className="w-4 h-4" />
                                                {t('login.form.resendBtn')}
                                            </>
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => setRequiresVerification(false)}
                                    className="w-full text-center text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                >
                                    ← {t('login.form.backToLogin')}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                            >
                                <div className="mb-8">
                                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 text-gray-900">
                                        {isLogin ? t('login.title') : t('login.createAccountTitle')}
                                    </h1>
                                    <p className="text-gray-500 font-medium text-lg">
                                        {isLogin ? t('login.subtitle') : t('login.createAccountSubtitle')}
                                    </p>
                                </div>

                                {/* Google Login - Refined Styling */}
                                <button
                                    onClick={() => googleLoginBtn()}
                                    type="button"
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-700 hover:bg-gray-50 hover:border-[#e2a9f1]/30 transition-all mb-8 group shadow-sm hover:shadow-md"
                                >
                                    <Image src="/images/google.svg" alt="Google" width={20} height={20} />
                                    {isLogin ? t('login.form.google') : t('login.form.googleRegister')}
                                </button>

                                <div className="relative mb-8">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-400 font-black uppercase tracking-widest leading-none">{t('login.form.or')}</span>
                                    </div>
                                </div>

                                {/* Form - Glassmorphism touch */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 leading-none">{t('login.form.email')}</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-[#e2a9f1] focus:outline-none transition-all placeholder:text-gray-300"
                                            placeholder={t('login.form.emailPlaceholder')}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 leading-none">{t('login.form.password')}</label>
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-[#e2a9f1] focus:outline-none transition-all placeholder:text-gray-300"
                                            placeholder={t('login.form.passwordPlaceholder')}
                                        />
                                    </div>

                                    {!isLogin && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1 leading-none">{t('login.form.confirmPassword')}</label>
                                            <input
                                                type="password"
                                                required
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl font-bold focus:bg-white focus:border-[#e2a9f1] focus:outline-none transition-all placeholder:text-gray-300"
                                                placeholder={t('login.form.passwordPlaceholder')}
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative w-full py-4 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white rounded-2xl font-black tracking-widest uppercase shadow-xl shadow-[#e2a9f1]/30 hover:shadow-[#e2a9f1]/40 hover:scale-[1.02] transition-all disabled:opacity-50 active:scale-[0.98] overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#c77ddf] to-[#e2a9f1] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>{t('login.form.connecting')}</span>
                                                </>
                                            ) : (
                                                isLogin ? t('login.form.loginBtn') : t('login.form.submitRegister')
                                            )}
                                        </span>
                                    </button>
                                </form>

                                <p className="mt-8 text-center font-bold text-gray-500">
                                    {isLogin ? t('login.noAccount') : t('login.hasAccount')}{' '}
                                    <button
                                        onClick={toggleMode}
                                        className="text-[#e2a9f1] hover:text-[#c77ddf] transition-colors font-black underline decoration-2 underline-offset-4"
                                    >
                                        {isLogin ? t('login.registerLink') : t('login.loginLink')}
                                    </button>
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Side - Visual - Full Screen Style */}
            <div className="hidden lg:flex flex-1 items-center justify-center overflow-hidden relative border-l border-gray-100">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentAvatar}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.2 }}
                        className="absolute inset-0 group"
                    >
                        <img
                            src={avatars[currentAvatar]}
                            alt={t('login.visualTag')}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[20s] ease-linear"
                        />
                        {/* More subtle gradient for "premium" look */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-20 left-20 right-20 z-20">
                            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-2.5 text-white text-xs font-black uppercase tracking-[0.2em] mb-8 w-fit shadow-2xl">
                                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.8)]" />
                                <span>{t('login.visualTag')}</span>
                            </div>

                            <h2 className="text-white text-6xl font-black leading-tight drop-shadow-2xl mb-6 max-w-2xl">
                                {t('login.visualText')}
                            </h2>

                            <div className="flex items-center gap-4">
                                <div className="w-32 h-2 bg-gradient-to-r from-[#e2a9f1] via-[#c77ddf] to-transparent rounded-full shadow-lg"></div>
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white/30 bg-gray-800 overflow-hidden backdrop-blur-sm">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" className="w-full h-full object-cover opacity-80" />
                                        </div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] flex items-center justify-center text-[10px] font-black text-white backdrop-blur-sm">
                                        +2k
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Animated overlay element */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-gradient-to-br from-[#e2a9f1]/5 to-transparent rotate-12 pointer-events-none" />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
