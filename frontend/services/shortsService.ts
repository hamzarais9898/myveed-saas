import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Analyze YouTube video
 */
export const analyzeYouTubeVideo = async (youtubeUrl: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/shorts/analyze`,
        { youtubeUrl },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Get caption styles
 */
export const getCaptionStyles = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/shorts/caption-styles`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Generate MAVEED Short
 */
export const generateShort = async (options: {
    youtubeUrl: string;
    startTime: { hours: number; minutes: number; seconds: number };
    duration: number;
    backgroundMusic?: string | null;
    voice?: string | null;
    vibe?: string;
    captionStyle: number;
    language: string;
    titleText?: string | null;
    blurredBackground: boolean;
    blackBars: boolean;
}) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/shorts/generate`,
        options,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
