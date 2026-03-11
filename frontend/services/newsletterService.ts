import axios from 'axios';
import { API_URL } from '@/lib/config';

/**
 * Newsletter Service
 * Handles newsletter subscriptions and management
 */

export const subscribeToNewsletter = async (email: string) => {
    const response = await axios.post(`${API_URL}/newsletter/subscribe`, { email });
    return response.data;
};

export const unsubscribeFromNewsletter = async (email: string) => {
    const response = await axios.post(`${API_URL}/newsletter/unsubscribe`, { email });
    return response.data;
};

export const getNewsletterSubscribers = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/newsletter/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const sendBulkNewsletterEmail = async (emails: string[], subject: string, content: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/newsletter/send-bulk`, {
        emails,
        subject,
        content
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};
