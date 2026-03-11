import axios from 'axios';

import { API_URL } from '@/lib/config';

/**
 * Get analytics overview
 */
export const getAnalyticsOverview = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get performance trends
 */
export const getPerformanceTrends = async (period: number = 30) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/trends?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get video analytics
 */
export const getVideoAnalytics = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/analytics/video/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Sync analytics from platforms
 */
export const syncAnalytics = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/analytics/sync/${videoId}`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
