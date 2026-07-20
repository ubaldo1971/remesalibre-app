import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { isValidPhone, isValidName } from '../../utils/validation';
import { getStatesByCountry, getCitiesByState } from '../../utils/locationData';
import './CompleteRegistration.css';

const CompleteRegistration = () => {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [googleUser, setGoogleUser] = useState(null);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        countryPrefix: '+52 1',
        country: 'MX',
        state: '',
        city: '',
        pin: '',
        confirmPin: '',
    });

    const [errors, setErrors] = useState({});

    // Phone prefix options
    const prefixOptions = [
        { value: '+52 1', label: '🇲🇽 +52 1' },
        { value: '+1', label: '🇺🇸 +1' }
    ];

    useEffect(() => {
        // Get Google user data if exists
        const storedGoogleUser = sessionStorage.getItem('googleUser');
        if (storedGoogleUser) {
            const parsed = JSON.parse(storedGoogleUser);
            setGoogleUser(parsed);
            setFormData(prev => ({
                ...prev,
                firstName: parsed.firstName || '',
                lastName: parsed.lastName || '',
                email: parsed.email || '',
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'El nombre es requerido';
        } else if (!isValidName(formData.firstName)) {
            newErrors.firstName = 'Nombre inválido';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'El apellido es requerido';
        } else if (!isValidName(formData.lastName)) {
            newErrors.lastName = 'Apellido inválido';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'El teléfono es requerido';
        } else if (!isValidPhone(formData.phoneNumber)) {
            newErrors.phoneNumber = 'Teléfono inválido (10 dígitos)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.state.trim()) {
            newErrors.state = 'El estado es requerido';
        }

        if (!formData.city.trim()) {
            newErrors.city = 'La ciudad es requerida';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};

        if (!formData.pin) {
            newErrors.pin = 'El PIN es requerido';
        } else if (formData.pin.length < 4 || formData.pin.length > 6) {
            newErrors.pin = 'El PIN debe tener entre 4 y 6 dígitos';
        } else if (!/^\d+$/.test(formData.pin)) {
            newErrors.pin = 'El PIN debe contener solo números';
        }

        if (!formData.confirmPin) {
            newErrors.confirmPin = 'Confirma tu PIN';
        } else if (formData.pin !== formData.confirmPin) {
            newErrors.confirmPin = 'Los PINs no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNextStep = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
        } else if (step === 2 && validateStep2()) {
            setStep(3);
        }
    };

    // Format phone number for API
    const formatPhoneNumber = (phone, prefix) => {
        const cleaned = phone.replace(/\D/g, '');
        const prefixClean = prefix.replace(/\s/g, '');
        return prefixClean + cleaned;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        console.log('[Registration] Submit clicked, step:', step);

        if (!validateStep3()) {
            console.log('[Registration] Step 3 validation failed');
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            console.log('[Registration] Starting API call...');
            console.log('[Registration] Form data:', formData);
            // Import api dynamically to avoid circular dependencies
            const { authAPI } = await import('../../utils/api');

            const formattedPhone = formatPhoneNumber(formData.phoneNumber, formData.countryPrefix);
            console.log('[Registration] Phone formatted:', formattedPhone);

            const response = await authAPI.register({
                phoneNumber: formattedPhone,
                pin: formData.pin,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
            });
            console.log('[Registration] API response:', response.data);

            const { user, accessToken, refreshToken } = response.data;

            // Store user and tokens
            login(
                {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phoneNumber,
                    country: formData.country,
                    state: formData.state,
                    city: formData.city,
                    picture: googleUser?.picture,
                },
                {
                    accessToken,
                    refreshToken,
                }
            );

            // Clear Google user data
            sessionStorage.removeItem('googleUser');

            // Navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error:', err);

            if (err.response?.status === 400) {
                if (err.response.data?.error?.includes('already exists')) {
                    setErrors({ phoneNumber: 'Este teléfono ya está registrado' });
                } else {
                    setErrors({ general: err.response.data?.error || 'Error en el registro' });
                }
            } else {
                setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            className="registration-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="registration-header">
                <h2>Completa tu registro</h2>
                <p>Paso {step} de 3</p>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* General error display */}
            {errors.general && (
                <div className="general-error">
                    ⚠️ {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="registration-form">
                {step === 1 && (
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="form-step"
                    >
                        <h3>Información Personal</h3>

                        {googleUser && (
                            <div className="google-profile">
                                <img src={googleUser.picture} alt="Profile" />
                                <p>Conectado con Google</p>
                            </div>
                        )}

                        <Input
                            label="Nombre(s)"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            error={errors.firstName}
                            placeholder="Juan"
                            required
                            disabled={!!googleUser?.firstName}
                        />

                        <Input
                            label="Apellido(s)"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            error={errors.lastName}
                            placeholder="Pérez García"
                            required
                            disabled={!!googleUser?.lastName}
                        />

                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            placeholder="correo@ejemplo.com"
                            required
                            disabled={!!googleUser?.email}
                        />

                        <Input
                            label="Número de Celular"
                            type="tel"
                            name="phoneNumber"
                            prefixOptions={prefixOptions}
                            selectedPrefix={formData.countryPrefix}
                            onPrefixChange={(val) => setFormData({ ...formData, countryPrefix: val })}
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            error={errors.phoneNumber}
                            placeholder="5512345678"
                            maxLength={10}
                            required
                        />

                        {errors.phoneNumber && (errors.phoneNumber.toLowerCase().includes('registrado') || errors.phoneNumber.toLowerCase().includes('exists')) && (
                            <div className="login-link-error">
                                💡 ¿Ya tienes cuenta? <span onClick={() => navigate('/login')}>Inicia sesión aquí</span>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="primary"
                            size="large"
                            fullWidth
                            onClick={handleNextStep}
                        >
                            Siguiente
                        </Button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="form-step"
                    >
                        <h3>Ubicación</h3>

                        <div className="form-group">
                            <label>País</label>
                            <select
                                name="country"
                                value={formData.country}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        country: e.target.value,
                                        state: '',
                                        city: ''
                                    });
                                }}
                                className="select-input"
                            >
                                <option value="MX">México</option>
                                <option value="US">Estados Unidos</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Estado {errors.state && <span className="error-label">{errors.state}</span>}</label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        state: e.target.value,
                                        city: ''
                                    });
                                    if (errors.state) setErrors({ ...errors, state: '' });
                                }}
                                className={`select-input ${errors.state ? 'select-error' : ''}`}
                            >
                                {getStatesByCountry(formData.country).map((state) => (
                                    <option key={state.value} value={state.value}>
                                        {state.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Ciudad/Municipio {errors.city && <span className="error-label">{errors.city}</span>}</label>
                            <select
                                name="city"
                                value={formData.city}
                                onChange={(e) => {
                                    setFormData({ ...formData, city: e.target.value });
                                    if (errors.city) setErrors({ ...errors, city: '' });
                                }}
                                className={`select-input ${errors.city ? 'select-error' : ''}`}
                                disabled={!formData.state}
                            >
                                {getCitiesByState(formData.state).map((city) => (
                                    <option key={city.value} value={city.value}>
                                        {city.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="button-group">
                            <Button
                                type="button"
                                variant="ghost"
                                size="large"
                                onClick={() => setStep(1)}
                            >
                                Atrás
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="large"
                                onClick={handleNextStep}
                            >
                                Siguiente
                            </Button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="form-step"
                    >
                        <h3>PIN de Seguridad</h3>
                        <p className="step-description">
                            Crea un PIN de 4-6 dígitos para autorizar tus transacciones
                        </p>

                        <Input
                            label="PIN"
                            type="password"
                            name="pin"
                            value={formData.pin}
                            onChange={handleChange}
                            error={errors.pin}
                            placeholder="••••"
                            maxLength={6}
                            required
                        />

                        <Input
                            label="Confirmar PIN"
                            type="password"
                            name="confirmPin"
                            value={formData.confirmPin}
                            onChange={handleChange}
                            error={errors.confirmPin}
                            placeholder="••••"
                            maxLength={6}
                            required
                        />

                        {errors.general && (
                            <div className="general-error" style={{ marginBottom: '1rem' }}>
                                ⚠️ {errors.general}
                            </div>
                        )}

                        <div className="button-group">
                            <Button
                                type="button"
                                variant="ghost"
                                size="large"
                                onClick={() => setStep(2)}
                            >
                                Atrás
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                size="large"
                                loading={loading}
                                disabled={loading}
                                onClick={handleSubmit}
                            >
                                Completar Registro
                            </Button>
                        </div>
                    </motion.div>
                )}
            </form>
        </motion.div>
    );
};

export default CompleteRegistration;
