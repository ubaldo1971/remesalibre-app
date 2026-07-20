import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Plus, Trash2, Landmark } from 'lucide-react';

const PaymentMethods = () => {
    const navigate = useNavigate();

    // Mock Data
    const methods = [
        { id: 1, type: 'card', name: 'Visa **** 4242', bank: 'BBVA', isDefault: true, icon: CreditCard },
        { id: 2, type: 'bank', name: 'Cuenta CLABE', bank: 'Santander - 1234', isDefault: false, icon: Landmark },
    ];

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Métodos de Pago</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                <div className="mb-6 animate-fade-in-up">
                    <p className="text-sm text-[var(--text-muted)] mb-4 px-2">
                        Tus cuentas guardadas para enviar y retirar dinero.
                    </p>
                </div>

                <div className="flex flex-col gap-4 animate-fade-in-up">
                    {methods.map((method) => (
                        <div key={method.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[var(--primary)] flex items-center justify-center">
                                    <method.icon size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-[var(--text-main)]">{method.name}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-medium">{method.bank}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {method.isDefault && (
                                    <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-1 rounded-full">Default</span>
                                )}
                                <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <button className="bg-white border-2 border-dashed border-gray-200 p-4 rounded-2xl flex items-center justify-center gap-2 text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <Plus size={18} />
                        </div>
                        <span className="font-bold">Agregar nuevo método</span>
                    </button>
                </div>

            </main>
        </div>
    );
};

export default PaymentMethods;
