import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { txnService } from '../../../services/txn.service';

const Review = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { amount, converted, recipient, paymentMethod } = location.state || {};
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fallback if accessed directly
    if (!amount) {
        return <div className="p-10 text-center">Faltan datos... <button onClick={() => navigate('/')} className="underline text-[var(--primary)]">Volver</button></div>;
    }

    const handleConfirm = async () => {
        setIsSubmitting(true);

        const { data, error } = await txnService.sendMoney(parseFloat(amount), recipient);

        if (error) {
            // Navigate to Error Screen with context
            navigate('/feedback/error', {
                state: {
                    title: error.title || 'No pudimos completar el envío',
                    message: error.message || error,
                    code: error.code || 'TXN_FAILED',
                    action: 'retry'
                }
            });
            return;
        }

        // Wait a bit to show success state if needed, or navigate immediately
        navigate('/flow/send/success', { state: location.state });
    };

    if (isSubmitting) {
        return (
            <div className="app-shell flex flex-col items-center justify-center p-8 bg-[var(--primary)] text-white text-center">
                <div className="w-24 h-24 mb-6 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                <h2 className="text-2xl font-bold mb-2 animate-pulse">Enviando dinero...</h2>
                <p className="text-white/80">Procesando tu pago de forma segura con {paymentMethod?.name}.</p>
            </div>
        );
    }

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-transparent border-none">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-white rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg">Revisar y Enviar</span>
                </div>
            </header>

            <main className="main-content px-6 pt-2 pb-8">

                {/* RECEIPT CARD */}
                <div className="card-clean mb-6 relative overflow-hidden p-0 border-0 shadow-float">
                    {/* Header */}
                    <div className="bg-[var(--primary)] p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
                        <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-1">Total a pagar</p>
                        <p className="text-4xl font-extrabold tracking-tight">${amount} <span className="text-xl text-blue-200 font-semibold">USD</span></p>
                    </div>

                    <div className="p-6">
                        {/* Timeline */}
                        <div className="flex flex-col gap-6 relative pl-2">
                            {/* Line */}
                            <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-[var(--border)]"></div>

                            {/* Step 1 */}
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-white border-[4px] border-[var(--primary)] shadow-sm flex-shrink-0"></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Tipo de cambio</p>
                                    <p className="text-base font-bold text-[var(--text-main)]">1.00 USD = 19.42 MXN</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-6 h-6 rounded-full bg-white border-[4px] border-[var(--primary)] shadow-sm flex-shrink-0"></div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Comisión</p>
                                        <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">Gratis</span>
                                    </div>
                                    <p className="text-base font-bold text-[var(--text-main)]">$0.00 USD</p>
                                </div>
                            </div>
                        </div>

                        {/* Recipient Box */}
                        <div className="mt-8 bg-[var(--bg-app)] rounded-xl p-5 border border-[var(--border)]">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Ellos reciben</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-extrabold text-[var(--text-main)]">${converted}</p>
                                <span className="text-sm font-bold text-[var(--text-secondary)]">MXN</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-emerald-600">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <p className="text-[10px] font-bold uppercase tracking-wide">Depósito inmediato</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RECIPIENT & METHOD DETAILS - COMPACT */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--border)] flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-light)] uppercase">Para</span>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--surface-2)] flex items-center justify-center font-bold text-[var(--text-secondary)]">
                                {recipient?.name?.charAt(0)}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm text-[var(--text-main)] truncate">{recipient?.name}</p>
                                <p className="text-[10px] text-[var(--text-muted)] truncate">{recipient?.detail}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-sm border border-[var(--border)] flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-[var(--text-light)] uppercase">Pago</span>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[var(--primary)]">
                                <Check size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-sm text-[var(--text-main)]">{paymentMethod?.name?.split(' ')[0]}</p>
                                <p className="text-[10px] text-[var(--text-muted)]">•••• 4242</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="btn btn-primary shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                    {isSubmitting ? 'Procesando...' : 'Enviar dinero ahora'}
                    {!isSubmitting && <ArrowRight size={20} />}
                </button>

                <p className="text-center text-[10px] text-[var(--text-muted)] mt-6 px-4 leading-relaxed opacity-70">
                    Al tocar "Enviar dinero ahora", aceptas nuestros Términos de Servicio. Las transacciones son seguras y monitoreadas 24/7.
                </p>

            </main>
        </div>
    );
};

export default Review;
