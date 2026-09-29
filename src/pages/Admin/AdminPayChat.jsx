import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { createPaychatApiClient } from '../../services/paychatApi';
import './AdminPayChat.css';

const formatMoney = quote => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: quote?.amount?.currency || 'MXN',
}).format((quote?.amount?.value || 0) / 100);

const AdminPayChat = () => {
    const navigate = useNavigate();
    const token = useAuthStore(state => state.token);
    const [intents, setIntents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const client = useMemo(() => createPaychatApiClient({
        gatewayUrl: import.meta.env.VITE_PAYCHAT_API_URL || 'http://127.0.0.1:3001',
        coreApiUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
        getToken: () => token,
    }), [token]);

    useEffect(() => {
        let active = true;
        client.listAdminPaymentIntents()
            .then(response => {
                if (active) setIntents(response.data || []);
            })
            .catch(requestError => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => { active = false; };
    }, [client, refreshKey]);

    const refresh = () => {
        setLoading(true);
        setError('');
        setRefreshKey(key => key + 1);
    };

    return (
        <section className="admin-paychat">
            <header className="admin-paychat__header">
                <div>
                    <span>PAYCHAT · AUDITORÍA LOCAL</span>
                    <h1>Payment intents</h1>
                    <p>Timeline append-only del Core simulado. No contiene movimientos de dinero real.</p>
                </div>
                <div className="admin-paychat__actions">
                    <button type="button" onClick={() => navigate('/paychat')}>Abrir PayChat</button>
                    <button type="button" onClick={refresh}>Actualizar</button>
                    <button type="button" onClick={() => navigate('/admin')}>Volver</button>
                </div>
            </header>

            <div className="admin-paychat__warning">
                <strong>🧪 SIMULACIÓN — NO ES DINERO REAL</strong>
                <span>El repositorio es efímero y se vacía al reiniciar el backend.</span>
            </div>

            {loading && <div className="admin-paychat__state">Cargando timeline…</div>}
            {error && <div className="admin-paychat__state admin-paychat__state--error">{error}</div>}
            {!loading && !error && intents.length === 0 && (
                <div className="admin-paychat__state">Todavía no hay payment intents simulados.</div>
            )}

            <div className="admin-paychat__grid">
                {intents.map(intent => (
                    <article key={intent.id} className="admin-paychat-card">
                        <div className="admin-paychat-card__top">
                            <div>
                                <span>{intent.id}</span>
                                <h2>{intent.recipient?.displayName || 'Beneficiario demo'}</h2>
                                <small>{intent.recipient?.maskedPhone}</small>
                            </div>
                            <span className={`admin-paychat-status admin-paychat-status--${intent.status?.toLowerCase()}`}>
                                {intent.status}
                            </span>
                        </div>

                        <div className="admin-paychat-card__amount">
                            <strong>{formatMoney(intent.quote)}</strong>
                            <span>Comisión {formatMoney({ amount: intent.quote?.fee })}</span>
                            <small>{intent.concept}</small>
                        </div>

                        <ol className="admin-paychat-timeline">
                            {(intent.events || []).map((event, index) => (
                                <li key={`${intent.id}-${index}-${event.type}`}>
                                    <span />
                                    <div>
                                        <strong>{event.type}</strong>
                                        <small>{event.actorId} · {new Date(event.occurredAt).toLocaleString('es-MX')}</small>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <footer>
                            <span>Canal: {intent.channel}</span>
                            <span>{intent.provider?.reference || 'Sin referencia de proveedor'}</span>
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default AdminPayChat;
