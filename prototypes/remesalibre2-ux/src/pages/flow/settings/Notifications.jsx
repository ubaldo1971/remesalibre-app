import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();

    // Mock State
    const [push, setPush] = useState(true);
    const [email, setEmail] = useState(true);
    const [sms, setSms] = useState(false);
    const [promos, setPromos] = useState(false);

    const Toggle = ({ checked, onChange }) => (
        <div
            onClick={() => onChange(!checked)}
            className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </div>
    );

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Notificaciones</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                <div className="flex flex-col gap-3 animate-fade-in-up">
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 px-2">Canales</h3>

                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)]">Push (App)</p>
                                <p className="text-xs text-[var(--text-muted)]">Alertas instantáneas</p>
                            </div>
                        </div>
                        <Toggle checked={push} onChange={setPush} />
                    </div>

                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)]">Correo Electrónico</p>
                                <p className="text-xs text-[var(--text-muted)]">Resúmenes y recibos</p>
                            </div>
                        </div>
                        <Toggle checked={email} onChange={setEmail} />
                    </div>

                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)]">SMS</p>
                                <p className="text-xs text-[var(--text-muted)]">Seguridad crítica</p>
                            </div>
                        </div>
                        <Toggle checked={sms} onChange={setSms} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 mt-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 px-2">Tipos de Aviso</h3>

                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                                <Bell size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)]">Promociones y Novedades</p>
                                <p className="text-xs text-[var(--text-muted)]">Ofertas especiales</p>
                            </div>
                        </div>
                        <Toggle checked={promos} onChange={setPromos} />
                    </div>
                </div>

            </main>
        </div>
    );
};

export default Notifications;
