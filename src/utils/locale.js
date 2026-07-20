// Locale and region detection utilities

/**
 * Get user's locale from browser
 * @returns {string} Locale code (e.g., 'es-MX', 'en-US')
 */
export const getUserLocale = () => {
    return navigator.language || navigator.userLanguage || 'es-MX';
};

/**
 * Get default currency based on user's locale
 * @returns {string} Currency code ('MXN' or 'USD')
 */
export const getDefaultCurrency = () => {
    const locale = getUserLocale();

    // Check if user is in Mexico
    if (locale.toLowerCase().includes('mx')) {
        return 'MXN';
    }

    // Check if user is in US
    if (locale.toLowerCase().includes('us')) {
        return 'USD';
    }

    // Default to MXN for Spanish speakers
    if (locale.toLowerCase().startsWith('es')) {
        return 'MXN';
    }

    // Default to USD for others
    return 'USD';
};

/**
 * Get country code from locale
 * @returns {string} Country code (e.g., 'MX', 'US')
 */
export const getCountryCode = () => {
    const locale = getUserLocale();
    const parts = locale.split('-');
    return parts.length > 1 ? parts[1].toUpperCase() : 'MX';
};

/**
 * Check if user is in Mexico
 * @returns {boolean}
 */
export const isInMexico = () => {
    return getCountryCode() === 'MX';
};
