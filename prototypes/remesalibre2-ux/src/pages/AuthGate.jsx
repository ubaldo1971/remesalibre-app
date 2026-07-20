import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Check, X } from 'lucide-react';

const COUNTRIES = [
    { code: '+1', flag: '🇺🇸', name: 'Estados Unidos' },
    { code: '+52', flag: '🇲🇽', name: 'México' },
    { code: '+1', flag: '🇨🇦', name: 'Canadá' },
    { code: '+57', flag: '🇨🇴', name: 'Colombia' },
    { code: '+51', flag: '🇵🇪', name: 'Perú' },
    { code: '+54', flag: '🇦🇷', name: 'Argentina' },
    { code: '+56', flag: '🇨🇱', name: 'Chile' },
    { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
    { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
    { code: '+502', flag: '🇬🇹', name: 'Guatemala' },
    { code: '+503', flag: '🇸🇻', name: 'El Salvador' },
    { code: '+504', flag: '🇭🇳', name: 'Honduras' },
];

const AuthGate = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [searchParams] = useSearchParams();
    const intent = searchParams.get('intent') || 'home';

    const handleContinue = () => {
        if (phoneNumber.length > 5) {
            navigate(`/auth/otp?phone=${selectedCountry.code}${phoneNumber}&intent=${intent}`);
        }
    };

    const selectCountry = (country) => {
        setSelectedCountry(country);
        setShowCountryPicker(false);
    };

    return (
        <div className="app-shell bg-white">
            {/* HEADER */}
            <header className="app-header !bg-transparent !backdrop-blur-none border-none">
                <button onClick={() => navigate(-1)} className="menu-btn">
                    <ArrowLeft size={24} />
                </button>
            </header>

            <main className="main-content px-6 pt-4">
                <div className="max-w-md mx-auto w-full pt-6">
                    {/* LOGO HERO - Minimalist */}
                    <div className="flex justify-center mb-8 animate-fade-in-up">
                        <div className="w-20 h-20 rounded-[24px] bg-[var(--primary)] flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <div className="text-4xl font-extrabold tracking-tighter">R</div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-extrabold text-center mb-3 text-[var(--text-main)] animate-fade-in-up">Bienvenido</h1>
                    <p className="text-center text-[var(--text-muted)] mb-10 text-lg leading-relaxed px-4 animate-fade-in-up">
                        Ingresa tu número para acceder a tu cuenta segura.
                    </p>

                    {/* PHONE INPUT BLOCK */}
                    <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider pl-1">
                            Número de Celular
                        </label>

                        <div className="flex gap-3">
                            {/* Country Code Selector */}
                            <button
                                onClick={() => setShowCountryPicker(true)}
                                className="h-16 px-4 rounded-2xl border-2 border-[var(--border)] bg-white flex items-center justify-center gap-2 font-bold shadow-sm min-w-[120px] hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all cursor-pointer group"
                            >
                                <span className="text-2xl">{selectedCountry.flag}</span>
                                <span className="text-lg text-[var(--text-main)]">{selectedCountry.code}</span>
                                <ChevronDown size={18} className="text-[var(--text-light)] group-hover:text-[var(--primary)]" />
                            </button>

                            {/* Phone Input */}
                            <input
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                placeholder="555 123 4567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                className="flex-1 h-16 rounded-2xl border-2 border-[var(--border)] px-5 text-2xl font-bold outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-light)] transition-all shadow-sm placeholder:text-gray-300 placeholder:font-normal bg-white"
                            />
                        </div>

                        {/* Phone Preview */}
                        {phoneNumber && (
                            <div className="text-center text-sm text-[var(--text-muted)] mt-2 animate-fade-in">
                                Número completo: <span className="font-bold text-[var(--text-main)]">{selectedCountry.code} {phoneNumber}</span>
                            </div>
                        )}
                    </div>

                    {/* ACTION */}
                    <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={handleContinue}
                            disabled={phoneNumber.length < 7}
                            className={`btn btn-primary w-full h-16 text-lg ${phoneNumber.length < 7 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Continuar
                        </button>
                    </div>

                    <p className="text-xs text-center text-[var(--text-muted)] mt-6 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        Al continuar, aceptas nuestros <a href="#" className="underline font-medium">Términos</a> y <a href="#" className="underline font-medium">Política de Privacidad</a>.
                    </p>
                </div>
            </main>

            {/* COUNTRY PICKER MODAL */}
            {showCountryPicker && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in">
                    <div className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[24px] p-6 pb-8 max-h-[70vh] flex flex-col animate-slide-up shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-[var(--text-main)]">Selecciona tu país</h3>
                            <button
                                onClick={() => setShowCountryPicker(false)}
                                className="p-2 rounded-xl hover:bg-gray-100 text-[var(--text-muted)] transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Country List */}
                        <div className="flex-1 overflow-y-auto -mx-2">
                            {COUNTRIES.map((country, index) => (
                                <button
                                    key={index}
                                    onClick={() => selectCountry(country)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer mx-2 ${selectedCountry.code === country.code && selectedCountry.flag === country.flag
                                            ? 'bg-[var(--primary-light)] border-2 border-[var(--primary)]'
                                            : 'hover:bg-gray-50 border-2 border-transparent'
                                        }`}
                                    style={{ width: 'calc(100% - 16px)' }}
                                >
                                    <span className="text-3xl">{country.flag}</span>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-[var(--text-main)]">{country.name}</p>
                                        <p className="text-sm text-[var(--text-muted)]">{country.code}</p>
                                    </div>
                                    {selectedCountry.code === country.code && selectedCountry.flag === country.flag && (
                                        <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center">
                                            <Check size={18} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthGate;
