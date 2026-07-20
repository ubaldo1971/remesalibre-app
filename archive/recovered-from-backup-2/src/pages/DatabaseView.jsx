import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { playUiSound } from '../utils/soundUtils';
import './DatabaseView.css';

const API_BASE = 'http://localhost:3000/api/admin';

// Mock database with 5 example users (fallback if API fails)
const mockDatabase = [
    {
        id: '1',
        firstName: 'María',
        lastName: 'García López',
        email: 'maria.garcia@gmail.com',
        phoneNumber: '+525512345678',
        country: 'MX',
        state: 'Ciudad de México',
        city: 'Coyoacán',
        balanceMXN: 5420.50,
        balanceUSD: 250.00,
        createdAt: '2024-01-15T10:30:00Z',
        status: 'active',
        picture: '👩',
    },
    {
        id: '2',
        firstName: 'Juan Carlos',
        lastName: 'Rodríguez Méndez',
        email: 'juanc.rodriguez@outlook.com',
        phoneNumber: '+525598765432',
        country: 'MX',
        state: 'Jalisco',
        city: 'Guadalajara',
        balanceMXN: 12350.75,
        balanceUSD: 680.00,
        createdAt: '2024-01-20T14:22:00Z',
        status: 'active',
        picture: '👨',
    },
    {
        id: '3',
        firstName: 'Ana Sofía',
        lastName: 'Martínez Torres',
        email: 'anasofia.mt@yahoo.com',
        phoneNumber: '+525587654321',
        country: 'MX',
        state: 'Nuevo León',
        city: 'Monterrey',
        balanceMXN: 8900.00,
        balanceUSD: 450.50,
        createdAt: '2024-02-05T09:15:00Z',
        status: 'active',
        picture: '👩‍💼',
    },
    {
        id: '4',
        firstName: 'Carlos Alberto',
        lastName: 'Hernández Ruiz',
        email: 'carlos.hernandez@hotmail.com',
        phoneNumber: '+525556781234',
        country: 'MX',
        state: 'Puebla',
        city: 'Puebla',
        balanceMXN: 3200.25,
        balanceUSD: 180.00,
        createdAt: '2024-02-12T16:45:00Z',
        status: 'active',
        picture: '👨‍💻',
    },
    {
        id: '5',
        firstName: 'Laura Patricia',
        lastName: 'Sánchez Díaz',
        email: 'laura.sanchez@gmail.com',
        phoneNumber: '+525543218765',
        country: 'MX',
        state: 'Guanajuato',
        city: 'León',
        balanceMXN: 15800.90,
        balanceUSD: 890.00,
        createdAt: '2024-03-01T11:00:00Z',
        status: 'active',
        picture: '👩‍🎓',
    },
];

const ADMIN_PASSWORD = '1234'; // Admin password for security

