import axios from 'axios';

import { API_URL } from '@/lib/config';

/**
 * Generate video(s) with format and variants
 */
export const generateVideo = async (
    promptText: string,
    format: 'youtube' | 'short' | 'both' = 'youtube',
    variants: number = 1,
    provider: 'luma' | 'pika' | 'runway' | 'sora' | 'veo' | 'auto' = 'runway',
    options?: {
        subtitleStyle?: string;
        subtitlePosition?: string;
        subtitleSize?: number;
        showSubtitles?: boolean;
        musicTrack?: string | null;
        image?: string;
        imageTail?: string;
        cameraControl?: any;
        outputConfig?: any; // Added outputConfig to options type
        influencerId?: string;
        sourceType?: 'image' | 'influencer';
        [key: string]: any;
    },
    duration: number = 10
) => {
    const token = localStorage.getItem('token');
    // The console.log from the instruction is placed here, assuming it's meant to be inside the function body.
    // The instruction's snippet was a bit ambiguous about its exact placement.
    console.log(`[GEN FRONT] format=${format} provider=${provider} | outputConfig=`, options?.outputConfig);
    const response = await axios.post(
        `${API_URL}/videos/generate`,
        { promptText, format, variants, provider, duration, ...options },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Get available video providers
 */
export const getAvailableProviders = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos/providers/available`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get all user videos
 */
export const getVideos = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get videos by batch ID
 */
export const getBatchVideos = async (batchId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos/batch/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get single video by ID
 */
export const getVideoById = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Download video
 */
export const downloadVideo = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos/download/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Schedule video for multiple platforms
 */
export const scheduleMultiVideo = async (
    videoId: string,
    platformConfig: any,
    tiktokAccountId?: string
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/videos/${videoId}/schedule-multi`,
        { platformConfig, tiktokAccountId },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Schedule video for a single platform
 */
export const schedulePlatformVideo = async (
    videoId: string,
    platform: string,
    scheduledDate: string,
    tiktokAccountId?: string
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/videos/${videoId}/schedule-platform`,
        { platform, scheduledDate, tiktokAccountId },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Cancel scheduled publication
 */
export const cancelSchedule = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/videos/${videoId}/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Delete video
 */
export const deleteVideo = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
/**
 * Batch schedule multiple videos
 */
export const batchScheduleVideos = async (
    videoIds: string[],
    platformConfig: any, // Typed as any to avoid complex interface here, usage in component defines structure
    tiktokAccountId?: string
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/videos/batch-schedule`,
        { videoIds, platformConfig, tiktokAccountId },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
/**
 * Complete manual video upload
 */
export const completeManualUpload = async (videoId: string, videoUrl: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/videos/admin/upload-complete/${videoId}`,
        { videoUrl },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;

};

/**
 * Delete all videos
 */
export const deleteAllVideos = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/videos/all`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
/**
 * Get video status explicitly (polling)
 */
export const getVideoStatus = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/videos/${videoId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

