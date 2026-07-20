import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const AmountInput = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [converted, setConverted] = useState('0.00');
    const [loading, setLoading] = useState(false);
    const RATE = 19.42;

    useEffect(() => {
        if (!amount) {
            setConverted('0.00');
            return;
        }

        setLoading(true);
        // Simulate calc delay for "real feel"
        const timer = setTimeout(() => {
            const val = parseFloat(amount);
            setConverted((val * RATE).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [amount]);

    return (
        <div className="app-shell bg-white">
            <style>{`
                /* Hide Spinner for Number Input */
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .cursor-blink {
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink { 50% { opacity: 0; } }
            `}</style>

            <header className="app-header !bg-transparent border-none">
                <button onClick={() => navigate('/')} className="menu-btn hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="w-8"></div>
            </header>

            <main className="main-content px-6 flex flex-col items-center pt-4">

                {/* HEADLINE */}
                <h1 className="text-xl font-bold text-[var(--text-secondary)] mb-10 text-center animate-fade-in-up uppercase tracking-wide opacity-80">
                    ¿Cuánto quieres enviar?
                </h1>

                {/* BIG INPUT AREA */}
                <div className="w-full relative flex flex-col items-center mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    <div className="relative flex items-center justify-center">
                        <span className={`text-4xl font-bold transition-colors ${amount ? 'text-[var(--text-main)]' : 'text-gray-300'} mr-2`}>$</span>
                        <input
                            type="number"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full max-w-[240px] text-center text-7xl font-extrabold outline-none placeholder-gray-200 caret-[var(--primary)] bg-transparent z-10 p-0 m-0 tracking-tighter"
                            autoFocus
                        />
                        <span className={`text-xl font-bold transition-colors ${amount ? 'text-[var(--text-main)]' : 'text-gray-300'} mt-4`}>USD</span>
                    </div>

                    {/* FLAGS & RATE */}
                    <div className="flex items-center gap-2 mt-6 bg-white px-4 py-2 rounded-full border border-[var(--border)] shadow-sm">
                        <span className="text-xl">🇺🇸</span>
                        <ArrowLeft size={14} className="rotate-180 text-gray-400" />
                        <span className="text-xl">🇲🇽</span>
                        <div className="w-px h-4 bg-gray-200 mx-1"></div>
                        <span className="text-xs font-bold text-[var(--text-secondary)]">1 USD = {RATE} MXN</span>
                    </div>

                </div>

                {/* CONVERSION DISPLAY CARD */}
                <div className="card-clean w-full mb-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wider">Ellos reciben</span>
                        {loading && <RefreshCw size={14} className="text-[var(--primary)] animate-spin" />}
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold tracking-tight transition-colors duration-300 ${loading ? 'text-gray-300' : 'text-[var(--primary)]'}`}>
                            ${converted}
                        </span>
                        <span className="text-lg font-bold text-[var(--text-muted)]">MXN</span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-emerald-600">
                        <span className="bg-emerald-50 p-1 rounded-full"><RefreshCw size={12} /></span>
                        <p className="text-xs font-bold">Sin comisiones • Llega hoy</p>
                    </div>
                </div>

                {/* CTA */}
                <div className="w-full mt-6 mb-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <button
                        onClick={() => navigate('/flow/send/recipient', { state: { amount, converted } })}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className={`
                            btn btn-primary
                            ${(!amount || parseFloat(amount) <= 0) ? 'opacity-50 cursor-not-allowed shadow-none' : ''}
                        `}
                    >
                        Continuar
                    </button>
                </div>

            </main>
        </div>
    );
};

export default AmountInput;
