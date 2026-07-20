import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useNotificationStore from '../../store/notificationStore';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
    const { activeNotification, showDropdown, hideDropdown } = useNotificationStore();

    return (
        <AnimatePresence>
            {showDropdown && activeNotification && (
                <motion.div
                    className="notification-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={hideDropdown}
                >
                    <div className="notification-dropdown-content">
                        <span className="notification-dropdown-icon">
                            {activeNotification.icon}
                        </span>
                        <div className="notification-dropdown-text">
                            <p className="notification-dropdown-title">
                                {activeNotification.title}
                            </p>
                            <p className="notification-dropdown-message">
                                {activeNotification.message}
                            </p>
                        </div>
                        <button
                            className="notification-dropdown-close"
                            onClick={(e) => {
                                e.stopPropagation();
                                hideDropdown();
                            }}
                        >
                            ×
                        </button>
                    </div>
                    {/* Progress bar for auto-close */}
                    <motion.div
                        className="notification-dropdown-progress"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 4, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotificationDropdown;
