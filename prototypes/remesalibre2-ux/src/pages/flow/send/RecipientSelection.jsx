import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, User, ChevronRight } from 'lucide-react';

const MOCK_RECIPIENTS = [
    { id: 1, name: 'Mamá', detail: 'BBVA •••• 1234' },
    { id: 2, name: 'Hermano', detail: 'Retiro Oxxo' },
];

const RecipientSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const flowState = location.state || {}; // Preserve amount

    const selectRecipient = (recipient) => {
        navigate('/flow/send/payment', { state: { ...flowState, recipient } });
    };

    return (
        <div className="app-shell bg-white">
            <header className="app-header !bg-transparent border-none">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg">¿A quién envías?</span>
                </div>
            </header>

            <main className="main-content px-6 pt-4">

                {/* NEW RECIPIENT CARD */}
                <button
                    onClick={() => selectRecipient({ id: 'new', name: 'Nuevo Destinatario', detail: 'Cuenta Nueva' })}
                    className="card-clean w-full flex items-center gap-4 mb-8 shadow-sm hover:shadow-md transition-all group border-dashed border-2 border-[var(--border)] bg-transparent hover:bg-white/50"
                >
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="font-bold text-[var(--primary)] text-lg">Nuevo destinatario</p>
                        <p className="text-xs text-[var(--text-muted)] font-medium">Cuenta bancaria, tarjeta o efectivo</p>
                    </div>
                    <div className="bg-white p-2 rounded-full text-[var(--text-muted)] shadow-sm">
                        <ChevronRight size={20} />
                    </div>
                </button>

                <h3 className="font-bold text-[var(--text-secondary)] text-sm uppercase tracking-wider mb-4 flex items-center gap-2 opacity-80 pl-2">
                    Recientes
                </h3>

                <div className="flex flex-col gap-3">
                    {MOCK_RECIPIENTS.map(rec => (
                        <button
                            key={rec.id}
                            onClick={() => selectRecipient(rec)}
                            className="card-clean w-full flex items-center gap-4 p-5 hover:border-[var(--primary)] cursor-pointer transition-all active:scale-[0.98] group"
                        >
                            <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] flex items-center justify-center font-bold text-xl border border-white shadow-sm group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                                {rec.name.charAt(0)}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-bold text-[var(--text-main)] text-lg group-hover:text-[var(--primary)] transition-colors">{rec.name}</p>
                                <p className="text-sm text-[var(--text-muted)] mt-0.5 font-medium">{rec.detail}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--primary)]" />
                        </button>
                    ))}
                </div>

            </main>
        </div>
    );
};

export default RecipientSelection;
