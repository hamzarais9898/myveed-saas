'use client';

import { API_URL } from '@/lib/config';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, getToken } from '@/services/authService';
import { Loader2, Camera, Save, User as UserIcon, Mail, MapPin, Globe, Phone, Crown, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getCurrentSubscription } from '@/services/subscriptionService';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

export default function ProfilePage() {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [subscription, setSubscription] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        city: '',
        country: '',
        phone: '',
        photo: null as File | null,
        photoPreview: ''
    });

    useEffect(() => {
        const currentUser = getCurrentUser();
        const currentToken = getToken();
        setUser(currentUser);
        setToken(currentToken);

        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                name: currentUser.name || '',
                email: currentUser.email || '',
                city: currentUser.city || '',
                country: currentUser.country || '',
                phone: currentUser.phone || '',
                photoPreview: currentUser.picture || ''
            }));
        }

        const fetchSubscription = async () => {
            try {
                const sub = await getCurrentSubscription();
                setSubscription(sub);
            } catch (error) {
                console.error('Error fetching subscription:', error);
            }
        };

        if (currentToken) {
            fetchSubscription();
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({
                ...formData,
                photo: file,
                photoPreview: URL.createObjectURL(file)
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('city', formData.city);
            data.append('country', formData.country);
            data.append('phone', formData.phone);

            if (formData.photo) {
                data.append('photo', formData.photo);
            }

            const res = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: data
            });

            const result = await res.json();

            if (result.success) {
                // Update local user state
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                showToast(t('profile.success'), 'success');
                // Force reload to update Navbar after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showToast(result.message || t('profile.error'), 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showToast(t('profile.error'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#c77ddf]" />
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8 text-center sm:text-left">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] bg-clip-text text-transparent mb-2">
                            {t('profile.title')}
                        </h1>
                        <p className="text-gray-600">{t('profile.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Profile Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-[#e2a9f1]/5 p-8 sm:p-10">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Photo Upload */}
                                    <div className="flex flex-col items-center sm:items-start">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 shadow-lg relative mx-auto sm:mx-0">
                                                {formData.photoPreview ? (
                                                    <img
                                                        src={formData.photoPreview}
                                                        alt="Profile"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-[#c77ddf]">
                                                        <UserIcon className="w-12 h-12" />
                                                    </div>
                                                )}

                                                {/* Overlay */}
                                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 right-0 bg-[#c77ddf] rounded-full p-2 text-white shadow-lg transform translate-x-1/4 translate-y-1/4">
                                                <Camera className="w-4 h-4" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Fields Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                                {t('profile.name')}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-[#c77ddf] transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-4 focus:bg-white focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 outline-none transition-all"
                                                    placeholder={t('profile.name')}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                                {t('profile.email')}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full bg-gray-50/50 border border-gray-100 text-gray-400 rounded-xl pl-11 pr-4 py-4 cursor-not-allowed"
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-widest">{t('profile.notEditable')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                                {t('profile.city')}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <MapPin className="h-5 w-5 text-gray-400 group-focus-within:text-[#c77ddf] transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-4 focus:bg-white focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 outline-none transition-all"
                                                    placeholder={t('profile.city')}
                                                />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                                {t('profile.country')}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Globe className="h-5 w-5 text-gray-400 group-focus-within:text-[#c77ddf] transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.country}
                                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-4 focus:bg-white focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 outline-none transition-all"
                                                    placeholder={t('profile.country')}
                                                />
                                            </div>
                                        </div>

                                        <div className="group md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                                                {t('profile.phone')}
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[#c77ddf] transition-colors" />
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl pl-11 pr-4 py-4 focus:bg-white focus:border-[#c77ddf] focus:ring-4 focus:ring-[#e2a9f1]/10 outline-none transition-all"
                                                    placeholder={t('profile.phone')}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <div className="pt-4 border-t border-gray-50">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] hover:from-[#c77ddf] hover:to-[#e2a9f1] text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#e2a9f1]/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-2xl active:scale-[0.98]"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>
                                                    <Save className="w-6 h-6" />
                                                    {t('profile.save')}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Subscription Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-[#e2a9f1]/5 p-8 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e2a9f1]/20 to-[#c77ddf]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>

                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] flex items-center justify-center text-white shadow-lg shadow-[#e2a9f1]/30">
                                        <Crown className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">{t('profile.subscription.title')}</h3>
                                        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Manage Plan</p>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-[#e2a9f1]/30 transition-colors">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{t('profile.subscription.currentPlan')}</p>
                                        <p className="text-3xl font-black text-gray-900 capitalize">
                                            {subscription?.plan || t('pricing.plans.free.name')}
                                        </p>
                                    </div>

                                    {(!subscription || subscription.plan === 'free') ? (
                                        <Link
                                            href="/#pricing"
                                            className="group flex items-center justify-between p-6 bg-gradient-to-br from-gray-900 to-black text-white rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black">{t('profile.subscription.trialCTA')}</span>
                                                <span className="text-xs text-gray-400 font-medium">Boost your creation with AI</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#e2a9f1] transition-colors">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
                                        </Link>
                                    ) : (
                                        <Link
                                            href="/subscriptions"
                                            className="group flex items-center justify-between p-6 border-2 border-gray-100 rounded-[2.2rem] hover:border-[#e2a9f1] transition-all"
                                        >
                                            <span className="text-lg font-black text-gray-900">{t('profile.subscription.manage')}</span>
                                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#e2a9f1] group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Info Card */}
                            <div className="mt-8 p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-[2.5rem] border border-blue-100/20">
                                <p className="text-sm text-gray-600 font-medium leading-relaxed italic text-center">
                                    "Your profile helps us personalize your MAVEED experience and provide better AI video generation quality."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
