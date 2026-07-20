import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, CreditCard, Banknote } from 'lucide-react';

const Withdraw = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Method, 2: Amount
    const [method, setMethod] = useState(null);
    const [amount, setAmount] = useState('');

    const methods = [
        { id: 'bank', name: 'Cuenta Bancaria', desc: 'SPEI (Minutos)', icon: Landmark },
        { id: 'card', name: 'A mi Tarjeta', desc: 'Visa/Mastercard', icon: CreditCard },
        { id: 'cash', name: 'Retiro sin Tarjeta', desc: 'Cajero Automático', icon: Banknote },
    ];

    const handleWithdraw = () => {
        // Navigate home with success toast (simulated)
        // Ideally show a success screen, but for now alert + redirect
        alert(`Solicitud de retiro de $${amount} procesada`);
        navigate('/flow/receive/balance');
    };

    return (
        <div className="app-shell bg-white">
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
            `}</style>

            <header className="app-header !bg-transparent border-none">
                <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="menu-btn hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg">{step === 1 ? 'Retirar dinero' : 'Monto a retirar'}</span>
                </div>
            </header>

            <main className="main-content px-6 pt-4">

                {step === 1 && (
                    <>
                        <h2 className="text-xl font-bold mb-2 text-center text-[var(--text-secondary)] uppercase tracking-wide opacity-80">¿A dónde enviamos tu dinero?</h2>
                        <p className="text-center text-[var(--text-muted)] mb-8">Selecciona tu método de retiro preferido.</p>
                        <div className="flex flex-col gap-4 animate-fade-in-up">
                            {methods.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => { setMethod(m); setStep(2); }}
                                    className="card-clean flex items-center gap-4 p-5 hover:border-[var(--primary)] transition-all group text-left cursor-pointer"
                                >
                                    <div className="w-14 h-14 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-white transition-colors shadow-sm">
                                        <m.icon size={26} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-lg text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">{m.name}</p>
                                        <p className="text-sm text-[var(--text-muted)] font-medium">{m.desc}</p>
                                    </div>
                                    <div className="text-gray-300 group-hover:text-[var(--primary)]">
                                        <ArrowLeft size={20} className="rotate-180" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {step === 2 && (
                    <div className="flex flex-col items-center pt-8 animate-fade-in-up">
                        <div className="flex items-center gap-2 bg-[var(--primary-light)] px-4 py-2 rounded-full mb-10 shadow-sm">
                            <method.icon size={16} className="text-[var(--primary)]" />
                            <span className="font-bold text-[var(--primary)] text-sm">{method.name}</span>
                        </div>

                        <div className="w-full relative flex flex-col items-center mb-12">
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
                                <span className={`text-xl font-bold transition-colors ${amount ? 'text-[var(--text-main)]' : 'text-gray-300'} mt-4 ml-2`}>MXN</span>
                            </div>
                            <p className="text-[var(--text-muted)] text-sm mt-6 font-bold bg-[var(--surface-2)] px-4 py-2 rounded-full">Disponible: $5,200.50</p>
                        </div>

                        <button
                            onClick={handleWithdraw}
                            disabled={!amount}
                            className={`btn btn-primary ${!amount ? 'opacity-50 cursor-not-allowed shadow-none' : ''}`}
                        >
                            Confirmar Retiro
                        </button>
                    </div>
                )}

            </main>
        </div>
    );
};

export default Withdraw;
