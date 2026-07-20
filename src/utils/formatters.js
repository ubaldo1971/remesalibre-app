// Format currency with proper symbols and locale
export const formatCurrency = (amount, currency = 'MXN', locale = 'es-MX') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0.00';
    }

    const currencyConfig = {
        MXN: { symbol: 'MXN', decimals: 2 },
        USD: { symbol: 'USD', decimals: 2 },
        PESO: { symbol: '$PESO', decimals: 2 },
    };

    const config = currencyConfig[currency] || { symbol: currency || '$', decimals: 2 };

    try {
        const formatted = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency === 'PESO' ? 'MXN' : currency,
            minimumFractionDigits: config.decimals,
            maximumFractionDigits: config.decimals,
        }).format(amount);

        // Replace symbol for custom currencies
        if (currency === 'PESO') {
            return formatted.replace('MXN', '$PESO');
        }

        return formatted;
    } catch (error) {
        return `${config.symbol} ${amount.toFixed(config.decimals)}`;
    }
};

// Format currency without decimals (whole numbers only)
export const formatCurrencyWhole = (amount, currency = 'MXN', locale = 'es-MX') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return currency === 'USD' ? '$0' : '$0';
    }

    const rounded = Math.floor(amount);

    try {
        const formatted = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency === 'PESO' ? 'MXN' : currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(rounded);

        // Replace symbol for custom currencies
        if (currency === 'PESO') {
            return formatted.replace('MXN', '$PESO');
        }

        return formatted;
    } catch (error) {
        const currencySymbol = currency === 'USD' ? '$' : currency === 'MXN' ? '$' : currency;
        return `${currencySymbol}${rounded.toLocaleString(locale)}`;
    }
};


// Format number without currency symbol
export const formatNumber = (number, decimals = 2) => {
    if (number === null || number === undefined || isNaN(number)) {
        return '0';
    }

    return new Intl.NumberFormat('es-MX', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(number);
};

// Parse currency string to number
export const parseCurrency = (currencyString) => {
    if (!currencyString) return 0;

    // Remove currency symbols and spaces
    const cleaned = currencyString.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
};

// Format date
export const formatDate = (date, format = 'short') => {
    if (!date) return '';

    const d = new Date(date);

    if (format === 'short') {
        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(d);
    }

    if (format === 'long') {
        return new Intl.DateTimeFormat('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);
    }

    if (format === 'time') {
        return new Intl.DateTimeFormat('es-MX', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    }

    if (format === 'datetime') {
        return new Intl.DateTimeFormat('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(d);
    }

    return d.toLocaleDateString('es-MX');
};

// Format relative time (e.g., "hace 2 horas")
export const formatRelativeTime = (date) => {
    if (!date) return '';

    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
        return 'Ahora mismo';
    }

    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }

    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    }

    return formatDate(date, 'short');
};

// Format phone number
export const formatPhoneNumber = (phone) => {
    if (!phone) return '';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format for Mexican phone numbers (10 digits)
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // Format for international numbers (with country code)
    if (cleaned.length > 10) {
        const countryCode = cleaned.slice(0, cleaned.length - 10);
        const number = cleaned.slice(-10);
        return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }

    return phone;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

// Format transaction ID
export const formatTransactionId = (id) => {
    if (!id) return '';

    // Show first 8 and last 6 characters
    if (id.length > 20) {
        return `${id.slice(0, 8)}...${id.slice(-6)}`;
    }

    return id;
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0%';
    }

    return `${value.toFixed(decimals)}%`;
};
