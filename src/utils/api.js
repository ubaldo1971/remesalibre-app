import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Create axios instance
export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = useAuthStore.getState().refreshToken;
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data;
                    useAuthStore.getState().setTokens({ accessToken, refreshToken });

                    // Retry original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                useAuthStore.getState().logout();
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// API methods
export const authAPI = {
    verifyPhone: (phoneNumber) => api.post('/auth/verify-phone', { phoneNumber }),
    verifyOTP: (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp }),
    register: (data) => api.post('/auth/register', data),
    login: (phoneNumber, pin) => api.post('/auth/login', { phoneNumber, pin }),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
    refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
    googleLogin: (data) => api.post('/auth/google-login', data),
};

export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    changePin: (oldPin, newPin) => api.post('/user/change-pin', { oldPin, newPin }),
};

export const walletAPI = {
    getBalance: () => api.get('/wallet/balance'),
    getTransactions: (params) => api.get('/wallet/transactions', { params }),
    addBalance: (data) => api.post('/wallet/add-balance', data),
    getSavedCards: () => api.get('/wallet/saved-cards'),
};

export const transactionAPI = {
    send: (data) => api.post('/transactions/send', data),
    receive: (data) => api.post('/transactions/receive', data),
    getDetails: (id) => api.get(`/transactions/${id}`),
    getQuote: (data) => api.post('/transactions/quote', data),
    generateQR: (amount) => api.post('/transactions/generate-qr', { amount }),
    validateQR: (qrCode) => api.post('/transactions/validate-qr', { qrCode }),
};

export const cashoutAPI = {
    request: (data) => api.post('/cashout/request', data),
    spei: (data) => api.post('/cashout/spei', data),
    oxxo: (data) => api.post('/cashout/oxxo', data),
    getHistory: () => api.get('/cashout/history'),
};

export const qrAPI = {
    generate: (data) => api.post('/qr/generate', data),
    validate: (qr_payload) => api.post('/qr/validate', { qr_payload }),
    pay: (data) => api.post('/qr/pay', data),
};

export const conversionAPI = {
    getRate: (from, to) => api.get('/conversion/rate', { params: { from, to } }),
    convert: (amount, from, to) => api.post('/conversion/convert', { amount, from, to }),
};

export const adminAPI = {
    login: (username, password) => api.post('/admin/login', { username, password }),
    getDashboard: () => api.get('/admin/dashboard'),
    getTransactions: (params) => api.get('/admin/transactions', { params }),
    setFees: (data) => api.post('/admin/fees', data),
    setSpread: (data) => api.post('/admin/spread', data),
    getLiquidity: () => api.get('/admin/liquidity'),
    getFraudAlerts: () => api.get('/admin/fraud-alerts'),
    getAnalytics: (params) => api.get('/admin/analytics', { params }),
};

export const votingAPI = {
    vote: (data) => api.post('/voting/vote', data),
    getStatus: (params) => api.get('/voting/status', { params }),
};

export const donationAPI = {
    contribute: (data) => api.post('/donation/contribute', data),
    getConfig: () => api.get('/donation/config'),
    getHistory: () => api.get('/donation/history'),
};

export default api;
