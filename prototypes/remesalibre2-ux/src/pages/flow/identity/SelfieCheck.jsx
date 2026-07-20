import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Smile } from 'lucide-react';

const SelfieCheck = () => {
    const navigate = useNavigate();
    const [capturing, setCapturing] = useState(false);

    const startSelfie = () => {
        setCapturing(true);
        setTimeout(() => {
            navigate('/flow/identity/processing');
        }, 2000);
    };

    return (
        <div className="app-shell bg-white">
            <header className="app-header !bg-transparent border-none">
                <button onClick={() => navigate(-1)} className="menu-btn hover:bg-gray-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <span className="font-bold text-lg">Prueba de vida</span>
                </div>
            </header>

            <main className="main-content px-6 pt-4 flex flex-col items-center">

                <div className="text-center mb-8 animate-fade-in-up">
                    <h2 className="text-2xl font-bold mb-2 text-[var(--text-main)]">Solo una selfie más...</h2>
                    <p className="text-[var(--text-muted)] max-w-sm mx-auto">
                        Mueve tu cabeza ligeramente en círculos para confirmar que eres una persona real.
                    </p>
                </div>

                <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    {/* Camera Frame */}
                    <div className="w-72 h-72 rounded-full border-[6px] border-[var(--primary)] bg-gray-100 relative overflow-hidden shadow-2xl shadow-indigo-200">
                        {capturing ? (
                            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                {/* Success/Scanning Animation */}
                                <div className="absolute inset-0 border-4 border-green-400 rounded-full animate-ping opacity-50"></div>
                                <Smile size={80} className="text-white relative z-10 animate-bounce" />
                                <div className="absolute inset-0 bg-green-500/20 z-0"></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                <Smile size={80} />
                                <p className="text-sm font-bold mt-4">Tu cara aquí</p>
                            </div>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 whitespace-nowrap">
                        <div className={`w-2.5 h-2.5 rounded-full ${capturing ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-bold text-gray-600">{capturing ? 'Verificando...' : 'Esperando rostro'}</span>
                    </div>
                </div>

                <div className="w-full py-6 mt-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={startSelfie}
                        disabled={capturing}
                        className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-[0.98] 
                        ${capturing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[var(--primary)] text-white shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'}`}
                    >
                        {capturing ? 'Procesando...' : 'Estoy listo'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4">
                        Solo usaremos esto para verificar tu identidad.
                    </p>
                </div>

            </main>
        </div>
    );
};

export default SelfieCheck;
