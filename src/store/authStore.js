import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,

      // Actions
      login: (userData, tokens) => {
        set({
          user: userData,
          isAuthenticated: true,
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      // Synchronous logout (for immediate UI update)
      logout: () => {
        // Try to revoke token on server (fire and forget)
        const currentRefreshToken = get().refreshToken;
        if (currentRefreshToken) {
          // Dynamic import to avoid circular dependency
          import('../utils/api').then(({ authAPI }) => {
            authAPI.logout(currentRefreshToken).catch(() => {
              // Ignore errors - user is logging out anyway
            });
          }).catch(() => { });
        }

        // Clear local state immediately
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          refreshToken: null,
        });
      },

      // Async logout with server confirmation
      logoutAsync: async () => {
        const currentRefreshToken = get().refreshToken;

        try {
          if (currentRefreshToken) {
            const { authAPI } = await import('../utils/api');
            await authAPI.logout(currentRefreshToken);
          }
        } catch (error) {
          console.error('Logout API error:', error);
        } finally {
          // Always clear local state
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            refreshToken: null,
          });
        }
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      setTokens: (tokens) => {
        set({
          token: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },
    }),
    {
      name: 'remesa-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

