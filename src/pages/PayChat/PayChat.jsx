import { useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { createPaychatApiClient } from '../../services/paychatApi';
import './PayChat.css';

const formatMoney = (minorUnits, currency = 'MXN') => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
}).format((minorUnits || 0) / 100);

const PayChat = () => {
    const token = useAuthStore(state => state.token);
    const sequence = useRef(0);
    const [sessionId, setSessionId] = useState(null);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingAction, setPendingAction] = useState(null);
    const [messages, setMessages] = useState([{
        id: 'welcome',
        role: 'assistant',
        text: 'Hola. Prueba escribiendo: “Paga 250 pesos a María por comida”.',
    }]);

    const client = useMemo(() => createPaychatApiClient({
        gatewayUrl: import.meta.env.VITE_PAYCHAT_API_URL || 'http://127.0.0.1:3001',
        coreApiUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
        getToken: () => token,
    }), [token]);

    const addMessage = message => {
        sequence.current += 1;
        setMessages(current => [...current, { id: `message-${sequence.current}`, ...message }]);
    };

    const requestPaychat = async payload => {
        setLoading(true);
        setError('');
        try {
            const response = await client.sendMessage(payload);
            setSessionId(response.sessionId);
            setPendingAction(response.action);
            addMessage({
                role: 'assistant',
                text: response.message,
                payment: response.payment,
                receipt: response.receipt,
                cancelled: response.cancelled,
            });
        } catch (requestError) {
            setError(requestError.message);
            addMessage({
                role: 'assistant',
                text: `No pude continuar: ${requestError.message}`,
                isError: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();
        const message = draft.trim();
        if (!message || loading || pendingAction) return;
        setDraft('');
        addMessage({ role: 'user', text: message });
        await requestPaychat({ message, ...(sessionId ? { sessionId } : {}) });
    };

    const handleAction = async action => {
        if (!sessionId || loading) return;
        addMessage({
            role: 'user',
            text: action === 'confirm' ? 'Confirmar simulación' : 'Cancelar operación',
        });
        setPendingAction(null);
        await requestPaychat({ sessionId, action });
    };

    const startOver = () => {
        setSessionId(null);
        setPendingAction(null);
        setError('');
        setMessages([{
            id: 'welcome-new',
            role: 'assistant',
            text: 'Nueva conversación. ¿Qué operación simulada quieres preparar?',
        }]);
    };

    return (
        <section className="paychat-page">
            <header className="paychat-header">
                <div className="paychat-brand">
                    <span className="paychat-logo" aria-hidden="true">P</span>
                    <div>
                        <span className="paychat-eyebrow">REMESALIBRE LABS</span>
                        <h1>PayChat</h1>
                        <p>Pagos conversacionales, con confirmación humana.</p>
                    </div>
                </div>
                <button type="button" className="paychat-reset" onClick={startOver}>
                    Nueva conversación
                </button>
            </header>

            <div className="paychat-simulation-banner" role="status">
                <span>🧪</span>
                <strong>SIMULACIÓN — NO ES DINERO REAL</strong>
                <span>No se modifican saldos ni se conecta una red bancaria.</span>
            </div>

            <div className="paychat-shell">
                <div className="paychat-messages" aria-live="polite">
                    {messages.map(message => (
                        <article key={message.id} className={`paychat-message paychat-message--${message.role} ${message.isError ? 'paychat-message--error' : ''}`}>
                            <span className="paychat-message__author">
                                {message.role === 'assistant' ? 'PayChat' : 'Tú'}
                            </span>
                            <p>{message.text}</p>

                            {message.payment && (
                                <div className="paychat-summary">
                                    <div>
                                        <span>Destinataria</span>
                                        <strong>{message.payment.recipient}</strong>
                                        <small>Tel. {message.payment.maskedPhone}</small>
                                    </div>
                                    <dl>
                                        <div><dt>Monto</dt><dd>{formatMoney(message.payment.amountInMinorUnits, message.payment.currency)}</dd></div>
                                        <div><dt>Concepto</dt><dd>{message.payment.concept}</dd></div>
                                        <div><dt>Comisión</dt><dd>{formatMoney(message.payment.feeInMinorUnits, message.payment.currency)}</dd></div>
                                    </dl>
                                    <span className="paychat-summary__stamp">OPERACIÓN SIMULADA</span>
                                </div>
                            )}

                            {message.receipt && (
                                <div className="paychat-receipt">
                                    <span>✓ Simulación completada</span>
                                    <strong>{message.receipt.folio}</strong>
                                    <small>Estado: {message.receipt.status}</small>
                                </div>
                            )}

                            {message.cancelled && (
                                <div className="paychat-cancelled">
                                    Estado: {message.cancelled.status}
                                </div>
                            )}
                        </article>
                    ))}

                    {loading && (
                        <div className="paychat-typing" aria-label="PayChat está procesando">
                            <span /> <span /> <span />
                        </div>
                    )}
                </div>

                {pendingAction?.type === 'confirm_payment' && (
                    <div className="paychat-confirmation" aria-label="Confirmación de operación simulada">
                        <div>
                            <strong>Tu confirmación es obligatoria</strong>
                            <span>PayChat no puede autorizar esta operación por ti.</span>
                        </div>
                        <div className="paychat-confirmation__actions">
                            <button type="button" className="paychat-button paychat-button--secondary" onClick={() => handleAction('cancel')} disabled={loading}>
                                Cancelar
                            </button>
                            <button type="button" className="paychat-button paychat-button--primary" onClick={() => handleAction('confirm')} disabled={loading}>
                                Confirmar simulación
                            </button>
                        </div>
                    </div>
                )}

                <form className="paychat-composer" onSubmit={handleSubmit}>
                    <label htmlFor="paychat-message">Escribe una instrucción</label>
                    <div>
                        <input
                            id="paychat-message"
                            value={draft}
                            onChange={event => setDraft(event.target.value)}
                            placeholder="Paga 250 pesos a María por comida"
                            disabled={loading || Boolean(pendingAction)}
                            autoComplete="off"
                        />
                        <button type="submit" disabled={!draft.trim() || loading || Boolean(pendingAction)} aria-label="Enviar mensaje">
                            →
                        </button>
                    </div>
                    <small>{error || 'PayChat interpreta; RemesaLibre valida y registra.'}</small>
                </form>
            </div>
        </section>
    );
};

export default PayChat;
