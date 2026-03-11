'use client';

import { useState, useEffect } from 'react';
import { getCurrentSubscription } from '@/services/subscriptionService';

interface CreditsDisplayProps {
    showDetails?: boolean;
}

export default function CreditsDisplay({ showDetails = false }: CreditsDisplayProps) {
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscription();
    }, []);

    const loadSubscription = async () => {
        try {
            const response = await getCurrentSubscription();
            setSubscription(response.subscription);
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !subscription) {
        return null;
    }

    const creditsPercentage = subscription.plan === 'professional'
        ? 100
        : (subscription.remainingCredits / subscription.credits) * 100;

    const isLowCredits = creditsPercentage < 20 && subscription.plan !== 'professional';

    return (
        <div className="flex items-center space-x-2">
            {/* Credits Badge */}
            <div className={`px-3 py-1.5 rounded-xl border ${isLowCredits
                ? 'bg-red-500/20 border-red-500/30 text-red-400'
                : 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                }`}>
                <div className="flex items-center space-x-2">
                    <span className="text-sm">⚡</span>
                    <span className="text-sm font-semibold">
                        {subscription.plan === 'professional'
                            ? '∞'
                            : subscription.remainingCredits}
                    </span>
                </div>
            </div>

            {/* Plan Badge */}
            <div className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                <span className="text-xs font-semibold text-white uppercase">
                    {subscription.plan}
                </span>
            </div>

            {/* Details Tooltip */}
            {showDetails && (
                <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl z-50">
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">MAVEED Shorts</div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white">
                                    {subscription.remainingCredits} / {subscription.credits}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {Math.round(creditsPercentage)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                                    style={{ width: `${creditsPercentage}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-gray-400 mb-1">Text to Speech</div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-white">
                                    {subscription.remainingTtsCredits} / {subscription.ttsCredits}
                                </span>
                            </div>
                        </div>

                        {isLowCredits && (
                            <button className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors">
                                Upgrade Plan
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
