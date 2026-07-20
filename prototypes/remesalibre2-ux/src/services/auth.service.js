/**
 * Auth Service
 * Manages user session, login, and registration.
 */
import { api } from './api';

const TOKEN_KEY = 'remesa_auth_token';
const USER_KEY = 'remesa_user';

export const authService = {

    login: async (email, password) => {
        // Mock Login Logic
        const response = await api.mockResponse({
            token: 'mock-jwt-token-12345',
            user: {
                id: 1,
                name: 'Alex Johnson',
                email: email,
                tier: 'Verified'
            }
        });

        if (response.data) {
            localStorage.setItem(TOKEN_KEY, response.data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }
        return response;
    },

    register: async (userData) => {
        const response = await api.mockResponse({
            token: 'mock-jwt-token-new-user',
            user: { ...userData, id: Date.now(), tier: 'Basic' }
        });

        if (response.data) {
            localStorage.setItem(TOKEN_KEY, response.data.token);
            localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }
        return response;
    },

    logout: async () => {
        // In real world, call API to invalidate session
        await new Promise(r => setTimeout(r, 500));
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    getSession: () => {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        if (!token || !user) return null;
        return { token, user };
    }
};
