import axios from 'axios';
import { API_URL } from '@/lib/config';

/**
 * Generate image(s)
 */
export const generateImage = async (
    promptText: string,
    resolution: '512x512' | '768x768' | '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
    style: 'realistic' | 'cinematic' | 'illustration' | 'anime' | 'painting' | 'photorealistic' = 'cinematic',
    variants: number = 1,
    provider: string = 'gemini',
    quality: 'standard' | 'hd' = 'standard',
    influencerId?: string,
    referenceImage?: string,
    preserveIdentity: boolean = false
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/images/generate`,
        { 
            promptText, 
            resolution, 
            style, 
            variants, 
            provider, 
            quality,
            influencerId,
            referenceImage,
            preserveIdentity
        },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Get all user images
 */
export const getImages = async (limit: number = 20, skip: number = 0, status?: string) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    if (status) params.append('status', status);

    const response = await axios.get(`${API_URL}/images?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get single image by ID
 */
export const getImageById = async (imageId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Check image generation status
 */
export const checkImageStatus = async (imageId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/images/${imageId}/status`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Delete image
 */
export const deleteImage = async (imageId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get available image styles and resolutions
 */
export const getAvailableStyles = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/images/styles/available`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Preview generate (no auth) - used for client-side preview generation
 */
export const previewGenerateImage = async (
    promptText: string,
    resolution: '512x512' | '768x768' | '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024',
    style: 'realistic' | 'cinematic' | 'illustration' | 'anime' | 'painting' | 'photorealistic' = 'cinematic',
    provider: string = 'banana'
) => {
    const response = await axios.post(`${API_URL}/images/generate/preview`, { promptText, resolution, style, provider });
    return response.data;
};

/**
 * Generate video from image (image-to-video)
 */
export const generateVideoFromImage = async (
    imageId: string,
    format: 'youtube' | 'short' = 'youtube',
    provider: string = 'luma'
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/videos/generate`,
        {
            imageId,
            format,
            provider,
            promptText: `Generate video from image ${imageId}`
        },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Download image
 */
export const downloadImage = async (imageId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/images/download/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
