const PRODUCTION_API_URL = 'https://myveed-backend.vercel.app/api';

export const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }

    return PRODUCTION_API_URL;
  }

  return PRODUCTION_API_URL;
};

export const API_URL = getApiUrl();