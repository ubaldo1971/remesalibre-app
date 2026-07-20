// Placeholder pages for main app functionality
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';

export const SendMoney = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                }}
            >
                ← Volver
            </button>
            <Card>
                <h2 style={{ marginBottom: '1rem' }}>Enviar Dinero</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                    Ingresa el monto en USD y selecciona el destinatario
                </p>
                <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 'bold', fontSize: '2rem', textAlign: 'center' }}>
                        100.00 USD
                    </p>
                    <p style={{ color: 'var(--success)', textAlign: 'center', fontSize: '1.2rem' }}>
                        ≈ 1,750.00 MXN
                    </p>
                </div>
                <Button variant="primary" fullWidth>
                    Continuar
                </Button>
            </Card>
        </div>
    );
};

export const ReceiveMoney = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                }}
            >
                ← Volver
            </button>
            <Card style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '1rem' }}>Recibir Dinero</h2>
                <div style={{
                    width: '200px',
                    height: '200px',
                    margin: '2rem auto',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-xl)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <span style={{ fontSize: '4rem' }}>📱</span>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Comparte este código QR para recibir pagos
                </p>
                <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
                    Código: REF-45782
                </p>
            </Card>
        </div>
    );
};

export const CashOut = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    marginBottom: '1rem',
                }}
            >
                ← Volver
            </button>
            <h2 style={{ marginBottom: '1.5rem' }}>Retirar Efectivo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Card hoverable>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>🏦</span>
                        <div>
                            <h3>SPEI (Transferencia Bancaria)</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                2-24 horas
                            </p>
                        </div>
                    </div>
                </Card>
                <Card hoverable>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>🏪</span>
                        <div>
                            <h3>OXXO</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Retiro inmediato
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const Transactions = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Historial de Transacciones</h2>
            <Card>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No hay transacciones para mostrar
                </p>
            </Card>
        </div>
    );
};

export const TransactionDetail = () => {
    const navigate = useNavigate();
    return (
        <div style={{ padding: '2rem' }}>
            <button onClick={() => navigate('/transactions')}>← Volver</button>
            <h2>Detalle de Transacción</h2>
        </div>
    );
};

