import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const facts = [
    "Tu dinero viaja seguro y encriptado.",
    "Verificamos cada transacción en tiempo real.",
    "RemesaLibre protege tus datos con seguridad bancaria.",
    "Estamos conectando con el banco de destino...",
    "Casi listo, finalizando detalles..."
];

const ProcessingScreen = ({ title = "Procesando...", initialMessage }) => {
    const [factIndex, setFactIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % facts.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 bg-[var(--primary)] text-white flex flex-col items-center justify-center p-8 z-50 text-center animate-fade-in">

            {/* Custom Loader */}
            <div className="relative mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <Loader2 className="text-[var(--primary)] animate-pulse" size={24} />
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-4">{title}</h2>

            <div className="h-16 flex items-center justify-center max-w-xs">
                <p className="text-white/80 animate-fade-in key={factIndex}">
                    {initialMessage || facts[factIndex]}
                </p>
            </div>

        </div>
    );
};

export default ProcessingScreen;
