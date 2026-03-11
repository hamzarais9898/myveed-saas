import axios from 'axios';

import { API_URL } from '@/lib/config';

let cachedSubscriptionPromise: Promise<any> | null = null;
let subscriptionCacheTime = 0;

/**
 * Get current user subscription
 * Includes a 2-second promise cache to prevent React StrictMode duplicate requests
 */
export const getCurrentSubscription = async () => {
    const now = Date.now();
    if (cachedSubscriptionPromise && now - subscriptionCacheTime < 2000) {
        return cachedSubscriptionPromise;
    }

    const token = localStorage.getItem('token');
    cachedSubscriptionPromise = axios.get(`${API_URL}/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data).catch(err => {
        cachedSubscriptionPromise = null;
        throw err;
    });

    subscriptionCacheTime = now;
    return cachedSubscriptionPromise;
};

let cachedPlansPromise: Promise<any> | null = null;
let plansCacheTime = 0;

/**
 * Get all available plans
 * Includes a 2-second promise cache
 */
export const getPlans = async () => {
    const now = Date.now();
    if (cachedPlansPromise && now - plansCacheTime < 2000) {
        return cachedPlansPromise;
    }

    const token = localStorage.getItem('token');
    cachedPlansPromise = axios.get(`${API_URL}/subscriptions/plans`, {
        headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.data).catch(err => {
        cachedPlansPromise = null;
        throw err;
    });

    plansCacheTime = now;
    return cachedPlansPromise;
};

/**
 * Get usage statistics
 */
export const getUsageStats = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/subscriptions/usage`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Create checkout session (upgrade plan)
 */
export const createCheckoutSession = async (plan: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/subscriptions/checkout`,
        { plan },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/subscriptions/cancel`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
