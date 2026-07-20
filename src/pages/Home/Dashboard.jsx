import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../../components/ui/Card';
import { useWalletStore } from '../../store/walletStore';
import { useAuthStore } from '../../store/authStore';
import { useAppConfigStore } from '../../store/appConfigStore';
import { useUIStore } from '../../store/uiStore';
import useNotificationStore from '../../store/notificationStore';
import { formatCurrency, formatCurrencyWhole, formatRelativeTime } from '../../utils/formatters';
import { getDefaultCurrency } from '../../utils/locale';
import SendMoneyDialog from '../../components/dialogs/SendMoneyDialog';
import ReceiveMoneyDialog from '../../components/dialogs/ReceiveMoneyDialog';
import CashOutDialog from '../../components/dialogs/CashOutDialog';
import PayServicesDialog from '../../components/dialogs/PayServicesDialog';
import ScanQRDialog from '../../components/dialogs/ScanQRDialog';
import DonationPopup from '../../components/dialogs/DonationPopup';
import VotingDialog from '../../components/dialogs/VotingDialog';
import AddBalanceDialog from '../../components/dialogs/AddBalanceDialog';
import NotificationDropdown from '../../components/notifications/NotificationDropdown';
import confetti from 'canvas-confetti';
import { donationAPI, votingAPI } from '../../utils/api';
import { playUiSound } from '../../utils/soundUtils';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const { balance, transactions, fetchWallet } = useWalletStore();
    const { donationEnabled, donationData, votingEnabled, votingData, fetchConfigFromServer } = useAppConfigStore();
    const { unreadCount } = useNotificationStore();
    const [greeting, setGreeting] = useState('');

    // Calculate total votes for voting section
    const totalVotes = votingData.optionA.votes + votingData.optionB.votes;

    // Dialog states
    const [showSendDialog, setShowSendDialog] = useState(false);
    const [showReceiveDialog, setShowReceiveDialog] = useState(false);
    const [showCashOutDialog, setShowCashOutDialog] = useState(false);
    const [showPayDialog, setShowPayDialog] = useState(false);
    const [showScanQRDialog, setShowScanQRDialog] = useState(false);
    const [showDonationPopup, setShowDonationPopup] = useState(false);
    const [showAddBalanceDialog, setShowAddBalanceDialog] = useState(false);
    const [selectedDonationAmount, setSelectedDonationAmount] = useState(0);
    const [pendingAction, setPendingAction] = useState(null); // 'send' | 'donate' | null

    // Votación logic
    const [showVotingDialog, setShowVotingDialog] = useState(false);
    const [selectedVotingOption, setSelectedVotingOption] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    const { isReceiveDialogOpen, closeReceiveDialog } = useUIStore();

    // Check for openReceive in navigation state or store
    useEffect(() => {
        if (location.state?.openReceive) {
            setShowReceiveDialog(true);
            // Clear state to avoid reopening on refresh
            window.history.replaceState({}, document.title);
        }

        // Sync with global store
        if (isReceiveDialogOpen) {
            setShowReceiveDialog(true);
        }
    }, [location, isReceiveDialogOpen]);

    // Currency toggle
    const [activeCurrency, setActiveCurrency] = useState(getDefaultCurrency());

    useEffect(() => {
        fetchWallet(); // Fetch initial data
        fetchConfigFromServer(); // Fetch admin config
        checkVotingStatus();

        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Buenos días');
        else if (hour < 19) setGreeting('Buenas tardes');
        else setGreeting('Buenas noches');
    }, []);

    const checkVotingStatus = async () => {
        try {
            const response = await votingAPI.getStatus({
                userId: user?.id,
                phone: user?.phoneNumber
            });
            if (response.data.success) {
                setHasVoted(response.data.hasVoted);
            }
        } catch (err) {
            console.error('Error checking voting status:', err);
        }
    };

    const handleVote = (option) => {
        if (hasVoted) return;
        playUiSound('click');
        setSelectedVotingOption(option);
        setShowVotingDialog(true);
    };

    const quickActions = [
        {
            id: 'send',
            title: 'Enviar',
            icon: '↑',
            color: '#0BB8A8',
            path: '/send',
        },
        {
            id: 'receive',
            title: 'Recibir',
            icon: '↓',
            color: '#0066CC',
            path: '/receive',
        },
        {
            id: 'cashout',
            title: 'Cash-out',
            icon: '💵',
            color: '#27ae60',
            path: '/cashout',
        },
        {
            id: 'scanqr',
            title: 'Scan QR',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <path d="M3 21h7"></path>
                    <path d="M3 14v7"></path>
                </svg>
            ),
            color: '#9b59b6',
            path: '/scanqr',
        },
        {
            id: 'services',
            title: 'Servicios',
            icon: '🏪',
            color: '#e67e22',
            path: '/services',
        },
    ];

    const recentTransactions = transactions.slice(0, 5);

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="user-greeting">
                        <h2>{greeting}</h2>
                        <p className="user-name">{user?.firstName || 'Usuario'}</p>
                    </div>

                    <div className="header-actions">
                        <div className="notification-button-wrapper">
                            <button
                                className="icon-button"
                                onClick={() => {
                                    playUiSound('click');
                                    navigate('/notifications');
                                }}
                                onMouseEnter={() => playUiSound('hover')}
                            >
                                {unreadCount > 0 && (
                                    <span className="notification-badge">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                                🔔
                            </button>
                            <NotificationDropdown />
                        </div>
                        <button
                            className="icon-button"
                            onClick={() => {
                                playUiSound('click');
                                navigate('/admin');
                            }}
                            onMouseEnter={() => playUiSound('hover')}
                            title="Panel de Administración"
                        >
                            ⚙️
                        </button>
                        <button
                            className="icon-button"
                            onClick={() => {
                                playUiSound('click');
                                navigate('/profile');
                            }}
                            onMouseEnter={() => playUiSound('hover')}
                            title="Mi Perfil"
                        >
                            {user?.picture ? (
                                typeof user.picture === 'string' && user.picture.startsWith('http') ? (
                                    <img src={user.picture} alt="Avatar" className="avatar-img-small" />
                                ) : (
                                    <span>{user.picture}</span>
                                )
                            ) : (
                                <span className="avatar-initials-small">
                                    {user?.firstName && user?.lastName
                                        ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                                        : user?.firstName
                                            ? user.firstName.charAt(0).toUpperCase()
                                            : '👤'}
                                </span>
                            )}
                        </button>
                        <button
                            className="icon-button logout-btn"
                            onClick={() => {
                                playUiSound('click');
                                logout();
                                navigate('/login');
                            }}
                            onMouseEnter={() => playUiSound('hover')}
                            title="Cerrar Sesión"
                            style={{ color: 'var(--error)' }}
                        >
                            🚪
                        </button>
                    </div>
                </div>

                {/* Balance Display (Dual View) */}
                <motion.div
                    className="balance-card dual-balance-card"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="balance-grid">
                        {/* USD Side (Left - Primary for Donations) */}
                        <div className="balance-item balance-usd">
                            <div className="balance-header">
                                <span className="currency-flag">🇺🇸</span>
                                <span className="currency-name">USD Balance</span>
                            </div>
                            <h2 className="balance-value-large">
                                {formatCurrencyWhole(balance.usd || 0, 'USD').replace('USD', '')}
                            </h2>
                            <p className="balance-label-small">Disponible</p>
                        </div>

                        {/* Divider */}
                        <div className="balance-divider"></div>

                        {/* MXN Side (Right - Source for Conversion) */}
                        <div className="balance-item balance-mxn">
                            <div className="balance-header">
                                <span className="currency-flag">🇲🇽</span>
                                <span className="currency-name">MXN Balance</span>
                            </div>
                            <h2 className="balance-value-large">
                                {formatCurrencyWhole(balance.mxn || 0, 'MXN').replace('MXN', '')}
                            </h2>
                            <p className="balance-label-small">Disponible</p>
                        </div>
                    </div>
                </motion.div>
            </header>

            {/* Decorative Floating Shapes */}
            <div className="floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            {/* Quick Actions */}
            <section className="quick-actions">
                <div className="quick-actions-grid">
                    {quickActions.map((action, index) => (
                        <motion.div
                            key={action.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 * (index + 2) }}
                        >
                            <Card
                                className="action-card"
                                variant="glass"
                                hoverable
                                onClick={() => {
                                    playUiSound('click');
                                    if (action.id === 'services') navigate('/services');
                                    if (action.id === 'send') {
                                        // Check if balance is 0
                                        const currentBalance = balance.mxn + balance.usd;
                                        if (currentBalance <= 0) {
                                            playUiSound('error');
                                            setPendingAction('send');
                                            setShowAddBalanceDialog(true);
                                        } else {
                                            navigate('/send');
                                        }
                                    }
                                    if (action.id === 'receive') navigate('/receive');
                                    if (action.id === 'cashout') navigate('/cashout');
                                    if (action.id === 'scanqr') setShowScanQRDialog(true);
                                }}
                            >
                                <div
                                    className="action-icon"
                                    style={{ backgroundColor: `${action.color}15`, color: action.color }}
                                >
                                    {action.icon}
                                </div>
                                <p className="action-title">{action.title}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Recent Transactions */}
            <section className="transactions-section">
                <div className="section-header">
                    <h2 className="section-title">Transacciones Recientes</h2>
                    <button
                        className="view-all-button"
                        onClick={() => navigate('/transactions')}
                    >
                        Ver todo
                    </button>
                </div>

                <div className="transactions-list">
                    {recentTransactions.length > 0 ? (
                        recentTransactions.map((transaction, index) => (
                            <motion.div
                                key={transaction.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.05 * index }}
                            >
                                <Card
                                    className="transaction-item"
                                    hoverable
                                    onClick={() => navigate(`/transactions/${transaction.id}`)}
                                >
                                    <div className="transaction-icon">
                                        {transaction.type === 'send' ? '↑' : '↓'}
                                    </div>

                                    <div className="transaction-details">
                                        <p className="transaction-title">{transaction.description}</p>
                                        <p className="transaction-date">
                                            {formatRelativeTime(transaction.createdAt)}
                                        </p>
                                    </div>

                                    <div className="transaction-amount">
                                        <p
                                            className={`amount ${(transaction.currency_original || 'MXN') === 'MXN' ? 'amount-mxn' : 'amount-usd'
                                                }`}
                                        >
                                            {transaction.type === 'send' ? '-' : '+'}
                                            {formatCurrency(transaction.amount, transaction.currency_original || 'MXN')}
                                            <span className="currency-label-small">
                                                {(transaction.currency_original || 'MXN')}
                                            </span>
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p className="empty-emoji">🔍</p>
                            <p className="empty-text">No hay transacciones recientes</p>
                            <p className="empty-subtext">Comienza enviando o recibiendo dinero</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Donation Campaign - Only show if enabled */}
            {donationEnabled && (
                <section className="donation-section">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card variant="elevated" className="donation-card">
                            <div className="donation-header">
                                <div className="donation-icon">❤️</div>
                                <div>
                                    <h3>Causas Comunitarias</h3>
                                    <p className="donation-cause">{donationData.cause}</p>
                                </div>
                            </div>

                            <div className="donation-progress">
                                <div className="progress-info">
                                    <span className="progress-current">
                                        ${donationData.current.toLocaleString()} MXN
                                    </span>
                                    <span className="progress-goal">
                                        de ${donationData.goal.toLocaleString()} MXN
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min((donationData.current / donationData.goal) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="progress-percentage">
                                    {((donationData.current / donationData.goal) * 100).toFixed(0)}% de la meta alcanzada
                                </p>
                            </div>

                            <div className="donation-actions">
                                {donationData.amounts && donationData.amounts.map(amt => (
                                    <button
                                        key={amt}
                                        className="donate-amount-btn"
                                        onClick={() => {
                                            playUiSound('click');
                                            setSelectedDonationAmount(amt);
                                            setShowDonationPopup(true);
                                        }}
                                        onMouseEnter={() => playUiSound('hover')}
                                    >
                                        ${amt}
                                    </button>
                                ))}
                                <button
                                    className="donate-custom-btn"
                                    onClick={() => {
                                        playUiSound('click');
                                        setSelectedDonationAmount(0);
                                        setShowDonationPopup(true);
                                    }}
                                    onMouseEnter={() => playUiSound('hover')}
                                >
                                    Otro monto
                                </button>
                            </div>

                            <div className="donation-footer-legend">
                                <p className="tax-receipt-highlight">
                                    📜 Recibe recibo fiscal por tu donativo
                                </p>
                            </div>
                        </Card>
                    </motion.div>
                </section>
            )}

            {/* Direct Donation Logic */}
            <DonationPopup
                isOpen={showDonationPopup}
                onClose={() => setShowDonationPopup(false)}
                onConfirm={async (amount, taxInfo) => {
                    try {
                        const response = await donationAPI.contribute({
                            amount,
                            taxInfo,
                            userId: user.id
                        });

                        if (response.data.success) {
                            // Celebration
                            playUiSound('fireworks');
                            const duration = 3 * 1000;
                            const end = Date.now() + duration;

                            const frame = () => {
                                confetti({
                                    particleCount: 2,
                                    angle: 60,
                                    spread: 55,
                                    origin: { x: 0 },
                                    colors: ['#0BB8A8', '#2ecc71']
                                });
                                confetti({
                                    particleCount: 2,
                                    angle: 120,
                                    spread: 55,
                                    origin: { x: 1 },
                                    colors: ['#0BB8A8', '#2ecc71']
                                });

                                if (Date.now() < end) {
                                    requestAnimationFrame(frame);
                                }
                            };
                            frame();

                            alert('¡Gracias por tu donación! Tu recibo fiscal será procesado.');
                            fetchWallet(); // Refresh balance
                            setShowDonationPopup(false);
                        }
                    } catch (err) {
                        console.error('Error in direct donation:', err);
                        const errorMsg = err.response?.data?.error || err.message || 'Error desconocido';

                        // Check for insufficient funds
                        const isInsufficient = errorMsg.toLowerCase().includes('insuficiente') ||
                            errorMsg.toLowerCase().includes('fondos') ||
                            errorMsg.toLowerCase().includes('balance');

                        if (isInsufficient) {
                            setShowDonationPopup(false);
                            setPendingAction('donate');
                            setTimeout(() => setShowAddBalanceDialog(true), 300);
                        } else {
                            alert(`Error al procesar la donación: ${errorMsg}`);
                        }
                    }
                }}
                transferAmount={selectedDonationAmount}
                isDirect={true}
            />

            {/* Community Voting */}
            {votingEnabled && (
                <section className="voting-section">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                    >
                        <Card variant="elevated" className="voting-card">
                            <div className="voting-header">
                                <div className="voting-icon">🗳️</div>
                                <div>
                                    <h3>Votación Comunitaria</h3>
                                    <p className="voting-question">{votingData.question}</p>
                                </div>
                            </div>

                            <div className="voting-options">
                                <button
                                    className={`vote-option ${selectedVotingOption === 'optionA' ? 'selected' : ''}`}
                                    onClick={() => handleVote('optionA')}
                                    onMouseEnter={() => playUiSound('hover')}
                                    style={{ opacity: hasVoted ? 0.8 : 1, cursor: hasVoted ? 'default' : 'pointer' }}
                                >
                                    <div className="vote-option-content">
                                        <span className="vote-option-text">{votingData.optionA.text}</span>
                                        <span className="vote-count">{votingData.optionA.votes} votos</span>
                                    </div>
                                    <div className="vote-bar">
                                        <div
                                            className="vote-fill"
                                            style={{
                                                width: `${totalVotes > 0 ? (votingData.optionA.votes / totalVotes) * 100 : 50}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="vote-percentage">
                                        {totalVotes > 0 ? ((votingData.optionA.votes / totalVotes) * 100).toFixed(0) : 50}%
                                    </span>
                                </button>

                                <button
                                    className={`vote-option ${selectedVotingOption === 'optionB' ? 'selected' : ''}`}
                                    onClick={() => handleVote('optionB')}
                                    onMouseEnter={() => playUiSound('hover')}
                                    style={{ opacity: hasVoted ? 0.8 : 1, cursor: hasVoted ? 'default' : 'pointer' }}
                                >
                                    <div className="vote-option-content">
                                        <span className="vote-option-text">{votingData.optionB.text}</span>
                                        <span className="vote-count">{votingData.optionB.votes} votos</span>
                                    </div>
                                    <div className="vote-bar">
                                        <div
                                            className="vote-fill"
                                            style={{
                                                width: `${totalVotes > 0 ? (votingData.optionB.votes / totalVotes) * 100 : 50}%`
                                            }}
                                        ></div>
                                    </div>
                                    <span className="vote-percentage">
                                        {totalVotes > 0 ? ((votingData.optionB.votes / totalVotes) * 100).toFixed(0) : 50}%
                                    </span>
                                </button>
                            </div>

                            <p className="voting-footer">
                                {totalVotes} votos totales • {hasVoted ? 'Has participado' : 'Participa ahora'} • Termina en 5 días
                            </p>
                        </Card>
                    </motion.div>
                </section>
            )}

            {/* Dialogs */}
            {/* Dialogs */}
            <SendMoneyDialog
                isOpen={showSendDialog}
                onClose={() => setShowSendDialog(false)}
                onRequireRecharge={() => {
                    setShowSendDialog(false);
                    setPendingAction('send');
                    setTimeout(() => setShowAddBalanceDialog(true), 300);
                }}
            />
            <ReceiveMoneyDialog
                isOpen={showReceiveDialog}
                onClose={() => {
                    setShowReceiveDialog(false);
                    closeReceiveDialog();
                }}
            />
            <CashOutDialog
                isOpen={showCashOutDialog}
                onClose={() => setShowCashOutDialog(false)}
            />
            <PayServicesDialog
                isOpen={showPayDialog}
                onClose={() => setShowPayDialog(false)}
            />
            <ScanQRDialog
                isOpen={showScanQRDialog}
                onClose={() => setShowScanQRDialog(false)}
            />
            <VotingDialog
                isOpen={showVotingDialog}
                onClose={() => setShowVotingDialog(false)}
                question={votingData.question}
                optionA={votingData.optionA}
                optionB={votingData.optionB}
                initialChoice={selectedVotingOption}
                onVoteSuccess={() => {
                    setHasVoted(true);
                    fetchConfigFromServer();
                }}
            />
            <AddBalanceDialog
                isOpen={showAddBalanceDialog}
                onClose={() => setShowAddBalanceDialog(false)}
                onSuccess={async () => {
                    setShowAddBalanceDialog(false);
                    // Wait for wallet to refresh before opening send dialog
                    await fetchWallet();

                    // Resume pending action
                    if (pendingAction === 'send') {
                        setTimeout(() => setShowSendDialog(true), 300);
                    } else if (pendingAction === 'donate') {
                        setTimeout(() => setShowDonationPopup(true), 300);
                    }

                    setPendingAction(null);
                }}
            />
        </div>
    );
};

export default Dashboard;
