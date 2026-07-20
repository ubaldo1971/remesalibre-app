import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, RotateCcw, Home, MessageSquare } from 'lucide-react';

const ErrorScreen = ({
    title = 'Algo salió mal',
    message = 'No pudimos completar tu solicitud. Por favor, inténtalo de nuevo.',
    action,
    onRetry,
    code
}) => {
    const navigate = useNavigate();

    return (
        <div className="app-shell bg-white flex flex-col items-center justify-center p-8 text-center animate-fade-in">

            <div className="w-24 h-24 rounded-[32px] bg-red-50 text-red-500 flex items-center justify-center mb-8 shadow-xl shadow-red-100 rotate-3">
                <AlertOctagon size={48} />
            </div>

            <h1 className="text-3xl font-extrabold text-[var(--text-main)] mb-4">
                {title}
            </h1>

            <p className="text-[var(--text-muted)] leading-relaxed mb-10 max-w-xs mx-auto text-lg">
                {message}
            </p>

            {code && (
                <div className="mb-10 px-4 py-2 bg-[var(--surface-2)] rounded-full text-xs font-mono text-[var(--text-muted)] border border-[var(--border)]">
                    Código: {code}
                </div>
            )}

            <div className="w-full space-y-4 max-w-xs">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="btn btn-primary flex items-center justify-center gap-2"
                    >
                        <RotateCcw size={18} /> Reintentar
                    </button>
                )}

                <button
                    onClick={() => navigate('/')}
                    className="btn btn-secondary flex items-center justify-center gap-2"
                >
                    <Home size={18} /> Volver al Inicio
                </button>

                <button className="w-full text-[var(--primary)] font-bold text-sm py-3 flex items-center justify-center gap-2 hover:bg-[var(--primary-light)] rounded-xl transition-colors">
                    <MessageSquare size={16} /> Contactar Soporte
                </button>
            </div>

        </div>
    );
};

export default ErrorScreen;
