import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
    persist(
        (set) => ({
            // State
            // State
            theme: 'dark', // Default to dark as requested previously, but togglable
            soundEnabled: true,
            language: 'es',
            notifications: [],
            isReceiveDialogOpen: false,

            // Actions
            toggleTheme: () => {
                set((state) => ({
                    theme: state.theme === 'light' ? 'dark' : 'light',
                }));
            },

            toggleSound: () => {
                set((state) => ({
                    soundEnabled: !state.soundEnabled,
                }));
            },

            setTheme: (theme) => {
                set({ theme });
            },

            setLanguage: (language) => {
                set({ language });
            },

            openReceiveDialog: () => set({ isReceiveDialogOpen: true }),
            closeReceiveDialog: () => set({ isReceiveDialogOpen: false }),

            addNotification: (notification) => {
                const id = Date.now();
                set((state) => ({
                    notifications: [
                        ...state.notifications,
                        { ...notification, id, timestamp: new Date() },
                    ],
                }));
                return id;
            },

            removeNotification: (id) => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id !== id),
                }));
            },

            clearNotifications: () => {
                set({ notifications: [] });
            },
        }),
        {
            name: 'remesa-ui-storage',
            partialize: (state) => ({
                theme: state.theme,
                language: state.language,
                soundEnabled: state.soundEnabled,
            }),
        }
    )
);
