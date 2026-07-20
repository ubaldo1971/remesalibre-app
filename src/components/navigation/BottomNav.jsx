import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import './BottomNav.css';

const BottomNav = ({ onReceiveClick }) => {
    const { user } = useAuthStore();
    const { openReceiveDialog } = useUIStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Get user initials for avatar
    const getUserAvatar = () => {
        if (user?.picture) {
            return user.picture;
        }
        if (user?.firstName && user?.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        if (user?.firstName) {
            return user.firstName.charAt(0).toUpperCase();
        }
        return '👤';
    };

    const handleReceiveClick = (e) => {
        e.preventDefault();

        // Open the dialog via global store
        openReceiveDialog();

        // If not on dashboard, go there (optional, depending on where the dialog is rendered)
        // Since the dialog is currently only in Dashboard, we MUST go there.
        if (location.pathname !== '/dashboard') {
            navigate('/dashboard');
        }
    };

    const navItems = [
        { path: '/dashboard', icon: '🏠', label: 'Inicio' },
        { path: '/transactions', icon: '📊', label: 'Actividad' },
        { path: '/receive', icon: '📲', label: 'Recibir', onClick: handleReceiveClick },
        { path: '/profile', icon: getUserAvatar(), label: 'Perfil', isProfile: true },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                item.onClick ? (
                    <button
                        key={item.path}
                        className={`nav-item ${location.pathname === item.path ? 'nav-item-active' : ''}`}
                        onClick={item.onClick}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ) : (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `nav-item ${isActive ? 'nav-item-active' : ''} ${item.isProfile ? 'nav-item-profile' : ''}`
                        }
                    >
                        {item.isProfile && !user?.picture?.startsWith?.('http') ? (
                            <span className="nav-icon nav-avatar">{item.icon}</span>
                        ) : item.isProfile && user?.picture?.startsWith?.('http') ? (
                            <img src={user.picture} alt="Avatar" className="nav-avatar-img" />
                        ) : (
                            <span className="nav-icon">{item.icon}</span>
                        )}
                        <span className="nav-label">{item.label}</span>
                    </NavLink>
                )
            ))}
        </nav>
    );
};

export default BottomNav;
