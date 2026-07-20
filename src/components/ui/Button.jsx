import React from 'react';
import { motion } from 'framer-motion';
import { playUiSound } from '../../utils/soundUtils';
import './Button.css';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    icon = null,
    className = '',
    ...props
}) => {
    const handleClick = (e) => {
        if (!disabled && !loading) {
            playUiSound('click');
            if (onClick) onClick(e);
        }
    };

    const handleMouseEnter = () => {
        if (!disabled && !loading) {
            playUiSound('hover');
        }
    };

    const buttonClasses = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth && 'btn-full-width',
        loading && 'btn-loading',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <motion.button
            type={type}
            className={buttonClasses}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
            {...props}
        >
            {loading && <span className="btn-spinner" />}
            {icon && !loading && <span className="btn-icon">{icon}</span>}
            <span className="btn-text">{children}</span>
        </motion.button>
    );
};

export default Button;
