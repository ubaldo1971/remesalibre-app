import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScanLine } from 'lucide-react';

const Pay = () => {
    const navigate = useNavigate();

    return (
        <div className="app-shell bg-black text-white">
            <header className="app-header !bg-transparent border-none absolute top-0 w-full z-20">
                <button onClick={() => navigate(-1)} className="menu-btn text-white bg-black/20 backdrop-blur-md rounded-full p-2.5 hover:bg-black/40 transition-all">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-10">
                    <span className="font-bold text-lg drop-shadow-md">Escanear QR</span>
                </div>
            </header>

            <main className="main-content flex flex-col items-center justify-center relative h-full">

                {/* CAMERA FEED PLACEHOLDER */}
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center overflow-hidden">
                    {/* Simulated Camera Feed Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-black opacity-50"></div>

                    <p className="text-white/40 font-bold tracking-widest text-xs uppercase z-10 absolute top-32">Buscando código...</p>

                    {/* Scan Overlay */}
                    <div className="absolute w-72 h-72 rounded-[32px] border-[3px] border-white/30 flex items-center justify-center relative shadow-[0_0_9999px_rgba(0,0,0,0.5)]">
                        {/* Corner Markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[var(--primary)] rounded-tl-3xl -mt-1 -ml-1"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[var(--primary)] rounded-tr-3xl -mt-1 -mr-1"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[var(--primary)] rounded-bl-3xl -mb-1 -ml-1"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[var(--primary)] rounded-br-3xl -mb-1 -mr-1"></div>

                        {/* Scanner Laser */}
                        <div className="w-[90%] h-0.5 bg-[var(--primary)] shadow-[0_0_20px_var(--primary)] animate-scan absolute"></div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-10 w-full px-8 flex justify-center gap-8 z-20">
                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white/20 transition-all">
                            <Smartphone size={24} className="text-white" />
                        </div>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">NFC</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                            <ScanLine size={32} />
                        </div>
                        <span className="text-xs font-bold text-white">Escanear</span>
                    </button>

                    <button className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md group-hover:bg-white/20 transition-all">
                            <span className="text-lg font-bold">#</span>
                        </div>
                        <span className="text-xs font-bold text-white/80 group-hover:text-white">Manual</span>
                    </button>
                </div>

            </main>
        </div>
    );
};

export default Pay;
