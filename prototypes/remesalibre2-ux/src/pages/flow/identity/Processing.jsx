import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const Processing = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            // Success!
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
            setTimeout(() => navigate('/'), 3000); // Back to home after success
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="app-shell bg-[var(--surface-1)] flex flex-col items-center justify-center text-center p-8">

            <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg relative z-10">
                    <ShieldCheck size={48} className="text-[var(--primary)] animate-pulse" />
                </div>
                <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-[var(--text-main)]">
                Verificando información...
            </h2>
            <p className="text-[var(--text-muted)] max-w-xs mx-auto">
                Esto toma solo unos segundos gracias a nuestra tecnología segura.
            </p>

        </div>
    );
};

export default Processing;
