import React, { useState, useEffect } from 'react';
import { ShieldCheck, Zap, Globe, ArrowRight, TrendingUp, LogIn, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [rate, setRate] = useState(19.42);

    // Simulate "Live" Rate
    useEffect(() => {
        const interval = setInterval(() => {
            setRate(prev => +(prev + (Math.random() * 0.02 - 0.01)).toFixed(2));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSendMoney = () => {
        if (isAuthenticated) {
            navigate('/flow/send/amount');
        } else {
            navigate('/auth/login?intent=send');
        }
    };

    const handleReceiveMoney = () => {
        if (isAuthenticated) {
            navigate('/flow/receive/link');
        } else {
            navigate('/auth/login?intent=receive');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute top-1/2 -left-32 w-64 h-64 bg-gradient-to-br from-green-400/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-gradient-to-br from-red-400/10 to-rose-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UyZThmMCIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none"></div>

            {/* HEADER */}
            <header className="relative z-20 px-6 py-4">
                <div className="max-w-md mx-auto flex items-center justify-end">

                    <div className="flex gap-2">
                        {isAuthenticated ? (
                            <button
                                onClick={logout}
                                className="p-2.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-all hover:scale-105 shadow-sm"
                            >
                                <span className="sr-only">Salir</span>
                                <LogIn size={20} className="rotate-180" />
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/auth/login')}
                                className="px-5 py-2.5 rounded-full bg-white text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all hover:-translate-y-0.5"
                            >
                                Iniciar sesión
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="relative z-10 px-6 pt-6 pb-24">
                <div className="max-w-md mx-auto">

                    {/* HERO Section */}
                    <section className="text-center mb-10">
                        {isAuthenticated ? (
                            <>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 text-xs font-bold mb-6 tracking-wide uppercase border border-emerald-200/50 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Cuenta Verificada
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-black text-slate-800 mb-4 leading-tight tracking-tight">
                                    Hola, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.name?.split(' ')[0] || 'Amigo'}</span>
                                </h1>
                                <p className="text-lg text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    Tu dinero está seguro y listo para enviarse a toda Latinoamérica.
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Logo Hero - Centered and Large */}
                                <div className="flex justify-center mb-8 animate-fade-in">
                                    <img
                                        src="/logo-remesalibre.png"
                                        alt="RemesaLibre - Envío de dinero seguro"
                                        className="h-24 sm:h-32 w-auto drop-shadow-lg"
                                    />
                                </div>

                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-600 text-xs font-bold mb-6 tracking-wide uppercase border border-blue-200/50 shadow-sm animate-fade-in">
                                    <Sparkles size={14} className="text-blue-500" />
                                    Sin comisiones ocultas
                                </div>

                                {/* Main Title */}
                                <h1 className="text-4xl sm:text-5xl font-black text-slate-800 mb-5 leading-[1.1] tracking-tight animate-fade-in-up">
                                    Envía dinero<br />
                                    <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                        a tu familia
                                    </span>
                                </h1>

                                {/* Subtitle */}
                                <p className="text-lg sm:text-xl text-slate-500 max-w-sm mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                    La forma más <span className="font-semibold text-slate-700">rápida</span>, <span className="font-semibold text-slate-700">segura</span> y <span className="font-semibold text-slate-700">económica</span> de conectar finanzas.
                                </p>
                            </>
                        )}
                    </section>

                    {/* RATE CARD - Premium Glass Design */}
                    <section className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                        <div className="relative group">
                            {/* Glow effect on hover */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500"></div>

                            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/60 shadow-xl shadow-slate-200/50 flex items-center justify-between overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl"></div>

                                <div className="flex flex-col relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de cambio en vivo</span>
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-bold text-slate-600">$1 <span className="text-lg text-slate-400 font-medium">USD</span></span>
                                        <ArrowRight size={18} className="text-slate-300" />
                                        <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">${rate} <span className="text-xl text-slate-500 font-medium">MXN</span></span>
                                    </div>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                    <TrendingUp size={26} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ACTION BUTTONS */}
                    <section className="flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button
                            onClick={handleSendMoney}
                            className="relative group w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-bold text-lg shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            <span className="relative z-10">{isAuthenticated ? 'Enviar dinero ahora' : 'Enviar dinero a México'}</span>
                            <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={handleReceiveMoney}
                            className="w-full h-16 rounded-2xl bg-white text-slate-700 font-bold text-lg border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
                        >
                            Recibir Dinero
                        </button>
                    </section>

                    {/* FEATURES (Only for visitors) */}
                    {!isAuthenticated && (
                        <section className="mt-12 grid grid-cols-3 gap-4 text-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 hover:border-blue-200 hover:bg-white transition-all hover:-translate-y-1 cursor-default">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">100% Seguro</span>
                                    <span className="text-[10px] text-slate-400">Encriptado</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 hover:border-violet-200 hover:bg-white transition-all hover:-translate-y-1 cursor-default">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 text-violet-600">
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">Instantáneo</span>
                                    <span className="text-[10px] text-slate-400">En minutos</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all hover:-translate-y-1 cursor-default">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 text-emerald-600">
                                    <Star size={24} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-700 block">Mejor Tasa</span>
                                    <span className="text-[10px] text-slate-400">Garantizado</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Trust Indicators */}
                    {!isAuthenticated && (
                        <div className="mt-10 text-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <p className="text-xs text-slate-400 mb-3 font-medium">Más de 50,000 familias confían en nosotros</p>
                            <div className="flex items-center justify-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                                ))}
                                <span className="ml-2 text-sm font-bold text-slate-600">4.9</span>
                                <span className="text-xs text-slate-400 ml-1">(2,847 reseñas)</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* FOOTER */}
            <footer className="fixed bottom-0 w-full py-4 text-center bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm">
                <p className="text-[11px] text-slate-400 font-medium">
                    © 2026 RemesaLibre Inc. · <a href="#" className="hover:text-blue-600 transition-colors">Términos</a> · <a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a>
                </p>
            </footer>
        </div>
    );
}

export default Home;
