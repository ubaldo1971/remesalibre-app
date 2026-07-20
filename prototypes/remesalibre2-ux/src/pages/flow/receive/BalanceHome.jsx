import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { txnService } from '../../../services/txn.service';
import { ArrowDownLeft, ArrowUpRight, Smartphone, LogOut, Eye, EyeOff, Loader2 } from 'lucide-react';

const BalanceHome = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showBalance, setShowBalance] = useState(true);
    const [balance, setBalance] = useState(0);
    const [recentTx, setRecentTx] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const [balRes, histRes] = await Promise.all([
                txnService.getBalance(),
                txnService.getHistory()
            ]);

            if (balRes.data !== null) setBalance(balRes.data);
            if (histRes.data) setRecentTx(histRes.data.slice(0, 5));
            setLoading(false);
        };
        loadData();
    }, []);

    return (
        <div className="app-shell bg-[var(--surface-1)]">
            {/* HEADER */}
            <header className="app-header !bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div onClick={() => navigate('/flow/settings')} className="brand-container cursor-pointer">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--primary)] to-purple-500 text-white flex items-center justify-center font-bold shadow-md">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Bienvenido</span>
                        <span className="font-bold text-sm text-[var(--text-main)] leading-none">{user?.name || 'Usuario'}</span>
                    </div>
                </div>
                <button onClick={logout} className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-400 transition-colors">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="main-content px-6 pt-6">

                {/* BALANCE CARD */}
                <div className="w-full bg-gradient-to-br from-[var(--primary)] to-[#4338ca] text-white rounded-[32px] p-8 shadow-xl shadow-indigo-200 mb-8 relative overflow-hidden group">
                    {/* Decorative Blobs */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Saldo Disponible</span>
                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                className="text-indigo-200 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full backdrop-blur-sm"
                            >
                                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>

                        <div className="flex items-baseline gap-1 mb-8">
                            <span className="text-5xl font-bold tracking-tight">
                                {loading ? (
                                    <div className="h-12 w-32 bg-white/20 animate-pulse rounded-lg"></div>
                                ) : (
                                    showBalance ? `$${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '••••••'
                                )}
                            </span>
                            <span className="text-lg font-bold text-indigo-200">MXN</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/flow/receive/withdraw')}
                                className="flex items-center justify-center gap-2 py-3.5 bg-white text-[var(--primary)] rounded-2xl font-bold shadow-lg shadow-black/5 active:scale-95 transition-all hover:bg-indigo-50"
                            >
                                <ArrowDownLeft size={20} className="text-indigo-600" /> Retirar
                            </button>
                            <button
                                onClick={() => navigate('/flow/receive/pay')}
                                className="flex items-center justify-center gap-2 py-3.5 bg-white/10 text-white border border-white/20 rounded-2xl font-bold backdrop-blur-md active:scale-95 transition-all hover:bg-white/20"
                            >
                                <Smartphone size={20} /> Pagar
                            </button>
                        </div>
                    </div>
                </div>

                {/* MOVEMENTS */}
                <div className="flex justify-between items-end mb-4 px-2">
                    <h3 className="font-bold text-[var(--text-main)] text-lg">Movimientos</h3>
                    <button onClick={() => navigate('/flow/receive/history')} className="text-xs font-bold text-[var(--primary)] bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                        Ver todos
                    </button>
                </div>

                <div className="flex flex-col gap-3 pb-8">
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="bg-white p-4 rounded-[20px] flex items-center gap-4 border border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 bg-gray-100 animate-pulse rounded"></div>
                                    <div className="h-3 w-20 bg-gray-100 animate-pulse rounded"></div>
                                </div>
                            </div>
                        ))
                    ) : recentTx.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-muted)] bg-white rounded-[20px] border border-gray-100 border-dashed">
                            No tienes movimientos recientes.
                        </div>
                    ) : (
                        recentTx.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-[20px] flex items-center gap-4 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-gray-100 hover:shadow-md transition-shadow">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center shadow-sm
                                    ${tx.type === 'received' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}
                                `}>
                                    {tx.type === 'received' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-[var(--text-main)] text-sm">{tx.recipient || tx.sender || tx.type}</p>
                                    <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">
                                        {new Date(tx.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className={`font-bold block ${tx.type === 'received' ? 'text-green-600' : 'text-[var(--text-main)]'}`}>
                                        {tx.type === 'received' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('es-MX')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </main>
        </div>
    );
};

export default BalanceHome;
