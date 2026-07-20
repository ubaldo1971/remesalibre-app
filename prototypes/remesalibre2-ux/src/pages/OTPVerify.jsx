import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Timer } from 'lucide-react';

const OTPVerify = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const phone = searchParams.get('phone');
    const intent = searchParams.get('intent');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputs = useRef([]);

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.length > 0) {
            const newOtp = [...otp];
            pastedData.forEach((val, i) => {
                if (i < 6) newOtp[i] = val;
            });
            setOtp(newOtp);
            if (pastedData.length === 6) {
                inputs.current[5].focus();
                setTimeout(() => verifyAndRedirect(), 500);
            }
        }
    };

    const handleChange = (e, index) => {
        const val = e.target.value;
        if (isNaN(val)) return;

        const newOtp = [...otp];
        newOtp[index] = val.substring(val.length - 1);
        setOtp(newOtp);

        // Auto advance
        if (val && index < 5) {
            inputs.current[index + 1].focus();
        }

        // Auto submit if full
        if (index === 5 && val) {
            setTimeout(() => verifyAndRedirect(), 300);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const verifyAndRedirect = () => {
        // SIMULATED API CALL
        // In real app: check if user exists.
        // Scenario: Routing to Profile to simulate "New User" flow usually, 
        // or Home if existing. Let's send to Profile for demo purposes.
        navigate(`/auth/profile?intent=${intent}`);
    };

    return (
        <div className="app-shell bg-white">
            <header className="app-header !bg-transparent !backdrop-blur-none border-none">
                <button onClick={() => navigate(-1)} className="menu-btn">
                    <ArrowLeft size={24} />
                </button>
            </header>

            <main className="main-content px-6 pt-4">
                <div className="max-w-md mx-auto w-full pt-6">
                    {/* Security Icon */}
                    <div className="flex justify-center mb-8 animate-fade-in-up">
                        <div className="w-20 h-20 rounded-[24px] bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] shadow-lg shadow-indigo-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" /></svg>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-3 text-[var(--text-main)] animate-fade-in-up">Verifica tu número</h1>
                    <p className="text-center text-[var(--text-muted)] mb-10 text-lg leading-relaxed px-4 animate-fade-in-up">
                        Ingresa el código de 6 dígitos que enviamos al <br />
                        <span className="font-bold text-[var(--text-main)]">+1 {phone}</span>
                    </p>

                    <div className="flex justify-center items-center gap-3 mb-10 flex-nowrap animate-fade-in-up" onPaste={handlePaste} style={{ animationDelay: '0.1s' }}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={el => inputs.current[i] = el}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(e, i)}
                                onKeyDown={(e) => handleKeyDown(e, i)}
                                className="w-12 h-14 rounded-xl border-2 border-[var(--border)] text-center text-3xl font-bold outline-none focus:border-[var(--primary)] focus:-translate-y-1 focus:shadow-lg transition-all caret-transparent bg-white flex-none"
                            />
                        ))}
                    </div>

                    <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <button className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] bg-white border border-[var(--border)] px-5 py-3 rounded-full cursor-pointer hover:border-[var(--primary)] hover:text-[var(--primary)] transition-all shadow-sm">
                            <Timer size={16} /> Reenviar código en 30s
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default OTPVerify;
