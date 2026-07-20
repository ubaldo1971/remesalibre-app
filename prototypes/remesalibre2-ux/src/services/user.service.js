/**
 * User Service
 * Manages profile updates and payment methods.
 */
import { api } from './api';

const PAYMENTS_KEY = 'remesa_payments';

export const userService = {

    updateProfile: async (userId, data) => {
        const response = await api.post(`users/${userId}/update`, data);
        if (response.data) {
            // Update local storage user if it matches current session
            const currentUser = JSON.parse(localStorage.getItem('remesa_user') || '{}');
            if (String(currentUser.id) === String(userId)) {
                const updated = { ...currentUser, ...data };
                localStorage.setItem('remesa_user', JSON.stringify(updated));
                // Note: AuthContext needs to reload this, ideally via an event or callback
                return { data: updated, error: null };
            }
        }
        return response;
    },

    getPaymentMethods: async () => {
        await new Promise(r => setTimeout(r, 600));
        const stored = localStorage.getItem(PAYMENTS_KEY);
        if (stored) return { data: JSON.parse(stored), error: null };

        // Default mock data
        const defaults = [
            { id: 1, type: 'card', name: 'Visa .... 4242', bank: 'BBVA', last4: '4242', default: true },
            { id: 2, type: 'bank', name: 'Cuenta .... 9876', bank: 'Santander', last4: '9876', default: false }
        ];
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(defaults));
        return { data: defaults, error: null };
    },

    addPaymentMethod: async (method) => {
        const stored = JSON.parse(localStorage.getItem(PAYMENTS_KEY) || '[]');
        const newMethod = { ...method, id: Date.now(), default: false };
        const updated = [...stored, newMethod];

        await api.post('users/payments/add', newMethod);
        localStorage.setItem(PAYMENTS_KEY, JSON.stringify(updated));

        return { data: updated, error: null };
    }
};
