import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Smartphone, Key, Lock, LogOut } from 'lucide-react';

const Security = () => {
    const navigate = useNavigate();
    const [biometrics, setBiometrics] = useState(true);

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Seguridad</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                <div className="flex flex-col items-center mb-8 animate-fade-in-up">
                    <div className="w-20 h-20 rounded-3xl bg-green-50 text-green-500 flex items-center justify-center mb-4 shadow-sm rotate-3">
                        <Shield size={40} />
                    </div>
                    <h2 className="font-bold text-xl text-[var(--text-main)]">Tu cuenta está segura</h2>
                    <p className="text-sm text-[var(--text-muted)]">Último acceso: Hoy, 10:23 AM</p>
                </div>

                <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    <div className="bg-white p-4 rounded-2xl flex items-center justify-between border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[var(--primary)] flex items-center justify-center">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-[var(--text-main)]">FaceID / Huella</p>
                                <p className="text-xs text-[var(--text-muted)]">Ingreso rápido</p>
                            </div>
                        </div>
                        <div
                            onClick={() => setBiometrics(!biometrics)}
                            className={`w-12 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors ${biometrics ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${biometrics ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <button className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm hover:border-[var(--primary)] transition-colors group text-left">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                            <Key size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Cambiar Contraseña</p>
                            <p className="text-xs text-[var(--text-muted)]">Se requiere tu contraseña actual</p>
                        </div>
                    </button>

                    <button className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm hover:border-[var(--primary)] transition-colors group text-left">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors">Dispositivos Vinculados</p>
                            <p className="text-xs text-[var(--text-muted)]">iPhone 13, Windows PC</p>
                        </div>
                    </button>

                </div>

                <div className="mt-8 px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-4">Acciones de Cuenta</h3>
                    <button className="w-full py-4 text-red-500 font-bold bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <LogOut size={20} />
                        Cerrar todas las sesiones
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                        Si notas actividad sospechosa, cierra todas las sesiones inmediatamente y contacta a soporte.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default Security;
