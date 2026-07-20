import React from 'react';
import { AlertCircle } from 'lucide-react';

const InlineError = ({ message, visible }) => {
    if (!visible || !message) return null;

    return (
        <div className="flex items-start gap-2 mt-2 text-red-500 animate-fade-in text-xs font-medium px-1">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );
};

export default InlineError;
