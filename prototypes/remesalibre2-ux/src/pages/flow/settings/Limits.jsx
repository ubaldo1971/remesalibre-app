import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

const Limits = () => {
    const navigate = useNavigate();

    // Mock Tier Data
    const currentTier = 1;
    const tiers = [
        { level: 1, name: 'Básico', limit: '$1,000 USD', features: ['Envíos básicos', 'Retiro a cuenta propia'], active: true },
        { level: 2, name: 'Verificado', limit: '$10,000 USD', features: ['Envíos mayores', 'Pago de servicios'], active: false },
        { level: 3, name: 'Premium', limit: 'Sin Límite', features: ['Atención VIP', 'Cuentas multidivisa'], active: false },
    ];

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Límites y Nivel</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                <div className="mb-6 animate-fade-in-up">
                    <p className="text-sm text-[var(--text-muted)] text-center max-w-xs mx-auto">
                        Aumenta tus límites verificando tu identidad. Es rápido y gratuito.
                    </p>
                </div>

                <div className="flex flex-col gap-6 animate-fade-in-up">
                    {tiers.map((tier) => (
                        <div
                            key={tier.level}
                            className={`p-6 rounded-[24px] border-2 relative transition-all ${tier.active ? 'bg-white border-[var(--primary)] shadow-lg shadow-indigo-100' : 'bg-gray-50 border-transparent opacity-60 grayscale-[0.5]'}`}
                        >
                            {tier.active && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--primary)] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                    Nivel Actual
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--text-main)]">Nivel {tier.level}: {tier.name}</h3>
                                    <p className="text-2xl font-bold text-[var(--primary)] mt-1">{tier.limit}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">Límite Mensual</p>
                                </div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tier.active ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {tier.active ? <CheckCircle2 size={20} /> : <Lock size={20} />}
                                </div>
                            </div>

                            <ul className="space-y-2 mb-6">
                                {tier.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-main)]">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            {!tier.active && tier.level === currentTier + 1 && (
                                <button
                                    onClick={() => navigate('/flow/identity/trust')}
                                    className="w-full py-3 rounded-xl bg-[var(--text-main)] text-white font-bold text-sm shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck size={18} />
                                    Subir de Nivel
                                </button>
                            )}
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
};

export default Limits;
