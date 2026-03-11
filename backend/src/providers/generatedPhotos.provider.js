const axios = require('axios');

/**
 * Generated.Photos API Provider
 * Documentation: https://generated.photos/api
 */

const API_URL = 'https://api.generated.photos/api/v1/faces';
const API_KEY = process.env.GENERATED_PHOTOS_API_KEY;

// Fallback images (Photorealistic) if API fails or no key
const FALLBACKS = {
    man: 'https://images.generated.photos/ea4mJqG97WzKzJ-2sC625aX250_X4e3t4D4u4u4u4u4.jpg',
    woman: 'https://images.generated.photos/tH2p8o6_H8X250_X4e3t4D4u4u4u4u4.jpg'
};

/**
 * Generate a face based on parameters
 * @param {Object} params - { gender, age, hairColor, skinTone, eyeColor }
 */
async function generateFace(params) {
    if (!API_KEY) {
        console.warn('Missing GENERATED_PHOTOS_API_KEY. Using fallback.');
        return {
            url: params.gender === 'man' ? FALLBACKS.man : FALLBACKS.woman,
            isFallback: true
        };
    }

    try {
        // Map our internal params to Generated.Photos API params
        const queryParams = new URLSearchParams({
            api_key: API_KEY,
            order_by: 'random',
            per_page: 1,
            gender: params.gender === 'man' ? 'male' : 'female',
            // Map age ranges roughly
            age: params.age > 40 ? 'adult' : 'young-adult',
            // Basic parameter mapping (API capabilities vary by plan)
            hair_color: mapHairColor(params.hairColor),
            emotion: 'neutral'
        });

        const response = await axios.get(`${API_URL}?${queryParams.toString()}`);

        if (response.data && response.data.faces && response.data.faces.length > 0) {
            // Return the high-res URL (usually meta.download_url or similar in their response)
            // Adapting to standard response structure
            const face = response.data.faces[0];
            return {
                url: face.urls[4][512] || face.urls[3][256] || face.urls[2][128], // Get best available resolution
                meta: face.meta
            };
        } else {
            throw new Error('No face generated');
        }

    } catch (error) {
        console.error('Generated.Photos API Error:', error.message);
        return {
            url: params.gender === 'man' ? FALLBACKS.man : FALLBACKS.woman,
            error: error.message
        };
    }
}

function mapHairColor(color) {
    const map = {
        'blonde': 'blond',
        'brown': 'brown',
        'black': 'black',
        'red': 'red',
        'grey': 'gray',
        'white': 'gray'
    };
    return map[color] || 'brown';
}

module.exports = {
    generateFace
};
