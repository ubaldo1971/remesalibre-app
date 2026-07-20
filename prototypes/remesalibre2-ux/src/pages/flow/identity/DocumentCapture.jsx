import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, CreditCard, FileText } from 'lucide-react';

const DocumentCapture = () => {
    const navigate = useNavigate();
    const [capturing, setCapturing] = useState(false);

    const startCapture = () => {
        setCapturing(true);
        // Simulate capture process
        setTimeout(() => {
            navigate('/flow/identity/selfie');
        }, 2000);
    };

    return (
        <div className="app-shell bg-black text-white">
            {/* Header Overlay */}
            <header className="absolute top-0 w-full z-20 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="font-bold text-sm text-white">Paso 1 de 2</span>
                </div>
                <div className="w-10"></div>
            </header>

            <main className="main-content flex flex-col h-full relative p-0 overflow-hidden">

                {/* INSTRUCTIONS */}
                <div className="absolute top-24 w-full text-center z-20 px-8">
                    <h2 className="text-2xl font-bold mb-2 text-white drop-shadow-md">Toma una foto de tu ID</h2>
                    <p className="text-white/80 text-sm drop-shadow-sm">
                        Asegúrate de que se vea clara y sin reflejos.
                    </p>
                </div>

                {/* CAMERA FEED SIMULATION */}
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center w-full h-full">
                    {/* Video Feed Placeholder */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=2787&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black opacity-80"></div>

                    {/* Card Frame */}
                    <div className="relative w-[85%] aspect-[1.58] border-[3px] border-white/80 rounded-2xl shadow-[0_0_9999px_rgba(0,0,0,0.8)] z-10 transition-all duration-300">
                        {capturing && (
                            <div className="absolute inset-0 bg-white/10 animate-pulse">
                                <div className="absolute top-0 w-full h-1 bg-green-400 shadow-[0_0_20px_#4ade80] animate-scan"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg text-white font-bold text-sm">Escaneando...</span>
                                </div>
                            </div>
                        )}

                        {/* Corner Guides */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl"></div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="absolute bottom-0 w-full p-8 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent z-20 flex flex-col items-center gap-6">

                    <div className="flex gap-4 p-1.5 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/10">
                        <button className="px-6 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-md">Frente</button>
                        <button className="px-6 py-2 rounded-xl text-white/60 font-bold text-xs hover:text-white">Reverso</button>
                    </div>

                    <button
                        onClick={startCapture}
                        disabled={capturing}
                        className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95 ${capturing ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <div className="w-14 h-14 bg-white rounded-full shadow-inner"></div>
                    </button>
                </div>

            </main>
        </div>
    );
};

export default DocumentCapture;
