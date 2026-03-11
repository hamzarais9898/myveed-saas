// Production API URL - Heroku backend
const PRODUCTION_API_URL = 'https://MAVEED-fd7e7ee5184c.herokuapp.com/api';

export const getApiUrl = () => {
    // 1. Variable d'environnement a la priorité
    if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL;
    }

    // 2. Coté client - vérifier si localhost
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:5000/api';
        }
        // En production (Vercel), utiliser Heroku
        return PRODUCTION_API_URL;
    }

    // 3. Coté serveur (SSR) - production
    return PRODUCTION_API_URL;
};

export const API_URL = getApiUrl();
