import React, { useState } from 'react';
import { raiteService } from '../../services/raite.service';

const PassengerDemo = () => {
    const [activeTab, setActiveTab] = useState('register');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // State for forms
    const [user, setUser] = useState({
        phone: '',
        name: '',
        email: '',
        currentBalance: null
    });

    const [topup, setTopup] = useState({
        amount: '',
        method: 'card',
        cardLast4: '4242'
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await raiteService.registerUser({
                phone_number: user.phone,
                full_name: user.name,
                email: user.email
            });

            setUser(prev => ({
                ...prev,
                currentBalance: result.wallet.balance_mxn
            }));
            setSuccess(`✅ Usuario registrado/encontrado. ID: ${result.user.id}`);
            setActiveTab('topup');
        } catch (err) {
            setError(err.error || err.message || 'Error al registrar');
        } finally {
            setLoading(false);
        }
    };

    const handleTopup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await raiteService.topUpWallet({
                phone_number: user.phone,
                amount: parseFloat(topup.amount),
                currency: 'MXN',
                payment_method: topup.method,
                card_last4: topup.method === 'card' ? topup.cardLast4 : undefined
            });

            setUser(prev => ({
                ...prev,
                currentBalance: result.new_balance.mxn
            }));
            setSuccess(`✅ Recarga exitosa. Nuevo saldo: $${result.new_balance.mxn} MXN`);
        } catch (err) {
            setError(err.error || err.message || 'Error en recarga');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-indigo-600">🚖 Raite Pasajero Demo</h1>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white mb-8 shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-purple-100 text-sm font-medium uppercase">Mi Saldo (Wallet)</p>
                        <h2 className="text-4xl font-bold mt-1">
                            {user.currentBalance !== null
                                ? `$${user.currentBalance.toFixed(2)}`
                                : '---'}
                            <span className="text-lg font-normal ml-2">MXN</span>
                        </h2>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                </div>
                {user.phone && (
                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
                        <span>Usuario: {user.name}</span>
                        <span className="font-mono">{user.phone}</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'register'
                            ? 'border-b-2 border-indigo-500 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('register')}
                >
                    1. Registro
                </button>
                <button
                    className={`py-2 px-4 font-medium transition-colors ${activeTab === 'topup'
                            ? 'border-b-2 border-indigo-500 text-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setActiveTab('topup')}
                >
                    2. Recargar Saldo
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {success}
                </div>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Número Celular (con +52)</label>
                        <input
                            type="text"
                            required
                            placeholder="+521..."
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={user.phone}
                            onChange={e => setUser({ ...user, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input
                            type="text"
                            required
                            placeholder="Juan Pérez"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={user.name}
                            onChange={e => setUser({ ...user, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                        <input
                            type="email"
                            placeholder="juan@email.com"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={user.email}
                            onChange={e => setUser({ ...user, email: e.target.value })}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Registrando...' : 'Continuar'}
                    </button>
                </form>
            )}

            {/* Topup Form */}
            {activeTab === 'topup' && (
                <form onSubmit={handleTopup} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm mb-4">
                        Simula una recarga de saldo como lo haría un usuario real en la app.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto a Recargar (MXN)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                min="10"
                                max="10000"
                                required
                                className="w-full pl-8 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                value={topup.amount}
                                onChange={e => setTopup({ ...topup, amount: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={topup.method}
                            onChange={e => setTopup({ ...topup, method: e.target.value })}
                        >
                            <option value="card">Tarjeta de Débito/Crédito</option>
                            <option value="spei">Transferencia SPEI</option>
                            <option value="oxxo">OXXO Pay</option>
                        </select>
                    </div>

                    {topup.method === 'card' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Terminación Tarjeta</label>
                            <input
                                type="text"
                                readOnly
                                className="w-full p-2 bg-gray-100 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
                                value="**** **** **** 4242 (Simulado)"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !user.phone}
                        className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded hover:bg-green-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : `Recargar $${topup.amount || '0'} MXN`}
                    </button>
                </form>
            )}
        </div>
    );
};

export default PassengerDemo;
