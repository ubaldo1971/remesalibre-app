import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAppConfigStore } from '../../store/appConfigStore';
import { playUiSound } from '../../utils/soundUtils';
import './AdminDashboard.css';

// Import the DatabaseView component to show users
import DatabaseView from '../DatabaseView';

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onToggle, label }) => (
    <div className="toggle-switch-container">
        <span className="toggle-label">{label}</span>
        <button
            className={`toggle-switch ${enabled ? 'toggle-on' : 'toggle-off'}`}
            onClick={() => {
                playUiSound('click');
                onToggle();
            }}
            onMouseEnter={() => playUiSound('hover')}
            type="button"
        >
            <span className="toggle-slider"></span>
        </button>
        <span className={`toggle-status ${enabled ? 'status-on' : 'status-off'}`}>
            {enabled ? 'Activo' : 'Inactivo'}
        </span>
    </div>
);

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Get store state and actions
    const {
        commission, setCommission,
        spread, setSpread,
        donationEnabled, setDonationEnabled,
        donationData, updateDonationData,
        votingEnabled, setVotingEnabled,
        votingData, updateVotingData, updateVotingOption,
        fetchConfigFromServer, saveDonationToServer, saveVotingToServer
    } = useAppConfigStore();

    // Dashboard stats state
    const [dashboardStats, setDashboardStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        totalVolumeMXN: 0,
        totalVolumeUSD: 0,
        liquidityMXN: 0,
        liquidityUSD: 0,
        totalCashouts: 0,
        cashoutVolume: 0,
        exchangeRate: 19.50
    });

    // Local state for form inputs
    const [localCommission, setLocalCommission] = useState(commission);
    const [localSpread, setLocalSpread] = useState(spread);
    const [donationCause, setDonationCause] = useState(donationData.cause);
    const [donationGoal, setDonationGoal] = useState(donationData.goal);
    const [donationCurrent, setDonationCurrent] = useState(donationData.current);
    const [donationAmounts, setDonationAmounts] = useState([1, 5, 10]);
    const [totalDonationsUSDC, setTotalDonationsUSDC] = useState(0);
    const [votingQuestion, setVotingQuestion] = useState(votingData.question);
    const [optionA, setOptionA] = useState(votingData.optionA.text);
    const [optionB, setOptionB] = useState(votingData.optionB.text);
    const [votesA, setVotesA] = useState(votingData.optionA.votes);
    const [votesB, setVotesB] = useState(votingData.optionB.votes);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
        try {
            const response = await fetch('http://localhost:3000/api/admin/dashboard');
            const data = await response.json();
            if (data.success && data.stats) {
                setDashboardStats(data.stats);
            }

            // Also fetch donation config
            const donationRes = await fetch('http://localhost:3000/api/donation/config');
            const donationData = await donationRes.json();
            if (donationData.success && donationData.donation) {
                setDonationAmounts(donationData.donation.amounts || [1, 5, 10]);
                setTotalDonationsUSDC(donationData.donation.totalUSDC || 0);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        }
    };

    // Fetch config and stats on mount
    useEffect(() => {
        fetchConfigFromServer();
        fetchDashboardStats();

        // Refresh stats every 30 seconds
        const interval = setInterval(fetchDashboardStats, 30000);
        return () => clearInterval(interval);
    }, []);

    // Sync local state when store updates
    useEffect(() => {
        setLocalCommission(commission);
        setLocalSpread(spread);
        setDonationCause(donationData.cause);
        setDonationGoal(donationData.goal);
        setDonationCurrent(donationData.current);
        setVotingQuestion(votingData.question);
        setOptionA(votingData.optionA.text);
        setOptionB(votingData.optionB.text);
        setVotesA(votingData.optionA.votes);
        setVotesB(votingData.optionB.votes);
    }, [commission, spread, donationData, votingData]);

    const handleSaveCommission = async () => {
        setIsSaving(true);
        setCommission(localCommission);
        setTimeout(() => {
            setIsSaving(false);
            alert(`Comisión actualizada a ${localCommission}%`);
        }, 500);
    };

    const handleSaveSpread = async () => {
        setIsSaving(true);
        setSpread(localSpread);
        setTimeout(() => {
            setIsSaving(false);
            alert(`Spread actualizado a ${localSpread}%`);
        }, 500);
    };

    const handleSaveDonation = async () => {
        setIsSaving(true);
        updateDonationData({
            cause: donationCause,
            goal: donationGoal,
            current: donationCurrent,
            amounts: donationAmounts
        });
        await saveDonationToServer();
        setIsSaving(false);
        alert('Campaña de donación actualizada');
    };

    const handleToggleDonation = async () => {
        const newState = !donationEnabled;
        setDonationEnabled(newState);
        await saveDonationToServer();
    };

    const handleSaveVoting = async () => {
        setIsSaving(true);
        updateVotingData({ question: votingQuestion });
        updateVotingOption('optionA', { text: optionA, votes: votesA });
        updateVotingOption('optionB', { text: optionB, votes: votesB });
        await saveVotingToServer();
        setIsSaving(false);
        alert('Votación actualizada');
    };

    const handleToggleVoting = async () => {
        const newState = !votingEnabled;
        setVotingEnabled(newState);
        await saveVotingToServer();
    };

    const totalVotes = votesA + votesB;
    const percentA = totalVotes > 0 ? (votesA / totalVotes * 100).toFixed(1) : 0;
    const percentB = totalVotes > 0 ? (votesB / totalVotes * 100).toFixed(1) : 0;
    const donationProgress = (donationCurrent / donationGoal * 100).toFixed(1);

    return (
        <div className="admin-dashboard">
            {/* Header */}
            <div className="admin-header">
                <div className="admin-header-left">
                    <button
                        className="back-to-app-btn"
                        onClick={() => {
                            playUiSound('click');
                            navigate('/dashboard');
                        }}
                        onMouseEnter={() => playUiSound('hover')}
                    >
                        ← Volver a la App
                    </button>
                    <div>
                        <h1>🔐 Panel de Administración</h1>
                        <p>Gestión de configuración y usuarios</p>
                    </div>
                </div>
                <div className="admin-user">
                    <span className="admin-badge">ADMIN</span>
                    <span className="admin-name">Administrador</span>
                </div>
            </div>

            {/* Real-Time Metrics Section */}
            <div className="metrics-section">
                <h2>📊 Métricas en Tiempo Real</h2>
                <div className="metrics-grid">
                    <div className="metric-card metric-users">
                        <div className="metric-icon">👥</div>
                        <div className="metric-content">
                            <span className="metric-value">{dashboardStats.activeUsers}</span>
                            <span className="metric-label">Usuarios Activos</span>
                        </div>
                        <div className="metric-footer">Total: {dashboardStats.totalUsers}</div>
                    </div>

                    <div className="metric-card metric-transactions">
                        <div className="metric-icon">💳</div>
                        <div className="metric-content">
                            <span className="metric-value">{dashboardStats.totalTransactions}</span>
                            <span className="metric-label">Transacciones</span>
                        </div>
                        <div className="metric-footer">Completadas: {dashboardStats.completedTransactions}</div>
                    </div>

                    <div className="metric-card metric-volume">
                        <div className="metric-icon">💰</div>
                        <div className="metric-content">
                            <span className="metric-value">${dashboardStats.totalVolumeMXN.toLocaleString()}</span>
                            <span className="metric-label">Volumen MXN</span>
                        </div>
                        <div className="metric-footer">USD: ${dashboardStats.totalVolumeUSD.toLocaleString()}</div>
                    </div>

                    <div className="metric-card metric-liquidity">
                        <div className="metric-icon">🏦</div>
                        <div className="metric-content">
                            <span className="metric-value">${dashboardStats.liquidityMXN.toLocaleString()}</span>
                            <span className="metric-label">Liquidez MXN</span>
                        </div>
                        <div className="metric-footer">USD: ${dashboardStats.liquidityUSD.toLocaleString()}</div>
                    </div>

                    <div className="metric-card metric-cashouts">
                        <div className="metric-icon">💵</div>
                        <div className="metric-content">
                            <span className="metric-value">{dashboardStats.totalCashouts}</span>
                            <span className="metric-label">Retiros</span>
                        </div>
                        <div className="metric-footer">Vol: ${dashboardStats.cashoutVolume.toLocaleString()}</div>
                    </div>

                    <div className="metric-card metric-rate">
                        <div className="metric-icon">📈</div>
                        <div className="metric-content">
                            <span className="metric-value">${dashboardStats.exchangeRate}</span>
                            <span className="metric-label">USD/MXN</span>
                        </div>
                        <div className="metric-footer">Tipo de cambio</div>
                    </div>

                    <div className="metric-card metric-donations">
                        <div className="metric-icon">❤️</div>
                        <div className="metric-content">
                            <span className="metric-value">${dashboardStats.totalDonationsUSDC || 0}</span>
                            <span className="metric-label">Donaciones Totales</span>
                        </div>
                        <div className="metric-footer">Monto en USDC</div>
                    </div>
                </div>
            </div>

            {/* Configuration Section */}
            <div className="admin-config-section">
                <h2>⚙️ Configuración del Sistema</h2>

                <div className="config-grid">
                    {/* Commission Card */}
                    <Card variant="elevated" className="config-card">
                        <div className="config-header">
                            <h3>💰 Comisión por Transacción</h3>
                            <p>Porcentaje cobrado por cada transferencia</p>
                        </div>
                        <div className="config-body">
                            <div className="config-value-display">
                                <span className="config-percentage">{localCommission}%</span>
                                <span className="config-label">Comisión Actual</span>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="10"
                                value={localCommission}
                                onChange={(e) => setLocalCommission(parseFloat(e.target.value))}
                                label="Nueva Comisión (%)"
                            />
                            <Button
                                variant="primary"
                                onClick={handleSaveCommission}
                                loading={isSaving}
                                fullWidth
                            >
                                Guardar Comisión
                            </Button>
                        </div>
                    </Card>

                    {/* Spread Card */}
                    <Card variant="elevated" className="config-card">
                        <div className="config-header">
                            <h3>📊 Spread de Tipo de Cambio</h3>
                            <p>Margen sobre el tipo de cambio USD/MXN</p>
                        </div>
                        <div className="config-body">
                            <div className="config-value-display">
                                <span className="config-percentage">{localSpread}%</span>
                                <span className="config-label">Spread Actual</span>
                            </div>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="5"
                                value={localSpread}
                                onChange={(e) => setLocalSpread(parseFloat(e.target.value))}
                                label="Nuevo Spread (%)"
                            />
                            <Button
                                variant="primary"
                                onClick={handleSaveSpread}
                                loading={isSaving}
                                fullWidth
                            >
                                Guardar Spread
                            </Button>
                        </div>
                    </Card>

                    {/* Donation Campaign Card */}
                    <Card variant="elevated" className={`config-card ${!donationEnabled ? 'card-disabled' : ''}`}>
                        <div className="config-header">
                            <div className="config-header-row">
                                <h3>❤️ Campaña de Donación</h3>
                                <ToggleSwitch
                                    enabled={donationEnabled}
                                    onToggle={handleToggleDonation}
                                    label="Publicar"
                                />
                            </div>
                            <p>Configura la causa activa para donaciones</p>
                        </div>
                        <div className="config-body">
                            <Input
                                value={donationCause}
                                onChange={(e) => setDonationCause(e.target.value)}
                                label="Causa de Donación"
                                disabled={!donationEnabled}
                            />
                            <Input
                                type="number"
                                value={donationGoal}
                                onChange={(e) => setDonationGoal(parseFloat(e.target.value))}
                                label="Meta de Donación (MXN)"
                                disabled={!donationEnabled}
                            />

                            <div className="amounts-config">
                                <label className="input-label">Montos Predeterminados (USD)</label>
                                <div className="amounts-inputs">
                                    {donationAmounts.map((amt, idx) => (
                                        <Input
                                            key={idx}
                                            type="number"
                                            value={amt}
                                            onChange={(e) => {
                                                const newAmts = [...donationAmounts];
                                                newAmts[idx] = parseFloat(e.target.value) || 0;
                                                setDonationAmounts(newAmts);
                                            }}
                                            placeholder={`Opción ${idx + 1}`}
                                            disabled={!donationEnabled}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Input
                                type="number"
                                value={donationCurrent}
                                onChange={(e) => setDonationCurrent(parseFloat(e.target.value))}
                                label="Monto Recaudado (MXN)"
                                disabled={!donationEnabled}
                            />
                            <div className="progress-preview">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${donationProgress}%` }}
                                    />
                                </div>
                                <span className="progress-text">{donationProgress}% de la meta</span>
                            </div>
                            <Button
                                variant="success"
                                onClick={handleSaveDonation}
                                loading={isSaving}
                                fullWidth
                                disabled={!donationEnabled}
                            >
                                Actualizar Campaña
                            </Button>
                        </div>
                    </Card>

                    {/* Voting Poll Card */}
                    <Card variant="elevated" className={`config-card ${!votingEnabled ? 'card-disabled' : ''}`}>
                        <div className="config-header">
                            <div className="config-header-row">
                                <h3>🗳️ Votación Comunitaria</h3>
                                <ToggleSwitch
                                    enabled={votingEnabled}
                                    onToggle={handleToggleVoting}
                                    label="Publicar"
                                />
                            </div>
                            <p>Configura la pregunta y opciones de votación</p>
                        </div>
                        <div className="config-body">
                            <Input
                                value={votingQuestion}
                                onChange={(e) => setVotingQuestion(e.target.value)}
                                label="Pregunta de Votación"
                                disabled={!votingEnabled}
                            />
                            <Input
                                value={optionA}
                                onChange={(e) => setOptionA(e.target.value)}
                                label="Opción A"
                                disabled={!votingEnabled}
                            />
                            <Input
                                type="number"
                                value={votesA}
                                onChange={(e) => setVotesA(parseInt(e.target.value))}
                                label="Votos Opción A"
                                disabled={!votingEnabled}
                            />
                            <Input
                                value={optionB}
                                onChange={(e) => setOptionB(e.target.value)}
                                label="Opción B"
                                disabled={!votingEnabled}
                            />
                            <Input
                                type="number"
                                value={votesB}
                                onChange={(e) => setVotesB(parseInt(e.target.value))}
                                label="Votos Opción B"
                                disabled={!votingEnabled}
                            />
                            <div className="voting-preview">
                                <div className="vote-option">
                                    <span>{optionA}</span>
                                    <span className="vote-count">{votesA} votos ({percentA}%)</span>
                                </div>
                                <div className="vote-option">
                                    <span>{optionB}</span>
                                    <span className="vote-count">{votesB} votos ({percentB}%)</span>
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleSaveVoting}
                                loading={isSaving}
                                fullWidth
                                disabled={!votingEnabled}
                            >
                                Actualizar Votación
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Users Database Section */}
            <div className="admin-users-section">
                <h2>👥 Gestión de Usuarios Registrados</h2>
                <DatabaseView />
            </div>
        </div>
    );
};

export default AdminDashboard;

