import { create } from 'zustand';

// Notification types
export const NOTIFICATION_TYPES = {
    OPERATION: 'operation',      // Transaction confirmations
    MARKETING: 'marketing',      // Promotional messages
    SYSTEM: 'system',            // System alerts
    REWARD: 'reward',            // Rewards and bonuses
};

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    activeNotification: null, // Currently showing notification
    showDropdown: false,

    // Add a new notification
    addNotification: (notification) => {
        const newNotification = {
            id: Date.now(),
            type: notification.type || NOTIFICATION_TYPES.SYSTEM,
            title: notification.title || 'Notificación',
            message: notification.message,
            icon: notification.icon || '🔔',
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
            unreadCount: state.unreadCount + 1,
            activeNotification: newNotification,
            showDropdown: true,
        }));

        // Auto-hide after 4 seconds
        setTimeout(() => {
            set((state) => {
                if (state.activeNotification?.id === newNotification.id) {
                    return { showDropdown: false, activeNotification: null };
                }
                return {};
            });
        }, 4000);

        return newNotification;
    },

    // Show notification popup manually
    showNotification: (notification) => {
        set({ activeNotification: notification, showDropdown: true });

        setTimeout(() => {
            set((state) => {
                if (state.activeNotification?.id === notification.id) {
                    return { showDropdown: false, activeNotification: null };
                }
                return {};
            });
        }, 4000);
    },

    // Hide dropdown
    hideDropdown: () => {
        set({ showDropdown: false, activeNotification: null });
    },

    // Mark notification as read
    markAsRead: (notificationId) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    // Mark all as read
    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    // Clear all notifications
    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },

    // Get notification icon by type
    getNotificationIcon: (type) => {
        switch (type) {
            case NOTIFICATION_TYPES.OPERATION:
                return '💸';
            case NOTIFICATION_TYPES.MARKETING:
                return '🎁';
            case NOTIFICATION_TYPES.REWARD:
                return '🏆';
            case NOTIFICATION_TYPES.SYSTEM:
            default:
                return '🔔';
        }
    },
}));

export default useNotificationStore;
