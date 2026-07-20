import { create } from 'zustand';
import { walletAPI } from '../utils/api';

export const useWalletStore = create((set, get) => ({
    // State
    balance: {
        mxn: 0,
        usd: 0,
        peso: 0,
    },
    transactions: [],
    loading: false,
    error: null,

    // Actions
    fetchWallet: async () => {
        set({ loading: true, error: null });
        try {
            // Fetch Balance using authenticated API client
            const balanceRes = await walletAPI.getBalance();
            const balanceData = balanceRes.data;

            // Fetch Transactions using authenticated API client
            const txRes = await walletAPI.getTransactions();
            const txData = txRes.data;

            set({
                balance: {
                    mxn: balanceData.mxn || 0,
                    usd: balanceData.usd || 0,
                    peso: balanceData.peso || balanceData.mxn || 0,
                },
                transactions: txData.transactions || txData || [],
                loading: false
            });
        } catch (error) {
            console.error('Error fetching wallet:', error);
            // Don't set error for auth failures - user might just need to login
            if (error.response?.status !== 401) {
                set({ loading: false, error: 'Failed to fetch wallet data' });
            } else {
                set({ loading: false });
            }
        }
    },

    setBalance: (balanceData) => {
        set({ balance: balanceData });
    },

    addTransaction: (transaction) => {
        set((state) => ({
            transactions: [transaction, ...state.transactions],
        }));
    },

    setTransactions: (transactions) => {
        set({ transactions });
    },

    setLoading: (loading) => {
        set({ loading });
    },

    updateBalance: (currency, amount) => {
        set((state) => ({
            balance: {
                ...state.balance,
                [currency]: amount,
            },
        }));
    },
}));

