// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Mexican format)
export const isValidPhone = (phone) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Mexican phone numbers are 10 digits
    return cleaned.length === 10;
};

// Validate PIN (4-6 digits)
export const isValidPIN = (pin) => {
    const pinRegex = /^\d{4,6}$/;
    return pinRegex.test(pin);
};

// Validate amount
export const isValidAmount = (amount, min = 0.01, max = 999999) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num >= min && num <= max;
};

// Validate name
export const isValidName = (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 100;
};

// Validate CLABE (Mexican bank account number - 18 digits)
export const isValidCLABE = (clabe) => {
    const cleaned = clabe.replace(/\s/g, '');
    return /^\d{18}$/.test(cleaned);
};

// Validate required field
export const isRequired = (value) => {
    if (typeof value === 'string') {
        return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
};

// Validate length
export const hasMinLength = (value, minLength) => {
    if (!value) return false;
    return value.length >= minLength;
};

export const hasMaxLength = (value, maxLength) => {
    if (!value) return true;
    return value.length <= maxLength;
};

// Composite validation
export const validate = (value, rules) => {
    const errors = [];

    for (const rule of rules) {
        const { type, message, ...params } = rule;

        switch (type) {
            case 'required':
                if (!isRequired(value)) {
                    errors.push(message || 'Este campo es requerido');
                }
                break;

            case 'email':
                if (value && !isValidEmail(value)) {
                    errors.push(message || 'Email inválido');
                }
                break;

            case 'phone':
                if (value && !isValidPhone(value)) {
                    errors.push(message || 'Teléfono inválido');
                }
                break;

            case 'pin':
                if (value && !isValidPIN(value)) {
                    errors.push(message || 'PIN debe tener 4-6 dígitos');
                }
                break;

            case 'amount':
                if (value && !isValidAmount(value, params.min, params.max)) {
                    errors.push(message || `Monto debe estar entre ${params.min} y ${params.max}`);
                }
                break;

            case 'minLength':
                if (value && !hasMinLength(value, params.length)) {
                    errors.push(message || `Mínimo ${params.length} caracteres`);
                }
                break;

            case 'maxLength':
                if (value && !hasMaxLength(value, params.length)) {
                    errors.push(message || `Máximo ${params.length} caracteres`);
                }
                break;

            case 'custom':
                if (params.validator && !params.validator(value)) {
                    errors.push(message || 'Valor inválido');
                }
                break;

            default:
                break;
        }
    }

    return errors;
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
    const errors = {};
    let isValid = true;

    for (const field in validationRules) {
        const fieldErrors = validate(formData[field], validationRules[field]);
        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors[0]; // Take first error
            isValid = false;
        }
    }

    return { isValid, errors };
};
