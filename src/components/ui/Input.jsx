import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(
    (
        {
            label,
            error,
            type = 'text',
            placeholder,
            value,
            onChange,
            onBlur,
            onFocus,
            disabled = false,
            required = false,
            icon = null,
            rightIcon = null,
            prefix = null,
            prefixOptions = null,
            selectedPrefix = null,
            onPrefixChange = null,
            className = '',
            ...props
        },
        ref
    ) => {
        const hasPrefixSelector = prefixOptions && prefixOptions.length > 0;

        const inputClasses = [
            'input-wrapper',
            error && 'input-error',
            disabled && 'input-disabled',
            icon && 'input-has-icon',
            (prefix || hasPrefixSelector) && 'input-has-prefix',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={inputClasses}>
                {label && (
                    <label className="input-label">
                        {label}
                        {required && <span className="input-required">*</span>}
                    </label>
                )}

                <div className="input-container">
                    {icon && <span className="input-icon-left">{icon}</span>}

                    {/* Prefix selector dropdown */}
                    {hasPrefixSelector && (
                        <select
                            className="input-prefix-select"
                            value={selectedPrefix || prefixOptions[0]?.value}
                            onChange={(e) => onPrefixChange && onPrefixChange(e.target.value)}
                            disabled={disabled}
                        >
                            {prefixOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Static prefix (fallback) */}
                    {!hasPrefixSelector && prefix && <span className="input-prefix">{prefix}</span>}

                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        onFocus={onFocus}
                        placeholder={placeholder}
                        disabled={disabled}
                        required={required}
                        className="input-field"
                        {...props}
                    />

                    {rightIcon && <span className="input-icon-right">{rightIcon}</span>}
                </div>

                {error && <span className="input-error-message">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;

