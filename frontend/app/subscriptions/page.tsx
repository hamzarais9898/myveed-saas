'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getPlans, getCurrentSubscription, createCheckoutSession, cancelSubscription } from '@/services/subscriptionService';
import Skeleton, { SkeletonText } from '@/components/Skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, CreditCard, Clock, Shield, Zap, Users, Globe } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SubscriptionsPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [plans, setPlans] = useState<any>(null);
    const [currentSubscription, setCurrentSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState<string | null>(null);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [plansResponse, subscriptionResponse] = await Promise.all([
                getPlans(),
                getCurrentSubscription()
            ]);
            setPlans(plansResponse.plans);
            setCurrentSubscription(subscriptionResponse.subscription);
        } catch (error) {
            console.error('Error loading data:', error);
            showToast(t('common.errorLoadingData'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        setUpgrading(planId);
        try {
            const response = await createCheckoutSession(planId);
            if (response.url) {
                window.location.href = response.url;
            } else {
                await loadData();
                showToast(response.message || 'Mise à niveau réussie', 'success');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Erreur lors de la mise à niveau', 'error');
        } finally {
            setUpgrading(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return;

        try {
            const response = await cancelSubscription();
            showToast(response.message || 'Abonnement annulé', 'info');
            await loadData();
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Erreur lors de l\'annulation', 'error');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-white">
                    <Navbar />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <div className="text-center mb-12">
                            <Skeleton className="h-8 w-32 mx-auto mb-6 rounded-full" />
                            <Skeleton className="h-12 w-64 mx-auto mb-4" />
                            <Skeleton className="h-6 w-96 mx-auto" />
                        </div>
                        <div className="mb-8 p-6 bg-white border-2 border-gray-100 rounded-2xl">
                            <div className="flex justify-between">
                                <Skeleton className="h-12 w-32" />
                                <Skeleton className="h-12 w-32" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="p-8 border-2 border-gray-100 rounded-2xl">
                                    <Skeleton className="h-8 w-24 mb-4" />
                                    <Skeleton className="h-10 w-32 mb-6" />
                                    <Skeleton className="h-32 w-full mb-6" />
                                    <Skeleton className="h-12 w-full mt-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const planOrder = ['free', 'creator', 'expert', 'professional'];
    const isTrialActive = currentSubscription?.isTrialActive;
    const trialDaysRemaining = currentSubscription?.trialDaysRemaining || 0;

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white selection:bg-[#e2a9f1]/20">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-gray-900">
                    {/* Header */}
                    <div className="text-center mb-12 animate-fadeIn">
                        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2 mb-6">
                            <span className="text-sm text-blue-600 font-medium">💎 Tarification</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                            Plans & Abonnements
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                            Choisissez le plan adapté à vos ambitions
                        </p>
                    </div>


                    {/* Current Plan Info */}
                    {currentSubscription && !isTrialActive && (
                        <div className="mb-8 p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all animate-fadeIn animation-delay-200">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-1">Plan actuel</div>
                                    <div className="text-2xl font-bold text-blue-600 capitalize">
                                        {currentSubscription.plan}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600 mb-1">Crédits restants</div>
                                    <div className="text-2xl font-bold text-gray-900">
                                        {currentSubscription.plan === 'professional' ? '∞' : currentSubscription.remainingCredits}
                                    </div>
                                </div>
                                {currentSubscription.plan !== 'free' && (
                                    <button
                                        onClick={handleCancel}
                                        className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-colors font-medium"
                                    >
                                        Annuler l&apos;abonnement
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Plans Grid - Equal Height Cards */}
                    <div id="plans" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 animate-fadeIn animation-delay-400">
                        {planOrder.map((planId) => {
                            const plan = plans[planId];
                            const isCurrent = currentSubscription?.plan ? currentSubscription.plan === planId : planId === 'free';
                            const currentPlanIndex = currentSubscription?.plan ? planOrder.indexOf(currentSubscription.plan) : 0;
                            const isUpgrade = planOrder.indexOf(planId) > currentPlanIndex;
                            const isPopular = planId === 'creator';

                            return (
                                <div
                                    key={planId}
                                    className={`relative flex flex-col h-full p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 ${isCurrent
                                        ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-100'
                                        : isPopular
                                            ? 'border-blue-400 bg-gradient-to-br from-white to-blue-50 shadow-xl shadow-blue-100 scale-105'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50'
                                        }`}
                                >
                                    {/* Popular Badge */}
                                    {isPopular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                                            ⭐ Populaire
                                        </div>
                                    )}

                                    {/* Current Badge */}
                                    {isCurrent && (
                                        <div className="absolute -top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                            ✓ Actuel
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900">
                                            {t(`pricing.plans.${planId}.name`)}
                                        </h3>
                                        <div className="flex items-baseline space-x-1">
                                            <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                                                {plan.price}€
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-gray-600">/mois</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Credits */}
                                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100">
                                        <div className="text-sm mb-1 text-gray-600">
                                            Crédits mensuels
                                        </div>
                                        <div className="text-lg font-bold text-blue-600">
                                            {plan.credits === -1 ? 'Illimité' : `${plan.credits} Shorts`}
                                        </div>
                                        <div className="text-sm mt-1 text-gray-600">
                                            {plan.ttsCredits === -1 ? 'Illimité' : `${plan.ttsCredits} TTS`}
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-6 flex-grow">
                                        {(t(`pricing.plans.${planId}.features`) as string).split(',').map((feature: string, index: number) => (
                                            <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                                                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button - Always at bottom */}
                                    <div className="mt-auto">
                                        {isCurrent ? (
                                            <button
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                                            >
                                                Plan actuel
                                            </button>
                                        ) : isUpgrade ? (
                                            <button
                                                onClick={() => handleUpgrade(planId)}
                                                disabled={upgrading === planId}
                                                className="w-full px-4 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105"
                                            >
                                                {upgrading === planId ? 'Mise à niveau...' : 'Mettre à niveau'}
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-xl font-semibold cursor-not-allowed"
                                            >
                                                Rétrogradation non disponible
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Detailed Comparison */}
                    <div className="mb-24 animate-fadeIn animation-delay-500">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Fonctionnalités par plan </h2>
                            <p className="text-gray-600">Comparez les fonctionnalités de nos différents plans</p>
                        </div>

                        <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-xl shadow-blue-50/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/50">
                                            <th className="px-8 py-6 text-sm font-black text-gray-600 uppercase tracking-wider">Fonctionnalités</th>
                                            <th className="px-8 py-6 text-center text-sm font-black text-blue-600 uppercase tracking-wider">Créateur</th>
                                            <th className="px-8 py-6 text-center text-sm font-black text-[#c77ddf] bg-[#c77ddf]/5 uppercase tracking-wider">Expert</th>
                                            <th className="px-8 py-6 text-center text-sm font-black text-indigo-600 uppercase tracking-wider">Professionnel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[
                                            { name: 'Recherche intelligente YouTube', creator: true, expert: true, professional: true },
                                            { name: 'Sous-titres designs', creator: true, expert: true, professional: true },
                                            { name: 'Voix off réalistes', creator: true, expert: true, professional: true },
                                            { name: 'Intonations personnalisées des voix off', creator: true, expert: true, professional: true },
                                            { name: 'Auto cuts / Frame optimization', creator: true, expert: true, professional: true },
                                            { name: 'Tutoriels librairie', creator: true, expert: true, professional: true },
                                            { name: 'Support Privé', creator: false, expert: true, professional: true },
                                        ].map((feature, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-8 py-5 text-gray-700 font-medium">{feature.name}</td>
                                                <td className="px-8 py-5 text-center">
                                                    {feature.creator ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">✕</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-center bg-[#c77ddf]/5">
                                                    {feature.expert ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#c77ddf] text-white">✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">✕</span>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {feature.professional ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600">✓</span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">✕</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="max-w-4xl mx-auto animate-fadeIn animation-delay-600">
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e2a9f1]/10 to-[#c77ddf]/10 rounded-full mb-4">
                                <HelpCircle className="w-5 h-5 text-[#c77ddf]" />
                                <span className="text-sm font-bold text-[#c77ddf] uppercase tracking-wider">Support</span>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 mb-4">Questions fréquentes</h2>
                            <p className="text-gray-600 max-w-xl mx-auto">Tout ce que vous devez savoir sur nos abonnements et services</p>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    icon: <CreditCard className="w-5 h-5" />,
                                    q: "Puis-je changer de plan à tout moment ?",
                                    a: "Oui, absolument ! Vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre tableau de bord. Si vous passez à un plan supérieur, la différence sera calculée au prorata. Les crédits non utilisés de votre ancien plan seront automatiquement reportés sur votre nouveau plan."
                                },
                                {
                                    icon: <Zap className="w-5 h-5" />,
                                    q: "Que se passe-t-il si j'épuise mes crédits ?",
                                    a: "Pas de panique ! Vous avez plusieurs options : vous pouvez upgrader vers un plan supérieur pour obtenir plus de crédits immédiatement, ou simplement attendre le renouvellement mensuel automatique de vos crédits. Nous vous enverrons également une notification quand vous atteignez 20% de vos crédits restants."
                                },
                                {
                                    icon: <Shield className="w-5 h-5" />,
                                    q: "Y a-t-il un engagement ?",
                                    a: "Non, aucun engagement ! Tous nos plans sont flexibles et vous pouvez annuler à tout moment. Si vous annulez, vous conservez l'accès à votre plan jusqu'à la fin de la période de facturation en cours. Aucuns frais cachés, aucune pénalité."
                                },
                                {
                                    icon: <Clock className="w-5 h-5" />,
                                    q: "Puis-je essayer le service avant de m'abonner ?",
                                    a: "Le plan gratuit vous permet de tester la plateforme avec 30 crédits par mois. C'est le meilleur moyen de découvrir toutes les fonctionnalités de création vidéo avant de passer à un plan supérieur."
                                },
                                {
                                    icon: <Globe className="w-5 h-5" />,
                                    q: "Les vidéos générées sont-elles libres de droits ?",
                                    a: "Oui ! Toutes les vidéos que vous créez avec MAVEED vous appartiennent entièrement. Vous pouvez les utiliser à des fins commerciales, les publier sur n'importe quelle plateforme et les monétiser sans restrictions. Nous ne revendiquons aucun droit sur vos créations."
                                },
                                {
                                    icon: <Users className="w-5 h-5" />,
                                    q: "Puis-je partager mon compte avec mon équipe ?",
                                    a: "Le plan Professional est conçu pour un usage individuel. Pour les équipes et agences, nous recommandons notre plan Entreprise qui inclut des fonctionnalités multi-utilisateurs, une gestion des accès et un support dédié. Contactez-nous pour une offre personnalisée."
                                },
                                {
                                    icon: <CreditCard className="w-5 h-5" />,
                                    q: "Quels moyens de paiement acceptez-vous ?",
                                    a: "Nous acceptons toutes les cartes de crédit majeures (Visa, Mastercard, American Express), ainsi que les paiements par Apple Pay et Google Pay. Tous les paiements sont sécurisés via Stripe, le leader mondial du paiement en ligne."
                                },
                                {
                                    icon: <Zap className="w-5 h-5" />,
                                    q: "Quelle est la qualité des vidéos générées ?",
                                    a: "Toutes nos vidéos sont générées en haute définition (1080p). Selon votre plan, vous pouvez également générer des vidéos en 4K. Notre technologie IA de pointe garantit des résultats professionnels avec des voix naturelles et des transitions fluides."
                                }
                            ].map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                                >
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                        className="w-full p-6 flex items-center justify-between text-left group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedFaq === index ? 'bg-gradient-to-br from-[#e2a9f1] to-[#c77ddf] text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-[#e2a9f1]/10 group-hover:text-[#c77ddf]'}`}>
                                                {faq.icon}
                                            </div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-[#c77ddf] transition-colors">{faq.q}</h3>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedFaq === index ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${expandedFaq === index ? 'bg-[#e2a9f1] text-white' : 'bg-gray-100 text-gray-400'}`}
                                        >
                                            <ChevronDown className="w-5 h-5" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedFaq === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-6 pb-6 pt-2">
                                                    <div className="pl-14 pr-8">
                                                        <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>

                        {/* Contact CTA */}
                        <div className="mt-12 text-center p-8 bg-gradient-to-r from-[#e2a9f1]/10 via-white to-[#c77ddf]/10 rounded-3xl border border-[#e2a9f1]/20">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Vous avez d&apos;autres questions ?</h3>
                            <p className="text-gray-600 mb-4">Notre équipe est là pour vous aider</p>
                            <button className="px-6 py-3 bg-gradient-to-r from-[#e2a9f1] to-[#c77ddf] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                                Contacter le support
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
