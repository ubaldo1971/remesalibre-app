import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_BASE = 'http://localhost:3000/api/admin';

export const useAppConfigStore = create(
    persist(
        (set, get) => ({
            // Sistema - Configuración desde Admin
            commission: 0.99, // Porcentaje
            spread: 1.0, // Porcentaje

            // Donación
            donationEnabled: true,
            donationData: {
                cause: 'Reconstrucción de escuelas en Oaxaca',
                goal: 100000,
                current: 45230,
                amounts: [1, 5, 10]
            },

            // Votación Comunitaria
            votingEnabled: true,
            votingData: {
                question: '¿Qué nueva funcionalidad prefieres?',
                optionA: {
                    text: 'Pagos programados',
                    votes: 234
                },
                optionB: {
                    text: 'Cashback en compras',
                    votes: 189
                }
            },

            // Loading state
            isLoading: false,

            // Actions
            setCommission: (value) => set({ commission: value }),
            setSpread: (value) => set({ spread: value }),

            setDonationEnabled: (enabled) => set({ donationEnabled: enabled }),
            setVotingEnabled: (enabled) => set({ votingEnabled: enabled }),

            updateDonationData: (data) => set((state) => ({
                donationData: { ...state.donationData, ...data }
            })),

            updateVotingData: (data) => set((state) => ({
                votingData: { ...state.votingData, ...data }
            })),

            updateVotingOption: (option, data) => set((state) => ({
                votingData: {
                    ...state.votingData,
                    [option]: { ...state.votingData[option], ...data }
                }
            })),

            // API Methods
            fetchConfigFromServer: async () => {
                set({ isLoading: true });
                try {
                    const response = await fetch(`${API_BASE}/config`);
                    const data = await response.json();
                    if (data.success && data.config) {
                        set({
                            commission: data.config.commission ?? 0.99,
                            spread: data.config.spread ?? 1.0,
                            donationEnabled: data.config.donationEnabled ?? true,
                            donationData: {
                                cause: data.config.donationCause ?? 'Causa solidaria',
                                goal: data.config.donationGoal ?? 100000,
                                current: data.config.donationCurrent ?? 0,
                                amounts: data.config.donationAmounts ?? [1, 5, 10]
                            },
                            votingEnabled: data.config.votingEnabled ?? true,
                            votingData: {
                                question: data.config.votingQuestion ?? '',
                                optionA: data.config.votingOptionA ?? { text: '', votes: 0 },
                                optionB: data.config.votingOptionB ?? { text: '', votes: 0 }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching config:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            saveConfigToServer: async () => {
                const state = get();
                try {
                    const response = await fetch(`${API_BASE}/config`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            commission: state.commission,
                            spread: state.spread,
                            donationEnabled: state.donationEnabled,
                            donationCause: state.donationData.cause,
                            donationGoal: state.donationData.goal,
                            donationCurrent: state.donationData.current,
                            donationAmounts: state.donationData.amounts,
                            votingEnabled: state.votingEnabled,
                            votingQuestion: state.votingData.question,
                            votingOptionA: state.votingData.optionA,
                            votingOptionB: state.votingData.optionB
                        })
                    });
                    const data = await response.json();
                    return data.success;
                } catch (error) {
                    console.error('Error saving config:', error);
                    return false;
                }
            },

            saveDonationToServer: async () => {
                const state = get();
                try {
                    const response = await fetch(`${API_BASE}/donation`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            enabled: state.donationEnabled,
                            cause: state.donationData.cause,
                            goal: state.donationData.goal,
                            current: state.donationData.current,
                            amounts: state.donationData.amounts
                        })
                    });
                    return (await response.json()).success;
                } catch (error) {
                    console.error('Error saving donation:', error);
                    return false;
                }
            },

            saveVotingToServer: async () => {
                const state = get();
                try {
                    const response = await fetch(`${API_BASE}/voting`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            enabled: state.votingEnabled,
                            question: state.votingData.question,
                            optionA: state.votingData.optionA,
                            optionB: state.votingData.optionB
                        })
                    });
                    return (await response.json()).success;
                } catch (error) {
                    console.error('Error saving voting:', error);
                    return false;
                }
            }
        }),
        {
            name: 'remesa-app-config',
            partialize: (state) => ({
                commission: state.commission,
                spread: state.spread,
                donationEnabled: state.donationEnabled,
                donationData: state.donationData,
                votingEnabled: state.votingEnabled,
                votingData: state.votingData
            })
        }
    )
);

