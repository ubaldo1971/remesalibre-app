import axios from 'axios';

// Use same base URL as configured in the app, or default to localhost:3001
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const raiteApi = axios.create({
    baseURL: API_URL + '/raite',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const raiteService = {
    // User Registration
    registerUser: async (userData) => {
        try {
            const response = await raiteApi.post('/user/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Top Up Wallet
    topUpWallet: async (topupData) => {
        try {
            const response = await raiteApi.post('/user/topup', topupData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get User Balance
    getUserBalance: async (phone) => {
        try {
            // Encode phone to handle special characters like +
            const encodedPhone = encodeURIComponent(phone);
            // We need to pass auth token if the endpoint is protected, 
            // but for this demo looking at routes.js, balance requires authentication middleware.
            // However, we are simulating a passenger app where we would have a token.
            // For the demo, we might need a workaround or assume we have a token from login.
            // Let's check routes.js again. 
            // GET /user/balance/:phone IS protected.
            // POST /user/register IS public.

            // For this demo to work without full login flow, we might need to use a valid token 
            // or temporarily disable auth on that endpoint for testing purposes.
            // Or we can register -> get token -> use token.
            // But registerUser in backend returns { user, wallet } but NO token in the current implementation.
            // This is a small blocker for "Get Balance".

            // Workaround: We will interpret the result from register/topup which returns balance.
            // And for specific getBalance call, we'll try to use the token if available in localStorage.

            const token = localStorage.getItem('auth_token');
            const config = {};
            if (token) {
                config.headers = { Authorization: `Bearer ${token}` };
            }

            const response = await raiteApi.get(`/user/balance/${encodedPhone}`, config);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};
