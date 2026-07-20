import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from '../components/navigation/BottomNav';
import './MainLayout.css';

const MainLayout = ({ children }) => {
    const location = useLocation();

    // Pages where bottom nav should be hidden
    const hideBottomNav = ['/send', '/receive', '/cashout'].some(path =>
        location.pathname.startsWith(path)
    );

    return (
        <div className="main-layout">
            <main className="main-content">{children}</main>
            {!hideBottomNav && <BottomNav />}
        </div>
    );
};

export default MainLayout;
