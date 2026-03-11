import axios from 'axios';
import { getApiUrl } from '@/lib/config';
import { connectPlatform, savePlatformToken } from './platformService';

const API_URL = getApiUrl();

export { connectPlatform, savePlatformToken };

/**
 * Helper to get the auth token from localStorage
 */
export const getAuthToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt');
};

/**
 * Publish video to a specific platform
 */
export const publishToPlatform = async (platform: string, videoId: string, data: any = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error('Veuillez vous reconnecter');

    const response = await axios.post(`${API_URL}/publish/${platform}`,
        { videoId, ...data },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );
    return response.data;
};

// Platform-Specific Wrappers
export const connectInstagram = () => connectPlatform('instagram');
export const connectTikTok = () => connectPlatform('tiktok');

export const saveInstagramToken = (token: string) => savePlatformToken('instagram', token);
export const saveTikTokToken = (token: string) => savePlatformToken('tiktok', token);

export const publishToInstagram = (videoId: string, caption?: string) =>
    publishToPlatform('instagram', videoId, { caption });

export const publishToTikTok = (videoId: string, title?: string) =>
    publishToPlatform('tiktok', videoId, { title });

export const publishFacebookVideo = (videoId: string, title?: string, description?: string) =>
    publishToPlatform('facebook/video', videoId, { title, description });

export const publishYouTube = (videoId: string, options: { title?: string, description?: string, privacyStatus?: string } = {}) =>
    publishToPlatform('youtube', videoId, options);

/**
 * Get TikTok status for a specific publishId
 */
export const getTikTokStatus = async (publishId: string) => {
    const token = getAuthToken();
    const response = await axios.post(`${API_URL}/publish/tiktok/status`,
        { publishId },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
