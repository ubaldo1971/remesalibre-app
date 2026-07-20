import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const TrustPrompt = () => {
    const navigate = useNavigate();

    return (
        <div className="app-shell bg-[var(--surface-1)] flex items-end sm:items-center justify-center relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 w-full h-64 bg-gradient-to-b from-[var(--primary)] to-transparent opacity-10"></div>
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-500 rounded-full blur-[100px] opacity-20"></div>

            <div className="w-full max-w-md bg-white rounded-t-[40px] sm:rounded-[32px] p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] sm:shadow-2xl animate-slide-up relative z-10">

                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors">
                    <X size={24} />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 rounded-[28px] bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-8 shadow-lg shadow-indigo-100 rotate-3 transform transition-transform hover:rotate-6">
                        <ShieldCheck size={48} />
                    </div>

                    <h2 className="text-3xl font-extrabold mb-4 text-[var(--text-main)] leading-tight">
                        Envía hasta $10,000 USD
                    </h2>

                    <p className="text-[var(--text-muted)] mb-10 leading-relaxed text-lg">
                        Para aumentar tus límites y proteger tu cuenta, necesitamos confirmar que eres tú. <span className="text-[var(--primary)] font-bold">Toma menos de 1 minuto.</span>
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={() => navigate('/flow/identity/document')}
                            className="btn btn-primary w-full text-lg h-16 shadow-xl shadow-indigo-200"
                        >
                            Verificar identidad ahora
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="h-12 w-full text-[var(--text-muted)] font-bold hover:text-[var(--text-main)] transition-colors"
                        >
                            Quizás más tarde
                        </button>
                    </div>

                    <p className="mt-8 text-xs text-[var(--text-light)] font-medium flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Tu información está encriptada y segura.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default TrustPrompt;
