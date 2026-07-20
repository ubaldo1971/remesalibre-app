import React from 'react';
import { motion } from 'framer-motion';
import { playUiSound } from '../../utils/soundUtils';
import './Card.css';

const Card = ({
    children,
    className = '',
    variant = 'default',
    padding = 'medium',
    onClick,
    hoverable = false,
    ...props
}) => {
    const handleClick = (e) => {
        if (onClick) {
            playUiSound('click');
            onClick(e);
        }
    };

    const handleMouseEnter = () => {
        if (onClick || hoverable) {
            playUiSound('hover');
        }
    };

    const cardClasses = [
        'card',
        `card-${variant}`,
        `card-padding-${padding}`,
        hoverable && 'card-hoverable',
        onClick && 'card-clickable',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const CardComponent = onClick || hoverable ? motion.div : 'div';
    const motionProps = onClick || hoverable ? {
        whileHover: { y: -4, boxShadow: 'var(--shadow-lg)' },
        whileTap: onClick ? { scale: 0.98 } : undefined,
    } : {};

    return (
        <CardComponent
            className={cardClasses}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            {...motionProps}
            {...props}
        >
            {children}
        </CardComponent>
    );
};

export default Card;
