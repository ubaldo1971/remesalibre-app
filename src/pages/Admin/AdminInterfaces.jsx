import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './AdminInterfaces.css';

const interfaces = [
    {
        path: '/dashboard',
        icon: '🏠',
        title: 'Inicio y billetera',
        description: 'Resumen, saldos demo y accesos principales.',
    },
    {
        path: '/send',
        icon: '↗️',
        title: 'Enviar dinero',
        description: 'Flujo simulado de envío y cotización.',
    },
    {
        path: '/receive',
        icon: '📲',
        title: 'Recibir dinero',
        description: 'Solicitud de pago y recepción por QR.',
    },
    {
        path: '/cashout',
        icon: '🏧',
        title: 'Retirar fondos',
        description: 'Opciones demo para retiro y cash-out.',
    },
    {
        path: '/services',
        icon: '💡',
        title: 'Pago de servicios',
        description: 'Interfaz para explorar servicios disponibles.',
    },
    {
        path: '/transactions',
        icon: '📊',
        title: 'Actividad',
        description: 'Historial y estados de transacciones simuladas.',
    },
    {
        path: '/paychat',
        icon: '💬',
        title: 'PayChat',
        description: 'Recorrido conversacional simulado con confirmación explícita.',
    },
    {
        path: '/admin/paychat',
        icon: '🧪',
        title: 'Auditoría PayChat',
        description: 'Payment intents y eventos append-only del Core en memoria.',
    },
    {
        path: '/profile',
        icon: '👤',
        title: 'Perfil y seguridad',
        description: 'Preferencias, identidad demo y ajustes de cuenta.',
    },
    {
        path: '/raite-demo',
        icon: '🚗',
        title: 'Raite — pasajero',
        description: 'Prototipo independiente de integración logística.',
    },
];

const AdminInterfaces = () => {
    const navigate = useNavigate();
    const { user } = useAuthStore();

    return (
        <div className="admin-interfaces">
            <header className="admin-interfaces__header">
                <div>
                    <span className="admin-interfaces__eyebrow">MODO LOCAL DE PRUEBA</span>
                    <h1>Centro de interfaces</h1>
                    <p>Explora las áreas activas de RemesaLibre desde una sola vista.</p>
                </div>
                <div className="admin-interfaces__identity">
                    <span className="admin-interfaces__shield">🛡️</span>
                    <div>
                        <strong>{user?.firstName} {user?.lastName}</strong>
                        <span>Administrador demo</span>
                    </div>
                </div>
            </header>

            <section className="admin-interfaces__notice" aria-label="Aviso de seguridad">
                <span>🧪</span>
                <div>
                    <strong>Entorno demostrativo</strong>
                    <p>Estas pantallas no mueven dinero real. El visor histórico de datos permanece desactivado para proteger información local.</p>
                </div>
            </section>

            <main>
                <div className="admin-interfaces__section-heading">
                    <div>
                        <span>APLICACIÓN ACTIVA</span>
                        <h2>Selecciona una interfaz</h2>
                    </div>
                    <button type="button" onClick={() => navigate('/dashboard')}>
                        Ir al inicio
                    </button>
                </div>

                <div className="admin-interfaces__grid">
                    {interfaces.map((item) => (
                        <button
                            key={item.path}
                            type="button"
                            className="admin-interface-card"
                            onClick={() => navigate(item.path)}
                        >
                            <span className="admin-interface-card__icon">{item.icon}</span>
                            <span className="admin-interface-card__content">
                                <strong>{item.title}</strong>
                                <span>{item.description}</span>
                            </span>
                            <span className="admin-interface-card__arrow">→</span>
                        </button>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default AdminInterfaces;
