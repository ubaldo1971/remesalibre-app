import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { playUiSound } from '../../utils/soundUtils';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { logout, user, updateUser } = useAuthStore();
    const { theme, toggleTheme, soundEnabled, toggleSound } = useUIStore();

    const [activeModal, setActiveModal] = useState(null); // 'edit', 'security', 'notifications', 'help'

    const [editForm, setEditForm] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || user?.phone || ''
    });

    const [notifications, setNotifications] = useState({
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        transactionAlerts: true,
        promotions: false
    });

    const handleLogout = () => {
        playUiSound('click');
        logout();
        navigate('/welcome');
    };

    const handleBack = () => {
        playUiSound('click');
        navigate('/dashboard');
    };

    const getInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        return 'US';
    };

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
        playUiSound('success');
        setActiveModal(null);
    };

    const openModal = (modalName) => {
        playUiSound('click');
        setActiveModal(modalName);
    };

    const closeModal = () => {
        playUiSound('click');
        setActiveModal(null);
    };

    return (
        <div className="profile-page">
            <header className="page-header sticky-header">
                <button className="back-btn" onClick={handleBack}>
                    ← Volver
                </button>
                <h1>Mi Perfil</h1>
            </header>

            <div className="profile-container">
                <Card variant="glass" className="user-info-card">
                    <div className="avatar-container">
                        <div className="avatar">
                            {user?.picture ? (
                                typeof user.picture === 'string' && user.picture.startsWith('http') ? (
                                    <img src={user.picture} alt="Avatar" />
                                ) : (<span>{user.picture}</span>)
                            ) : (<span>{getInitials()}</span>)}
                        </div>
                    </div>
                    <div className="user-details-main">
                        <h3>{getDisplayName()}</h3>
                        <p className="phone">{user?.phoneNumber || user?.phone || '+52 123 456 7890'}</p>
                        {user?.email && <p className="email">{user.email}</p>}
                    </div>
                </Card>

                <Card variant="glass" className="preferences-card">
                    <h4 className="section-title">⚙️ Preferencias de App</h4>
                    
                    <div className="toggle-row">
                        <div className="toggle-info">
                            <span className="toggle-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
                            <div className="toggle-text">
                                <p className="title">Modo {theme === 'dark' ? 'Noche' : 'Día'}</p>
                                <p className="subtitle">Cambiar tema visual</p>
                            </div>
                        </div>
                        <div 
                            className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => { playUiSound('click'); toggleTheme(); }}
                        >
                            <div className="toggle-knob" />
                        </div>
                    </div>

                    <div className="toggle-row borderless">
                        <div className="toggle-info">
                            <span className="toggle-icon">{soundEnabled ? '🔊' : '🔇'}</span>
                            <div className="toggle-text">
                                <p className="title">Sonidos de interfaz</p>
                                <p className="subtitle">Efectos hápticos base</p>
                            </div>
                        </div>
                        <div 
                            className={`toggle-switch ${soundEnabled ? 'active' : ''}`}
                            onClick={() => { playUiSound('click'); toggleSound(); }}
                        >
                            <div className="toggle-knob" />
                        </div>
                    </div>
                </Card>

                <div className="options-grid">
                    <Card variant="glass" className="option-card" hoverable onClick={() => openModal('edit')}>
                        <span className="option-icon">📝</span>
                        <div className="option-text">
                            <h4>Editar Perfil</h4>
                            <p>Datos personales y foto</p>
                        </div>
                    </Card>

                    <Card variant="glass" className="option-card" hoverable onClick={() => openModal('security')}>
                        <span className="option-icon">🔒</span>
                        <div className="option-text">
                            <h4>Seguridad</h4>
                            <p>PIN y Biometría</p>
                        </div>
                    </Card>

                    <Card variant="glass" className="option-card" hoverable onClick={() => openModal('notifications')}>
                        <span className="option-icon">🔔</span>
                        <div className="option-text">
                            <h4>Notificaciones</h4>
                            <p>Alertas y correos</p>
                        </div>
                    </Card>

                    <Card variant="glass" className="option-card" hoverable onClick={() => openModal('help')}>
                        <span className="option-icon">❓</span>
                        <div className="option-text">
                            <h4>Ayuda</h4>
                            <p>Soporte técnico y FAQ</p>
                        </div>
                    </Card>
                </div>

                <div className="logout-container">
                    <Button variant="danger" fullWidth onClick={handleLogout} className="logout-btn">
                        Cerrar Sesión
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="modal-overlay" 
                        onClick={closeModal}
                    >
                        <motion.div 
                            initial={{ y: 50, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            className="modal-content glass-panel" 
                            onClick={e => e.stopPropagation()}
                        >
                            {activeModal === 'edit' && (
                                <>
                                    <h3>📝 Editar Perfil</h3>
                                    <div className="form-group">
                                        <Input label="Nombre" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <Input label="Apellido" value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label className="input-label">Teléfono</label>
                                        <div className="phone-input-group">
                                            <span className="phone-prefix">+52 1</span>
                                            <input 
                                                type="tel" 
                                                className="modern-input" 
                                                value={editForm.phoneNumber}
                                                onChange={e => setEditForm({...editForm, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                                placeholder="5512345678"
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-actions">
                                        <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                                        <Button variant="primary" onClick={handleSaveProfile}>Guardar Cambios</Button>
                                    </div>
                                </>
                            )}

                            {activeModal === 'security' && (
                                <>
                                    <h3>🔒 Seguridad</h3>
                                    <div className="security-options">
                                        <div className="setting-row" onClick={() => navigate('/setup-pin')}>
                                            <div>
                                                <h4>Cambiar PIN</h4>
                                                <p>Actualiza tu código de 6 dígitos</p>
                                            </div>
                                            <span>›</span>
                                        </div>
                                        <div className="setting-row" onClick={() => navigate('/2fa-setup')}>
                                            <div>
                                                <h4>Autenticación 2FA</h4>
                                                <p>Mayor seguridad para tu cuenta</p>
                                            </div>
                                            <span>›</span>
                                        </div>
                                    </div>
                                    <Button variant="secondary" fullWidth onClick={closeModal} className="mt-4">Volver</Button>
                                </>
                            )}

                            {activeModal === 'notifications' && (
                                <>
                                    <h3>🔔 Notificaciones</h3>
                                    <div className="preferences-list">
                                        {Object.entries({
                                            'Notificaciones Push': 'pushEnabled',
                                            'Alertas por Email': 'emailEnabled',
                                            'Alertas SMS': 'smsEnabled',
                                            'Transacciones': 'transactionAlerts',
                                            'Promociones': 'promotions'
                                        }).map(([label, key]) => (
                                            <div className="toggle-row mini" key={key}>
                                                <span>{label}</span>
                                                <div 
                                                    className={`toggle-switch ${notifications[key] ? 'active' : ''}`}
                                                    onClick={() => setNotifications({...notifications, [key]: !notifications[key]})}
                                                >
                                                    <div className="toggle-knob" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="primary" fullWidth onClick={closeModal} className="mt-4">Listo</Button>
                                </>
                            )}

                            {activeModal === 'help' && (
                                <>
                                    <h3>❓ Centro de Ayuda</h3>
                                    <div className="help-options">
                                        <div className="help-card">
                                            <span className="help-icon">📞</span>
                                            <div>
                                                <h4>Llámanos</h4>
                                                <p>01 800 123 4567</p>
                                            </div>
                                        </div>
                                        <div className="help-card">
                                            <span className="help-icon">✉️</span>
                                            <div>
                                                <h4>Escríbenos</h4>
                                                <p>soporte@remesa.app</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="secondary" fullWidth onClick={closeModal} className="mt-4">Cerrar</Button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