const DatabaseView = () => {
    const [users, setUsers] = useState(mockDatabase);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(null);

    // Password protection state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [pendingAction, setPendingAction] = useState(null); // { type: 'edit'|'block'|'delete', user: {...} }

    // Edit form state
    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        state: '',
        city: '',
        status: 'active'
    });

    // Add new user state
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        country: 'MX',
        state: '',
        city: '',
        balanceMXN: 0,
        balanceUSD: 0
    });

    // Fetch users from API on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE}/users`);
            const data = await response.json();
            if (data.success && data.users) {
                // Merge API users with mock data for demo
                const apiUsers = data.users.map(u => ({
                    id: u.id,
                    firstName: u.first_name || 'Usuario',
                    lastName: u.last_name || '',
                    email: u.email || '',
                    phoneNumber: u.phone_number || '',
                    country: u.country || 'MX',
                    state: u.state || 'N/A',
                    city: u.city || 'N/A',
                    balanceMXN: u.balanceMXN || 0,
                    balanceUSD: u.balanceUSD || 0,
                    createdAt: u.created_at || new Date().toISOString(),
                    status: u.status || 'active',
                    picture: '👤'
                }));
                // Use API users if available, otherwise fallback to mock
                if (apiUsers.length > 0) {
                    setUsers([...apiUsers, ...mockDatabase.slice(apiUsers.length)]);
                }
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            // Keep mock data on error
        }
    };

    const formatCurrency = (amount, currency = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTotalStats = () => {
        return {
            totalUsers: users.length,
            totalBalanceMXN: users.reduce((sum, user) => sum + (user.balanceMXN || 0), 0),
            totalBalanceUSD: users.reduce((sum, user) => sum + (user.balanceUSD || 0), 0),
            activeUsers: users.filter(u => u.status === 'active').length,
            blockedUsers: users.filter(u => u.status === 'blocked').length,
        };
    };

    const handleEditClick = (user, e) => {
        e.stopPropagation();
        // Request password before allowing edit
        setPendingAction({ type: 'edit', user });
        setShowPasswordModal(true);
        setPasswordInput('');
        setPasswordError('');
    };

    // Called after password is verified
    const proceedWithEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            state: user.state || '',
            city: user.city || '',
            status: user.status || 'active'
        });
    };

    const handleSaveEdit = async () => {
        if (!editingUser) return;

        setIsSaving(true);
        try {
            const response = await fetch(`${API_BASE}/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: editForm.firstName,
                    last_name: editForm.lastName,
                    email: editForm.email,
                    phone_number: editForm.phoneNumber,
                    state: editForm.state,
                    city: editForm.city,
                    status: editForm.status
                })
            });
            const data = await response.json();

            if (data.success) {
                // Update local state
                setUsers(users.map(u =>
                    u.id === editingUser.id
                        ? { ...u, ...editForm }
                        : u
                ));
                setEditingUser(null);
                alert('Usuario actualizado correctamente');
            } else {
                // Update local state anyway for demo
                setUsers(users.map(u =>
                    u.id === editingUser.id
                        ? { ...u, ...editForm }
                        : u
                ));
                setEditingUser(null);
                alert('Usuario actualizado (modo demo)');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            // Update local state for demo purposes
            setUsers(users.map(u =>
                u.id === editingUser.id
                    ? { ...u, ...editForm }
                    : u
            ));
            setEditingUser(null);
            alert('Usuario actualizado (modo demo)');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBlockUser = async (user, e) => {
        e.stopPropagation();
        // Request password before allowing block/unblock
        setPendingAction({ type: 'block', user });
        setShowPasswordModal(true);
        setPasswordInput('');
        setPasswordError('');
    };

    // Called after password is verified for blocking
    const proceedWithBlock = async (user) => {
        const newStatus = user.status === 'blocked' ? 'active' : 'blocked';

        try {
            const response = await fetch(`${API_BASE}/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();

            // Update local state
            setUsers(users.map(u =>
                u.id === user.id ? { ...u, status: newStatus } : u
            ));
            alert(`Usuario ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} correctamente`);
        } catch (error) {
            console.error('Error blocking user:', error);
            // Update local state for demo
            setUsers(users.map(u =>
                u.id === user.id ? { ...u, status: newStatus } : u
            ));
            alert(`Usuario ${newStatus === 'blocked' ? 'bloqueado' : 'desbloqueado'} (modo demo)`);
        }
    };

    const handleDeleteUser = async (user, e) => {
        e.stopPropagation();
        // Request password before allowing delete
        setPendingAction({ type: 'delete', user });
        setShowPasswordModal(true);
        setPasswordInput('');
        setPasswordError('');
    };

    const confirmDeleteUser = async () => {
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${API_BASE}/users/${confirmDelete.id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            // Remove from local state
            setUsers(users.filter(u => u.id !== confirmDelete.id));
            setConfirmDelete(null);
            alert('Usuario eliminado correctamente');
        } catch (error) {
            console.error('Error deleting user:', error);
            // Update local state for demo
            setUsers(users.filter(u => u.id !== confirmDelete.id));
            setConfirmDelete(null);
            alert('Usuario eliminado (modo demo)');
        }
    };

    // Password verification function
    const verifyPassword = () => {
        if (passwordInput !== ADMIN_PASSWORD) {
            setPasswordError('Contraseña incorrecta');
            return;
        }

        // Password correct - proceed with pending action
        setShowPasswordModal(false);
        setPasswordInput('');
        setPasswordError('');

        if (pendingAction) {
            switch (pendingAction.type) {
                case 'edit':
                    proceedWithEdit(pendingAction.user);
                    break;
                case 'block':
                    proceedWithBlock(pendingAction.user);
                    break;
                case 'delete':
                    setConfirmDelete(pendingAction.user);
                    break;
                case 'addUser':
                    openAddUserModal();
                    break;
            }
            setPendingAction(null);
        }
    };

    const cancelPasswordModal = () => {
        setShowPasswordModal(false);
        setPasswordInput('');
        setPasswordError('');
        setPendingAction(null);
    };

    // Add new user functions
    const handleOpenAddUser = () => {
        // Request password before allowing to add user
        setPendingAction({ type: 'addUser' });
        setShowPasswordModal(true);
        setPasswordInput('');
        setPasswordError('');
    };

    const openAddUserModal = () => {
        setNewUserForm({
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            country: 'MX',
            state: '',
            city: '',
            balanceMXN: 0,
            balanceUSD: 0
        });
        setShowAddUserModal(true);
    };

    const handleSaveNewUser = async () => {
        // Validate required fields
        if (!newUserForm.firstName || !newUserForm.email) {
            alert('El nombre y email son requeridos');
            return;
        }

        setIsSaving(true);
        try {
            // Generate a unique ID for the new user
            const newId = `user-${Date.now()}`;
            const newUser = {
                id: newId,
                ...newUserForm,
                createdAt: new Date().toISOString(),
                status: 'active',
                picture: '👤'
            };

            // Try to save to API
            const response = await fetch(`${API_BASE}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            // Add to local state regardless of API response
            setUsers([newUser, ...users]);
            setShowAddUserModal(false);
            alert('Usuario agregado correctamente');
        } catch (error) {
            console.error('Error adding user:', error);
            // Add to local state for demo
            const newId = `user-${Date.now()}`;
            const newUser = {
                id: newId,
                ...newUserForm,
                createdAt: new Date().toISOString(),
                status: 'active',
                picture: '👤'
            };
            setUsers([newUser, ...users]);
            setShowAddUserModal(false);
            alert('Usuario agregado (modo demo)');
        } finally {
            setIsSaving(false);
        }
    };

    const stats = getTotalStats();

    return (
        <div className="database-view">
            <div className="db-header">
                <h1>📊 Base de Datos - Usuarios Registrados</h1>
                <p className="db-subtitle">Vista de demostración con registros ficticios</p>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
                <Card variant="elevated" className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>{stats.totalUsers}</h3>
                        <p>Usuarios Totales</p>
                    </div>
                </Card>

                <Card variant="elevated" className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(stats.totalBalanceMXN)}</h3>
                        <p>Balance Total MXN</p>
                    </div>
                </Card>

                <Card variant="elevated" className="stat-card">
                    <div className="stat-icon">💵</div>
                    <div className="stat-content">
                        <h3>{formatCurrency(stats.totalBalanceUSD, 'USD')}</h3>
                        <p>Balance Total USD</p>
                    </div>
                </Card>

                <Card variant="elevated" className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{stats.activeUsers}</h3>
                        <p>Usuarios Activos</p>
                    </div>
                </Card>
            </div>

            {/* Users Table */}
            <Card variant="elevated" className="table-card">
                <div className="table-header">
                    <div className="table-header-left">
                        <h2>Registros de Usuarios</h2>
                        <div className="table-legend">
                            <span className="legend-item">
                                <span className="status-dot status-active"></span> Activo
                            </span>
                            <span className="legend-item">
                                <span className="status-dot status-blocked"></span> Bloqueado
                            </span>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleOpenAddUser}
                        className="btn-add-user"
                    >
                        ➕ Agregar Usuario
                    </Button>
                </div>

                <div className="table-responsive">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Ubicación</th>
                                <th>Balance MXN</th>
                                <th>Balance USD</th>
                                <th>Fecha Registro</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <motion.tr
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={selectedUser?.id === user.id ? 'selected' : ''}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <td className="td-id">#{user.id}</td>
                                    <td className="td-user">
                                        <div className="user-info">
                                            <span className="user-avatar">{user.picture}</span>
                                            <div className="user-name">
                                                <strong>{user.firstName} {user.lastName}</strong>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="td-email">{user.email}</td>
                                    <td className="td-phone">{user.phoneNumber}</td>
                                    <td className="td-location">{user.city}, {user.state}</td>
                                    <td className="td-balance">{formatCurrency(user.balanceMXN)}</td>
                                    <td className="td-balance">{formatCurrency(user.balanceUSD, 'USD')}</td>
                                    <td className="td-date">{formatDate(user.createdAt)}</td>
                                    <td className="td-status">
                                        <span className={`status-badge status-${user.status}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="td-actions">
                                        <div className="action-buttons">
                                            <button
                                                className="btn-view"
                                                onClick={(e) => {
                                                    playUiSound('click');
                                                    e.stopPropagation();
                                                    setSelectedUser(user);
                                                }}
                                                onMouseEnter={() => playUiSound('hover')}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className="btn-edit"
                                                onClick={(e) => {
                                                    playUiSound('click');
                                                    handleEditClick(user, e);
                                                }}
                                                onMouseEnter={() => playUiSound('hover')}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={`btn-block ${user.status === 'blocked' ? 'btn-unblock' : ''}`}
                                                onClick={(e) => {
                                                    playUiSound('click');
                                                    handleBlockUser(user, e);
                                                }}
                                                onMouseEnter={() => playUiSound('hover')}
                                                title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                                            >
                                                {user.status === 'blocked' ? '🔓' : '🔒'}
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={(e) => {
                                                    playUiSound('click');
                                                    handleDeleteUser(user, e);
                                                }}
                                                onMouseEnter={() => playUiSound('hover')}
                                                title="Eliminar usuario"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* User Details Modal/Panel */}
            {selectedUser && (
                <motion.div
                    className="user-details-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedUser(null)}
                >
                    <motion.div
                        className="user-details-panel"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="panel-header">
                            <div className="panel-user">
                                <span className="panel-avatar">{selectedUser.picture}</span>
                                <div>
                                    <h2>{selectedUser.firstName} {selectedUser.lastName}</h2>
                                    <p>{selectedUser.email}</p>
                                </div>
                            </div>
                            <button
                                className="btn-close"
                                onClick={() => {
                                    playUiSound('click');
                                    setSelectedUser(null);
                                }}
                                onMouseEnter={() => playUiSound('hover')}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="panel-body">
                            <div className="detail-section">
                                <h3>Información Personal</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>ID</label>
                                        <span>#{selectedUser.id}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Teléfono</label>
                                        <span>{selectedUser.phoneNumber}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email</label>
                                        <span>{selectedUser.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Ubicación</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>País</label>
                                        <span>{selectedUser.country}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Estado</label>
                                        <span>{selectedUser.state}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Ciudad</label>
                                        <span>{selectedUser.city}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Balance</h3>
                                <div className="balance-cards">
                                    <Card variant="gradient" className="balance-card">
                                        <div className="balance-label">MXN</div>
                                        <div className="balance-amount">{formatCurrency(selectedUser.balanceMXN)}</div>
                                    </Card>
                                    <Card variant="elevated" className="balance-card">
                                        <div className="balance-label">USD</div>
                                        <div className="balance-amount">{formatCurrency(selectedUser.balanceUSD, 'USD')}</div>
                                    </Card>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Cuenta</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Fecha de Registro</label>
                                        <span>{formatDate(selectedUser.createdAt)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Estado</label>
                                        <span className={`status-badge status-${selectedUser.status}`}>{selectedUser.status}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <motion.div
                    className="user-details-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setEditingUser(null)}
                >
                    <motion.div
                        className="user-details-panel edit-panel"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="panel-header">
                            <div className="panel-user">
                                <span className="panel-avatar">{editingUser.picture}</span>
                                <div>
                                    <h2>Editar Usuario</h2>
                                    <p>ID: #{editingUser.id}</p>
                                </div>
                            </div>
                            <button className="btn-close" onClick={() => setEditingUser(null)}>
                                ✕
                            </button>
                        </div>

                        <div className="panel-body edit-form">
                            <div className="form-row">
                                <Input
                                    label="Nombre"
                                    value={editForm.firstName}
                                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                />
                                <Input
                                    label="Apellido"
                                    value={editForm.lastName}
                                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                />
                            </div>
                            <Input
                                label="Email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            />
                            <Input
                                label="Teléfono"
                                prefix="+52 1"
                                value={editForm.phoneNumber}
                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                maxLength={10}
                                placeholder="5512345678"
                            />
                            <div className="form-row">
                                <Input
                                    label="Estado"
                                    value={editForm.state}
                                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                />
                                <Input
                                    label="Ciudad"
                                    value={editForm.city}
                                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Estado de la cuenta</label>
                                <select
                                    className="form-select"
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                    <option value="blocked">Bloqueado</option>
                                    <option value="suspended">Suspendido</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setEditingUser(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSaveEdit}
                                    loading={isSaving}
                                >
                                    💾 Guardar Cambios
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <motion.div
                    className="user-details-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setConfirmDelete(null)}
                >
                    <motion.div
                        className="confirm-delete-panel"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="delete-icon">🗑️</div>
                        <h2>¿Eliminar Usuario?</h2>
                        <p>
                            Estás a punto de eliminar a <strong>{confirmDelete.firstName} {confirmDelete.lastName}</strong>.
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="delete-actions">
                            <Button
                                variant="secondary"
                                onClick={() => setConfirmDelete(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="danger"
                                onClick={confirmDeleteUser}
                            >
                                🗑️ Eliminar
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Password Verification Modal */}
            {showPasswordModal && (
                <motion.div
                    className="user-details-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={cancelPasswordModal}
                >
                    <motion.div
                        className="user-details-panel password-modal"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="panel-header">
                            <div className="panel-user">
                                <span className="panel-avatar">🔐</span>
                                <div>
                                    <h2>Verificación de Seguridad</h2>
                                    <p>Ingresa la contraseña de administrador</p>
                                </div>
                            </div>
                            <button className="btn-close" onClick={cancelPasswordModal}>
                                ✕
                            </button>
                        </div>

                        <div className="panel-body">
                            <div className="password-input-container">
                                <Input
                                    type="password"
                                    label="Contraseña de Admin"
                                    value={passwordInput}
                                    onChange={(e) => {
                                        setPasswordInput(e.target.value);
                                        setPasswordError('');
                                    }}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            verifyPassword();
                                        }
                                    }}
                                    placeholder="Ingresa la contraseña"
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className="password-error">{passwordError}</p>
                                )}
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="secondary"
                                    onClick={cancelPasswordModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={verifyPassword}
                                >
                                    🔓 Verificar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}

            {/* Add New User Modal */}
            {showAddUserModal && (
                <motion.div
                    className="user-details-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowAddUserModal(false)}
                >
                    <motion.div
                        className="user-details-panel add-user-panel"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="panel-header">
                            <div className="panel-user">
                                <span className="panel-avatar">➕</span>
                                <div>
                                    <h2>Agregar Nuevo Usuario</h2>
                                    <p>Ingresa los datos del nuevo usuario</p>
                                </div>
                            </div>
                            <button className="btn-close" onClick={() => setShowAddUserModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="panel-body edit-form">
                            <div className="form-row">
                                <Input
                                    label="Nombre *"
                                    value={newUserForm.firstName}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                                    placeholder="Ej: María"
                                />
                                <Input
                                    label="Apellido"
                                    value={newUserForm.lastName}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                                    placeholder="Ej: García López"
                                />
                            </div>
                            <Input
                                label="Email *"
                                type="email"
                                value={newUserForm.email}
                                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                placeholder="Ej: usuario@correo.com"
                            />
                            <Input
                                label="Teléfono"
                                prefix="+52 1"
                                value={newUserForm.phoneNumber}
                                onChange={(e) => setNewUserForm({ ...newUserForm, phoneNumber: e.target.value })}
                                maxLength={10}
                                placeholder="5512345678"
                            />
                            <div className="form-row">
                                <Input
                                    label="Estado/Provincia"
                                    value={newUserForm.state}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, state: e.target.value })}
                                    placeholder="Ej: Ciudad de México"
                                />
                                <Input
                                    label="Ciudad"
                                    value={newUserForm.city}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                                    placeholder="Ej: Coyoacán"
                                />
                            </div>
                            <div className="form-row">
                                <Input
                                    label="Balance MXN"
                                    type="number"
                                    value={newUserForm.balanceMXN}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, balanceMXN: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                                <Input
                                    label="Balance USD"
                                    type="number"
                                    value={newUserForm.balanceUSD}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, balanceUSD: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowAddUserModal(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={handleSaveNewUser}
                                    loading={isSaving}
                                >
                                    💾 Crear Usuario
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default DatabaseView;

