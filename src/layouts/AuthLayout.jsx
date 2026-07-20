import React from 'react';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                {/* Branding moved inside pages for unified card design */}
                {/* <div className="auth-branding">
                    <h1 className="auth-logo gradient-text">RemesaLibre</h1>
                    <p className="auth-tagline">Pagos instantáneos sin fronteras</p>
                </div> */}
                <div className="auth-content">{children}</div>
            </div>
        </div>
    );
};

export default AuthLayout;
