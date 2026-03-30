import axios from 'axios';
import { API_URL } from '@/lib/config';

export interface InfluencerConfig {
    eyes: {
        color: string;
        shape: string;
        details: string;
    };
    smile: {
        type: string;
        teeth: string;
    };
    skin: {
        tone: string;
        features: string;
        freckles: boolean;
        frecklesIntensity: number;
    };
    hair: {
        color: string;
        style: string;
        length: string;
        highlights: string;
    };
    body: {
        type: string;
        height: string;
    };
    ethnicity: string;
    aesthetic: string;
}

export interface Influencer {
    _id: string;
    name: string;
    gender: 'man' | 'woman' | 'other';
    age: number;
    avatarUrl: string;
    status: 'active' | 'draft';
    rpmAvatarUrl?: string; // Legacy
    bodyType?: string;
    hair?: { color: string; style: string };
    skin?: { tone: string };
    eyes?: { color: string };
    config: InfluencerConfig;
    photos: Array<{ imageUrl: string; prompt: string; createdAt: string }>;
    videos: Array<{ videoUrl: string; originalImageUrl: string; prompt: string; createdAt: string }>;
    photosCount?: number;
    videosCount?: number;
    assetsCount?: number;
    createdAt: string;
}

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const getInfluencers = async (filters: any = {}) => {
    const query = new URLSearchParams(filters).toString();
    const response = await axios.get(`${API_URL}/influencers${query ? `?${query}` : ''}`, { headers: getHeaders() });
    return response.data;
};

export const createInfluencer = async (data: Partial<Influencer>) => {
    const response = await axios.post(`${API_URL}/influencers`, data, { headers: getHeaders() });
    return response.data;
};

export const deleteInfluencer = async (id: string) => {
    const response = await axios.delete(`${API_URL}/influencers/${id}`, { headers: getHeaders() });
    return response.data;
};

export const generatePhotos = async (id: string, count: number, customPrompt?: string) => {
    const response = await axios.post(`${API_URL}/influencers/${id}/generate-photos`, { count, customPrompt }, { headers: getHeaders() });
    return response.data;
};

export const generateVideos = async (id: string, photoUrls: string[], count: number, customPrompt?: string) => {
    const response = await axios.post(`${API_URL}/influencers/${id}/generate-videos`, { photoUrls, count, customPrompt }, { headers: getHeaders() });
    return response.data;
};

export const previewGenerateImage = async (config: any) => {
    const response = await axios.post(`${API_URL}/influencers/preview-image`, config, { headers: getHeaders() });
    return response.data;
};

export const checkPreviewStatus = async (jobId: string) => {
    const response = await axios.get(`${API_URL}/influencers/preview-status/${jobId}`, { headers: getHeaders() });
    return response.data;
};

export const getInfluencerLibrary = async (id: string, page = 1, limit = 20, type?: string) => {
    let url = `${API_URL}/influencers/${id}/library?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    const response = await axios.get(url, { headers: getHeaders() });
    return response.data;
};
