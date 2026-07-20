import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, HelpCircle, ChevronDown, Mail } from 'lucide-react';

const Help = () => {
    const navigate = useNavigate();
    const [openItem, setOpenItem] = useState(null);

    const faqs = [
        { q: '¿Cuánto tiempo tarda un envío?', a: 'La mayoría de los envíos son instantáneos. Si es a una cuenta bancaria, puede tardar hasta 10 minutos.' },
        { q: '¿Cuál es el costo por transacción?', a: 'El primer envío es gratis. Después, cobramos una comisión fija de $1 USD, sin importar el monto.' },
        { q: '¿Cómo verifico mi identidad?', a: 'Ve a "Límites y Nivel" y sigue los pasos. Necesitarás tu INE o Pasaporte vigente.' },
        { q: '¿Es seguro usar RemesaLibre?', a: 'Sí. Usamos encriptación bancaria y no guardamos tus datos financieros sensibles.' },
    ];

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Ayuda</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                {/* Contact Actions */}
                <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-in-up">
                    <button className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[var(--primary)] hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MessageCircle size={24} />
                        </div>
                        <span className="font-bold text-[var(--text-main)]">Chat en vivo</span>
                    </button>
                    <button className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-3 hover:border-[var(--primary)] hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail size={24} />
                        </div>
                        <span className="font-bold text-[var(--text-main)]">Enviar Correo</span>
                    </button>
                </div>

                {/* FAQ */}
                <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 px-2 animate-fade-in-up">Preguntas Frecuentes</h3>

                <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {faqs.map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all">
                            <button
                                onClick={() => setOpenItem(openItem === i ? null : i)}
                                className="w-full flex items-center justify-between p-4 text-left font-bold text-[var(--text-main)]"
                            >
                                {item.q}
                                <ChevronDown size={20} className={`text-gray-400 transition-transform ${openItem === i ? 'rotate-180' : ''}`} />
                            </button>
                            {openItem === i && (
                                <div className="px-4 pb-4 text-sm text-[var(--text-muted)] leading-relaxed border-t border-gray-50 pt-3">
                                    {item.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
};

export default Help;
