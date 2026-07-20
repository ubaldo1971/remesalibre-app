import React, { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const StatusBanner = ({ type = 'info', message, onClose, autoClose = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (autoClose) {
            const timer = setTimeout(() => handleClose(), autoClose);
            return () => clearTimeout(timer);
        }
    }, [autoClose]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300); // Wait for animation
    };

    if (!isVisible) return null;

    const styles = {
        info: 'bg-blue-50 text-blue-700 border-blue-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        error: 'bg-red-50 text-red-700 border-red-100',
        success: 'bg-green-50 text-green-700 border-green-100'
    };

    const icons = {
        info: Info,
        warning: AlertTriangle,
        error: AlertTriangle, // Or XCircle
        success: CheckCircle
    };

    const Icon = icons[type] || Info;

    return (
        <div className={`
            fixed top-4 left-4 right-4 z-50 
            flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md
            animate-slide-in-down transition-all duration-300
            ${styles[type]}
        `}>
            <Icon size={20} className="mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium text-sm leading-relaxed">
                {message}
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};

export default StatusBanner;
