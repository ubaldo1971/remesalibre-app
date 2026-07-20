import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="orbit-container">
                    <div className="orbit orbit-1"></div>
                    <div className="orbit orbit-2"></div>
                    <div className="orbit orbit-3"></div>
                    <div className="core-logo">
                        <span className="logo-icon">▲</span>
                    </div>
                </div>
                <h1 className="splash-title">Remesa Antigravity</h1>
                <p className="splash-subtitle">The Weightless Horizon</p>
                
                <div className="splash-loader">
                    <div className="loader-bar"></div>
                </div>
            </div>
            <div className="splash-background-glow"></div>
        </div>
    );
};

export default SplashScreen;
