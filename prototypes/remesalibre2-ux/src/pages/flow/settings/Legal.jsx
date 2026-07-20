import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Globe, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const Legal = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Legal y Cuenta</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                <div className="flex flex-col gap-3 mb-8 animate-fade-in-up">
                    <button className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-left">
                        <FileText size={20} className="text-gray-400" />
                        <span className="flex-1 font-bold text-[var(--text-main)]">Términos y Condiciones</span>
                    </button>
                    <button className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-left">
                        <FileText size={20} className="text-gray-400" />
                        <span className="flex-1 font-bold text-[var(--text-main)]">Política de Privacidad</span>
                    </button>
                    <button className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors text-left">
                        <Globe size={20} className="text-gray-400" />
                        <span className="flex-1 font-bold text-[var(--text-main)]">Licencias</span>
                    </button>
                </div>

                <div className="mt-8 px-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xs font-bold text-red-400 uppercase mb-4">Zona de Peligro</h3>
                    <button className="w-full py-4 text-red-500 font-bold bg-white border border-red-100 rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm">
                        <Trash2 size={20} />
                        Eliminar Cuenta
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
                        Esta acción es irreversible. Perderás todo tu historial y saldo no retirado.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default Legal;
