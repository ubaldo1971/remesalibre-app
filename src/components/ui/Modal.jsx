import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playUiSound } from '../../utils/soundUtils';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'medium', // 'small', 'medium', 'large'
    showClose = true
}) => {
    // Close on ESC key
    useEffect(() => {
        if (isOpen) {
            playUiSound('swish');
        }

        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                playUiSound('click');
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="modal-container">
                        <motion.div
                            className={`modal modal-${size}`}
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            {(title || showClose) && (
                                <div className="modal-header">
                                    {title && <h2 className="modal-title">{title}</h2>}
                                    {showClose && (
                                        <button
                                            className="modal-close"
                                            onClick={() => {
                                                playUiSound('click');
                                                onClose();
                                            }}
                                            onMouseEnter={() => playUiSound('hover')}
                                            aria-label="Cerrar"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Content */}
                            <div className="modal-content">
                                {children}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default Modal;
