import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, Building2, Wallet } from 'lucide-react';

const PaymentMethod = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const flowState = location.state || {};
    const [selected, setSelected] = useState('debit-1');

    const handleContinue = () => {
        navigate('/flow/send/review', {
            state: {
                ...flowState,
                paymentMethod: { id: selected, name: 'Visa •••• 4242' }
            }
        });
    };

    const methods = [
        { id: 'debit-1', name: 'Visa •••• 4242', type: 'Débito', icon: CreditCard, fee: 'Gratis' },
        { id: 'apple', name: 'Apple Pay', type: 'Wallet', icon: Wallet, fee: 'Gratis' },
        { id: 'bank', name: 'Bank of America', type: 'ACH', icon: Building2, fee: 'Gratis (Lento)' },
    ];

    return (
        <div className="app-shell bg-white">
            <header className="app-header !bg-transparent border-none">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg">Método de pago</span>
                </div>
            </header>

            <main className="main-content px-6 pt-4 flex flex-col h-full">

                <div className="flex flex-col gap-4">
                    {methods.map(method => {
                        const isSelected = selected === method.id;
                        return (
                            <div
                                key={method.id}
                                onClick={() => setSelected(method.id)}
                                className={`
                                    card-clean w-full flex items-center gap-4 p-5 transition-all cursor-pointer relative overflow-hidden group
                                    ${isSelected
                                        ? 'border-[var(--primary)] ring-4 ring-indigo-50 bg-[var(--primary-light)]'
                                        : 'hover:border-gray-300 hover:bg-gray-50'}
                                `}
                            >
                                <div className={`
                                    p-3 rounded-xl transition-colors
                                    ${isSelected ? 'bg-[var(--primary)] text-white shadow-md' : 'bg-white text-[var(--text-muted)] border border-gray-100'}
                                `}>
                                    <method.icon size={24} />
                                </div>

                                <div className="flex-1">
                                    <p className={`font-bold text-lg transition-colors ${isSelected ? 'text-[var(--primary-dark)]' : 'text-[var(--text-main)]'}`}>
                                        {method.name}
                                    </p>
                                    <p className="text-sm text-[var(--text-muted)] font-medium mt-0.5">{method.type}</p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${isSelected ? 'bg-white/50 text-[var(--primary)]' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {method.fee}
                                    </div>
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                        ${isSelected ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-gray-300'}
                                    `}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pb-6">
                    <button
                        onClick={handleContinue}
                        className="btn btn-primary shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        Continuar
                    </button>
                </div>

            </main>
        </div>
    );
};

export default PaymentMethod;
