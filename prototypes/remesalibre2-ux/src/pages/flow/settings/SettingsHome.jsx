import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    User, Shield, CreditCard, Bell,
    BarChart, HelpCircle, FileText,
    ChevronRight, ArrowLeft, LogOut
} from 'lucide-react';

const SettingsHome = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Assuming useAuth provides user details

    const menuItems = [
        { icon: User, label: 'Perfil y Datos', path: '/flow/settings/profile', color: 'text-blue-500', bg: 'bg-blue-50' },
        { icon: Shield, label: 'Seguridad', path: '/flow/settings/security', color: 'text-green-500', bg: 'bg-green-50' },
        { icon: CreditCard, label: 'Métodos de Pago', path: '/flow/settings/payments', color: 'text-purple-500', bg: 'bg-purple-50' },
        { icon: Bell, label: 'Notificaciones', path: '/flow/settings/notifications', color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: BarChart, label: 'Límites y Nivel', path: '/flow/settings/limits', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { icon: HelpCircle, label: 'Ayuda y Soporte', path: '/flow/settings/help', color: 'text-pink-500', bg: 'bg-pink-50' },
        { icon: FileText, label: 'Legal y Cuenta', path: '/flow/settings/legal', color: 'text-gray-500', bg: 'bg-gray-50' },
    ];

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Configuración</span>
                </div>
            </header>

            <main className="main-content px-4 py-6">

                {/* User Profile Summary */}
                <div className="card-clean flex items-center gap-4 mb-8 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-[20px] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-200">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-xl text-[var(--text-main)]">{user?.name || 'Usuario'}</h2>
                        <p className="text-sm text-[var(--text-muted)] font-medium line-clamp-1">{user?.email || 'usuario@ejemplo.com'}</p>
                    </div>
                    <button onClick={() => navigate('/flow/settings/profile')} className="p-3 text-[var(--primary)] bg-[var(--primary-light)] hover:bg-indigo-100 rounded-xl transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 px-2">General</h3>

                {/* Menu Grid/List */}
                <div className="flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {menuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => navigate(item.path)}
                            className="card-clean p-4 flex items-center gap-4 hover:border-[var(--primary)] transition-all active:scale-[0.99] group cursor-pointer"
                        >
                            <div className={`w-11 h-11 rounded-xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                                <item.icon size={22} />
                            </div>
                            <span className="flex-1 text-left font-bold text-[var(--text-main)] text-base group-hover:text-[var(--primary)] transition-colors">
                                {item.label}
                            </span>
                            <ChevronRight size={18} className="text-gray-300 group-hover:text-[var(--primary)] transition-colors" />
                        </button>
                    ))}
                </div>

                <div className="mt-8 px-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={logout}
                        className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-2xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                    <p className="text-center text-[10px] text-gray-300 mt-6 font-mono">Vs. 2.0.1 (Native)</p>
                </div>

            </main>
        </div>
    );
};

export default SettingsHome;
