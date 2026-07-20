import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Check } from 'lucide-react';
import confetti from 'canvas-confetti'; // Optional visual treat, using CSS for now if package missing

const Success = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, converted, recipient } = location.state || {};

    useEffect(() => {
        // Fire confetti
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#a855f7', '#10b981']
        });
    }, []);

    return (
        <div className="app-shell bg-white flex flex-col items-center justify-center p-8 text-center">

            <div className="w-24 h-24 rounded-[32px] bg-emerald-50 text-emerald-500 flex items-center justify-center mb-8 shadow-xl shadow-emerald-100 animate-bounce-short">
                <Check size={48} strokeWidth={3} />
            </div>

            <h1 className="text-3xl font-extrabold mb-3 text-[var(--text-main)]">¡Envío Exitoso!</h1>
            <p className="text-[var(--text-muted)] text-lg mb-10 leading-relaxed">
                Tu dinero ya va en camino a <br /> <strong className="text-[var(--text-main)]">{recipient?.name}</strong>.
            </p>

            <div className="card-clean w-full mb-10 text-left">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wider mb-1">Enviaste</p>
                        <p className="text-2xl font-extrabold text-[var(--text-main)]">${amount} <span className="text-sm font-bold text-[var(--text-muted)]">USD</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">🇺🇸</div>
                </div>

                <div className="flex justify-between items-center pt-4">
                    <div>
                        <p className="text-xs font-bold text-[var(--text-light)] uppercase tracking-wider mb-1">Reciben</p>
                        <p className="text-2xl font-extrabold text-[var(--primary)]">${converted} <span className="text-sm font-bold text-[var(--text-muted)]">MXN</span></p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">🇲🇽</div>
                </div>
            </div>

            <div className="flex flex-col w-full gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="btn btn-primary"
                >
                    Volver al Inicio
                </button>

                <button
                    onClick={() => navigate('/flow/send/amount')}
                    className="btn btn-secondary border-none text-[var(--primary)]"
                >
                    Enviar otro
                </button>
            </div>

        </div>
    );
};

export default Success;
