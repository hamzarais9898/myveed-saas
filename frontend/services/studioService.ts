import axios from 'axios';

// Utiliser l'URL de l'API configurée ou par défaut locale
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Configure axios instances with auth token
 */
const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lance la création d'une saison via l'IA.
 */
export const createStudioSeason = async (
    idea: string,
    genre: string,
    tone: string,
    targetFormat: string,
    episodeCount: number,
    actionIntensity: number
) => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/seasons`,
            { idea, genre, tone, targetFormat, episodeCount, actionIntensity },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de la création de la saison.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Récupère les données d'une saison via son ID.
 */
export const getStudioSeason = async (seasonId: string) => {
    try {
        const response = await axios.get(
            `${API_URL}/studio/seasons/${seasonId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Saison non trouvée.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Récupère l'historique paginé de toutes les saisons d'un utilisateur.
 */
export const getAllStudioSeasons = async (page: number = 1, limit: number = 12) => {
    try {
        const response = await axios.get(
            `${API_URL}/studio/seasons`,
            { 
                params: { page, limit },
                headers: getAuthHeaders() 
            }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors du chargement des saisons.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Récupère les détails d'une scène et de ses shots.
 */
export const getStudioScene = async (sceneId: string) => {
    try {
        const response = await axios.get(
            `${API_URL}/studio/scenes/${sceneId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Scène non trouvée.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Récupère les détails d'un épisode (depuis sa saison) ainsi que ses scènes/shots.
 */
export const getStudioEpisode = async (episodeId: string) => {
    try {
        const response = await axios.get(
            `${API_URL}/studio/episodes/${episodeId}`,
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Épisode non trouvé.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Lance le découpage d'un épisode en scènes via l'IA.
 */
export const generateStudioScenes = async (episodeId: string) => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/episodes/${episodeId}/generate-scenes`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors du découpage en scènes.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Lance la génération du storyboard (shots) pour une scène donnée.
 */
export const generateStudioShots = async (sceneId: string) => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/scenes/${sceneId}/generate-shots`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de la génération des plans.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Lance la génération vidéo réelle d'un plan via SORA/Runway.
 */
export const generateShotVideo = async (shotId: string, provider: string = 'runway') => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/shots/${shotId}/generate-video`,
            { provider },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de la génération vidéo.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Optimise une scène pour Sora en générant des segments de production (4, 8, 12s).
 */
export const generateStudioSegments = async (sceneId: string) => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/scenes/${sceneId}/generate-segments`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de l\'optimisation Sora.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};

/**
 * Lance la production réelle d'un segment Sora.
 */
export const generateSegmentVideo = async (segmentId: string, provider: string = 'sora') => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/segments/${segmentId}/generate-video`,
            { provider },
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de la production vidéo.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};
/**
 * Compile tous les segments d'une scène en une seule vidéo finale.
 */
export const compileSceneVideo = async (sceneId: string) => {
    try {
        const response = await axios.post(
            `${API_URL}/studio/scenes/${sceneId}/compile-video`,
            {},
            { headers: getAuthHeaders() }
        );
        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Erreur lors de la compilation de la scène.');
        }
        throw new Error('Erreur de connexion au serveur.');
    }
};
