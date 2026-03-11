import axios from 'axios';
import { getApiUrl } from '@/lib/config';

const API_URL = getApiUrl();

/**
 * Handle Instagram specific callback by redirecting to backend
 */
export const handleInstagramCallback = (code: string, state: string) => {
    window.location.href = `${API_URL}/oauth/instagram/callback?code=${code}&state=${state}`;
};

let cachedPlatformStatusPromise: Promise<any> | null = null;
let platformStatusCacheTime = 0;

/**
 * Get the status of all social platforms (connected or not)
 * Includes a 2-second promise cache to prevent React StrictMode duplicate requests
 */
export const getPlatformStatus = async () => {
    const now = Date.now();
    if (cachedPlatformStatusPromise && now - platformStatusCacheTime < 2000) {
        return cachedPlatformStatusPromise;
    }

    cachedPlatformStatusPromise = axios.get(`${API_URL}/platforms/status`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    }).then(res => res.data).catch(err => {
        cachedPlatformStatusPromise = null;
        throw err;
    });

    platformStatusCacheTime = now;
    return cachedPlatformStatusPromise;
};

/**
 * Initiate a platform OAuth connection
 */
export const connectPlatform = async (platform: string) => {
    const token = localStorage.getItem('token');
    const endpoint = (platform === 'youtube' || platform === 'instagram' || platform === 'tiktok')
        ? `/oauth/${platform}/connect`
        : `/platforms/${platform}/connect`;
    const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Save platform token after OAuth
 */
export const savePlatformToken = async (platform: string, token: string) => {
    const userToken = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/platforms/${platform}/save`,
        { token },
        {
            headers: { Authorization: `Bearer ${userToken}` }
        }
    );
    return response.data;
};

/**
 * Disconnect a platform
 */
export const disconnectPlatform = async (platform: string) => {
    const response = await axios.post(`${API_URL}/platforms/${platform}/disconnect`, {}, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
    return response.data;
};
