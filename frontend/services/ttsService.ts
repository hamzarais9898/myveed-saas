import axios from 'axios';

import { API_URL } from '@/lib/config';

/**
 * Get available voices
 */
export const getVoices = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/tts/voices`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Get vibe presets
 */
export const getVibes = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/tts/vibes`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

/**
 * Generate TTS audio
 */
export const generateTts = async (
    text: string,
    voice: string = 'ash',
    vibe: string = 'default',
    customVibe: string | null = null
) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/tts/generate`,
        { text, voice, vibe, customVibe },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};

/**
 * Preview voice
 */
export const previewVoice = async (voice: string, vibe: string = 'default') => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
        `${API_URL}/tts/preview`,
        { voice, vibe },
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    return response.data;
};
