/**
 * API Client (Mocked for now)
 * Simulates network delay and standardizes response format.
 * In a real app, this would use 'axios' or 'fetch'.
 */

const LATENCY = 800; // ms to simulate network

export const api = {
    get: async (endpoint) => {
        await new Promise(r => setTimeout(r, LATENCY));
        const data = localStorage.getItem(`db_${endpoint}`);
        return { data: data ? JSON.parse(data) : null, error: null };
    },

    post: async (endpoint, payload) => {
        await new Promise(r => setTimeout(r, LATENCY));
        // Simple mock persistence
        if (endpoint.includes('create') || endpoint.includes('update')) {
            const key = `db_${endpoint.split('/')[0]}`; // simple key derivation
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const newItem = { ...payload, id: Date.now() };
            localStorage.setItem(key, JSON.stringify([...existing, newItem]));
            return { data: newItem, error: null };
        }
        return { data: { success: true, ...payload }, error: null };
    },

    // Helper to simulate specific data sets if needed
    mockResponse: async (data, shouldFail = false) => {
        await new Promise(r => setTimeout(r, LATENCY));
        if (shouldFail) return { data: null, error: 'Simulated Network Error' };
        return { data, error: null };
    }
};
