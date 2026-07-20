import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ArrowLeft, Camera, Check, User, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Local state for edits
    const [name, setName] = useState(user?.name || 'Usuario');
    const [phone, setPhone] = useState(user?.phone || '+52 55 1234 5678');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            navigate(-1);
        }, 1500);
    };

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg text-[var(--text-main)]">Mi Perfil</span>
                </div>
            </header>

            <main className="main-content px-4 py-8">

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10 animate-fade-in-up">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-[28px] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-4xl shadow-xl shadow-indigo-200 border-4 border-white">
                            {name?.charAt(0) || 'U'}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2.5 bg-white text-[var(--text-main)] rounded-xl shadow-lg border border-[var(--border)] hover:scale-110 transition-transform">
                            <Camera size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    <div className="settings-field-group">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 ml-1">Nombre Completo</label>
                        <div className="relative">
                            <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-[var(--text-main)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="settings-field-group">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 ml-1">Correo Electrónico</label>
                        <div className="relative">
                            <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="email"
                                value={user?.email || 'usuario@ejemplo.com'}
                                disabled
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-500 font-medium cursor-not-allowed"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Verificado</span>
                        </div>
                    </div>

                    <div className="settings-field-group">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 ml-1">Teléfono</label>
                        <div className="relative">
                            <Phone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-[var(--text-main)] transition-all"
                            />
                        </div>
                    </div>

                    <div className="settings-field-group opacity-50">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-1 ml-1">Dirección <span className="text-[10px] text-[var(--primary)]">(Próximamente)</span></label>
                        <div className="relative">
                            <MapPin size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value="CDMX, México"
                                disabled
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border border-transparent text-gray-400 font-medium cursor-not-allowed"
                            />
                        </div>
                    </div>

                </div>

                {/* Save Button */}
                <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary w-full h-14 flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={24} className="animate-spin" /> Guardando...
                            </>
                        ) : (
                            <>
                                <Check size={24} /> Guardar cambios
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        La información sensible puede requerir verificación adicional.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default Profile;