export const Profile = () => {
    const navigate = useNavigate();
    const { logout, user, updateUser } = useAuthStore();
    const { theme, toggleTheme, soundEnabled, toggleSound } = useUIStore();

    // State for modals/sections
    const [showEditModal, setShowEditModal] = React.useState(false);
    const [showSecurityModal, setShowSecurityModal] = React.useState(false);
    const [showNotificationsModal, setShowNotificationsModal] = React.useState(false);
    const [showHelpModal, setShowHelpModal] = React.useState(false);

    // Edit form state
    const [editForm, setEditForm] = React.useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || user?.phone || ''
    });

    // Notification preferences
    const [notifications, setNotifications] = React.useState({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        transactionAlerts: true,
        promotions: false
    });

    const handleLogout = () => {
        logout();
        navigate('/welcome');
    };

    // Get user initials for avatar fallback
    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        return '👤';
    };

    // Get display name
    const getDisplayName = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName} ${user.lastName}`;
        }
        if (user?.firstName) {
            return user.firstName;
        }
        return 'Usuario Demo';
    };

    const handleSaveProfile = () => {
        if (updateUser) {
            updateUser(editForm);
        }
        setShowEditModal(false);
        alert('Perfil actualizado correctamente ✅');
    };

    // Modal styles
    const modalOverlay = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem'
    };
    const modalContent = {
        backgroundColor: 'var(--bg-primary)', borderRadius: '1rem',
        padding: '1.5rem', maxWidth: '400px', width: '100%', maxHeight: '80vh', overflowY: 'auto'
    };
    const inputStyle = {
        width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
        border: '1px solid var(--border-color)', marginBottom: '1rem',
        fontSize: '1rem', backgroundColor: 'var(--bg-primary)'
    };
    const toggleRow = {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'
    };

    return (
        <div style={{ padding: '2rem', minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Mi Perfil</h2>
            <Card>
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                    {/* Avatar Section */}
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0bb8a8 0%, #06d6a0 50%, #00b4d8 100%)',
                        margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: user?.picture ? '3rem' : '2.5rem', color: 'white', fontWeight: 'bold',
                        boxShadow: '0 8px 24px rgba(11, 184, 168, 0.4)',
                        border: '4px solid rgba(255, 255, 255, 0.3)', overflow: 'hidden',
                    }}>
                        {user?.picture ? (
                            typeof user.picture === 'string' && user.picture.startsWith('http') ? (
                                <img src={user.picture} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (<span>{user.picture}</span>)
                        ) : (<span>{getInitials()}</span>)}
                    </div>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{getDisplayName()}</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {user?.phoneNumber || user?.phone || '+52 123 456 7890'}
                    </p>
                    {user?.email && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{user.email}</p>}
                </div>
            </Card>

            {/* App Preferences */}
            <Card style={{ marginTop: '1.5rem' }}>
                <div style={{ padding: '0.75rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0' }}>⚙️ Preferencias</h4>

                    <div style={toggleRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 500 }}>Modo {theme === 'dark' ? 'Noche' : 'Día'}</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cambiar apariencia</p>
                            </div>
                        </div>
                        <div onClick={toggleTheme} style={{
                            width: '44px', height: '24px',
                            background: theme === 'dark' ? 'var(--primary-teal)' : 'var(--bg-tertiary)',
                            borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                        }}>
                            <div style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px', left: theme === 'dark' ? '22px' : '2px', transition: 'all 0.3s'
                            }} />
                        </div>
                    </div>

                    <div style={{ ...toggleRow, borderBottom: 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.2rem' }}>{soundEnabled ? '🔊' : '🔇'}</span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 500 }}>Sonidos de interfaz</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Efectos al interactuar</p>
                            </div>
                        </div>
                        <div onClick={toggleSound} style={{
                            width: '44px', height: '24px',
                            background: soundEnabled ? 'var(--primary-teal)' : 'var(--bg-tertiary)',
                            borderRadius: '99px', position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                        }}>
                            <div style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px', left: soundEnabled ? '22px' : '2px', transition: 'all 0.3s'
                            }} />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Profile Options */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Card hoverable style={{ cursor: 'pointer' }} onClick={() => setShowEditModal(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📝</span>
                        <div>
                            <h4 style={{ margin: 0 }}>Editar Perfil</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Cambiar foto, nombre y datos</p>
                        </div>
                    </div>
                </Card>
                <Card hoverable style={{ cursor: 'pointer' }} onClick={() => setShowSecurityModal(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔒</span>
                        <div>
                            <h4 style={{ margin: 0 }}>Seguridad</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>PIN, contraseña y 2FA</p>
                        </div>
                    </div>
                </Card>
                <Card hoverable style={{ cursor: 'pointer' }} onClick={() => setShowNotificationsModal(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔔</span>
                        <div>
                            <h4 style={{ margin: 0 }}>Notificaciones</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Alertas y mensajes</p>
                        </div>
                    </div>
                </Card>
                <Card hoverable style={{ cursor: 'pointer' }} onClick={() => setShowHelpModal(true)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>❓</span>
                        <div>
                            <h4 style={{ margin: 0 }}>Ayuda</h4>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Soporte y preguntas frecuentes</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <Button variant="danger" fullWidth onClick={handleLogout}>Cerrar Sesión</Button>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div style={modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div style={modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>📝 Editar Perfil</h3>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nombre</label>
                        <input style={inputStyle} value={editForm.firstName}
                            onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="Nombre" />
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Apellido</label>
                        <input style={inputStyle} value={editForm.lastName}
                            onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Apellido" />
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input style={inputStyle} type="email" value={editForm.email}
                            onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Teléfono</label>
                        <div style={{ display: 'flex', marginBottom: '1rem' }}>
                            <span style={{ padding: '0.75rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRight: 'none', borderRadius: '0.5rem 0 0 0.5rem', fontWeight: '600', color: 'var(--text-secondary)' }}>+52 1</span>
                            <input style={{ ...inputStyle, borderRadius: '0 0.5rem 0.5rem 0', marginBottom: 0, flex: 1 }} value={editForm.phoneNumber}
                                onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} placeholder="5512345678" maxLength={10} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <Button variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>Cancelar</Button>
                            <Button variant="primary" fullWidth onClick={handleSaveProfile}>Guardar</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Modal */}
            {showSecurityModal && (
                <div style={modalOverlay} onClick={() => setShowSecurityModal(false)}>
                    <div style={modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>🔒 Seguridad</h3>
                        <Card hoverable style={{ cursor: 'pointer', marginBottom: '0.75rem' }} onClick={() => navigate('/setup-pin')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🔢</span>
                                <div><h4 style={{ margin: 0 }}>Cambiar PIN</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Actualizar tu PIN de 6 dígitos</p></div>
                            </div>
                        </Card>
                        <Card hoverable style={{ cursor: 'pointer', marginBottom: '0.75rem' }} onClick={() => navigate('/2fa-setup')}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>📱</span>
                                <div><h4 style={{ margin: 0 }}>Autenticación 2FA</h4>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Configurar autenticador</p></div>
                            </div>
                        </Card>
                        <Card style={{ marginBottom: '0.75rem' }}>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>🛡️ Sesiones activas</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>1 dispositivo activo</p>
                            </div>
                        </Card>
                        <Button variant="secondary" fullWidth onClick={() => setShowSecurityModal(false)}>Cerrar</Button>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {showNotificationsModal && (
                <div style={modalOverlay} onClick={() => setShowNotificationsModal(false)}>
                    <div style={modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>🔔 Notificaciones</h3>
                        <div style={toggleRow}>
                            <span>Notificaciones Push</span>
                            <input type="checkbox" checked={notifications.pushEnabled}
                                onChange={e => setNotifications({ ...notifications, pushEnabled: e.target.checked })} />
                        </div>
                        <div style={toggleRow}>
                            <span>Alertas por Email</span>
                            <input type="checkbox" checked={notifications.emailEnabled}
                                onChange={e => setNotifications({ ...notifications, emailEnabled: e.target.checked })} />
                        </div>
                        <div style={toggleRow}>
                            <span>Alertas por SMS</span>
                            <input type="checkbox" checked={notifications.smsEnabled}
                                onChange={e => setNotifications({ ...notifications, smsEnabled: e.target.checked })} />
                        </div>
                        <div style={toggleRow}>
                            <span>Alertas de transacciones</span>
                            <input type="checkbox" checked={notifications.transactionAlerts}
                                onChange={e => setNotifications({ ...notifications, transactionAlerts: e.target.checked })} />
                        </div>
                        <div style={{ ...toggleRow, borderBottom: 'none' }}>
                            <span>Promociones</span>
                            <input type="checkbox" checked={notifications.promotions}
                                onChange={e => setNotifications({ ...notifications, promotions: e.target.checked })} />
                        </div>
                        <Button variant="primary" fullWidth onClick={() => { setShowNotificationsModal(false); alert('Preferencias guardadas ✅'); }} style={{ marginTop: '1rem' }}>
                            Guardar preferencias
                        </Button>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelpModal && (
                <div style={modalOverlay} onClick={() => setShowHelpModal(false)}>
                    <div style={modalContent} onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1.5rem' }}>❓ Centro de Ayuda</h3>
                        <Card style={{ marginBottom: '0.75rem' }}>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>📞 Soporte 24/7</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>+52 800 123 4567</p>
                            </div>
                        </Card>
                        <Card style={{ marginBottom: '0.75rem' }}>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>✉️ Email de soporte</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>soporte@remesalibre.com</p>
                            </div>
                        </Card>
                        <Card style={{ marginBottom: '0.75rem' }}>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>💬 Chat en vivo</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Disponible en horario laboral</p>
                            </div>
                        </Card>
                        <Card style={{ marginBottom: '1rem' }}>
                            <div style={{ padding: '0.5rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0' }}>📚 Preguntas frecuentes</h4>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Visita nuestro centro de ayuda</p>
                            </div>
                        </Card>
                        <Button variant="secondary" fullWidth onClick={() => setShowHelpModal(false)}>Cerrar</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const AdminDashboard = () => {
    return (
        <div style={{ padding: '2rem' }}>
            <h1>Admin Dashboard</h1>
            <p>Panel administrativo en construcción</p>
        </div>
    );
};
