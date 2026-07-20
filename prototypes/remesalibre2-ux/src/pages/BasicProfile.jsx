import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Check, ArrowLeft, Loader2 } from 'lucide-react';
import InlineError from '../components/ui/Feedback/InlineError';

const BasicProfile = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [searchParams] = useSearchParams();
    const intent = searchParams.get('intent');

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleFinish = async () => {
        const newErrors = {};
        if (!firstName.trim()) newErrors.firstName = 'Ingresa tu nombre';
        if (!lastName.trim()) newErrors.lastName = 'Ingresa tu apellido';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        const fullName = `${firstName} ${lastName}`.trim();
        const userData = { name: fullName, email: email || `${firstName.toLowerCase()}@remesa.app` };

        const { success } = await register(userData);
        setLoading(false);

        if (success) {
            // Deep linking logic:
            if (intent === 'send') {
                navigate('/flow/send/amount');
            } else if (intent === 'receive') {
                navigate('/flow/receive/balance');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <div className="app-shell bg-white">
            <header className="app-header !bg-transparent !backdrop-blur-none border-none">
                <button onClick={() => navigate(-1)} className="menu-btn">
                    <ArrowLeft size={24} />
                </button>
            </header>

            <main className="main-content px-6 pt-4">
                <div className="max-w-md mx-auto w-full pt-6">
                    <div className="mb-8 animate-fade-in-up text-center">
                        <div className="inline-flex p-4 rounded-[24px] bg-[var(--primary-light)] text-[var(--primary)] mb-6 shadow-lg shadow-indigo-100">
                            <User size={36} />
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text-main)] mb-3">Unos detalles más</h1>
                        <p className="text-[var(--text-muted)] text-lg leading-relaxed px-4">
                            Para cumplir con regulaciones y mantener tu dinero seguro, necesitamos tu nombre legal.
                        </p>
                    </div>

                    <form className="flex flex-col gap-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }} onSubmit={(e) => { e.preventDefault(); handleFinish(); }}>
                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Nombre(s)</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => { setFirstName(e.target.value); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }}
                                placeholder="Ej. Alejandro"
                                className={`w-full h-14 rounded-[16px] border px-4 text-lg outline-none focus:border-[var(--primary)] transition-colors ${errors.firstName ? 'border-red-300 bg-red-50/50' : 'border-[var(--border)]'}`}
                            />
                            <InlineError message={errors.firstName} visible={!!errors.firstName} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Apellido(s)</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => { setLastName(e.target.value); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }}
                                placeholder="Ej. García"
                                className={`w-full h-14 rounded-[16px] border px-4 text-lg outline-none focus:border-[var(--primary)] transition-colors ${errors.lastName ? 'border-red-300 bg-red-50/50' : 'border-[var(--border)]'}`}
                            />
                            <InlineError message={errors.lastName} visible={!!errors.lastName} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Correo Electrónico (Opcional)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="alex@ejemplo.com"
                                className="w-full h-14 rounded-[16px] border border-[var(--border)] px-4 text-lg outline-none focus:border-[var(--primary)]"
                            />
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" /> Creando cuenta...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} /> Crear Cuenta
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default BasicProfile;
