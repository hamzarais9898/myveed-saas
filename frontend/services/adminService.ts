import axios from 'axios';

import { API_URL } from '@/lib/config';

// Get auth token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ==================== DASHBOARD STATS ====================

export const getOverviewStats = async () => {
    const response = await axios.get(`${API_URL}/admin/stats/overview`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// ==================== USER MANAGEMENT ====================

export const getAllUsers = async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/users`, {
        headers: getAuthHeader(),
        params
    });
    return response.data;
};

export const getUserById = async (id: string) => {
    const response = await axios.get(`${API_URL}/admin/users/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const updateUser = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/admin/users/${id}`, data, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const suspendUser = async (id: string) => {
    const response = await axios.post(`${API_URL}/admin/users/${id}/suspend`, {}, {
        headers: getAuthHeader()
    });
    return response.data;
};

export const deleteUser = async (id: string) => {
    const response = await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: getAuthHeader()
    });
    return response.data;
};

// ==================== SUBSCRIPTION MANAGEMENT ====================

export const getAllSubscriptions = async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/subscriptions`, {
        headers: getAuthHeader(),
        params
    });
    return response.data;
};

// ==================== ANALYTICS ====================

export const getRevenueAnalytics = async (days = 30) => {
    const response = await axios.get(`${API_URL}/admin/analytics/revenue`, {
        headers: getAuthHeader(),
        params: { days }
    });
    return response.data;
};

export const getUserGrowthAnalytics = async (days = 30) => {
    const response = await axios.get(`${API_URL}/admin/analytics/users`, {
        headers: getAuthHeader(),
        params: { days }
    });
    return response.data;
};
// ==================== VIDEO MANAGEMENT ====================

export const getAllVideos = async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/videos`, {
        headers: getAuthHeader(),
        params
    });
    return response.data;
};
