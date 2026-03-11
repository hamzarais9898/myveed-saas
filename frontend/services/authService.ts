import axios from 'axios';

import { API_URL } from '@/lib/config';

export const login = async (credentials: { email: string; password: string; deviceId?: string }) => {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
};

export const register = async (credentials: { email: string; password: string; deviceId?: string }) => {
    const response = await axios.post(`${API_URL}/auth/register`, credentials);
    // Note: Register usually doesn't return token immediately if verification is required
    return response.data;
};

export const googleLogin = async (payload: { credential?: string; accessToken?: string; deviceId?: string }) => {
    const response = await axios.post(`${API_URL}/auth/google`, payload);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
};

export const verifyEmail = async (payload: { email: string; code: string; deviceId?: string }) => {
    const response = await axios.post(`${API_URL}/auth/verify-email`, payload);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
};

export const resendCode = async (email: string) => {
    const response = await axios.post(`${API_URL}/auth/resend-code`, { email });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const isAuthenticated = (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    return !!token;
};

export const getCurrentUser = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const getToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
};
