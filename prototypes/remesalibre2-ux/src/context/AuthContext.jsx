import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load from storage on mount
    useEffect(() => {
        const session = authService.getSession();
        if (session) {
            setUser(session.user);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const { data, error } = await authService.login(email, password);
        if (data) {
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error };
    };

    const register = async (userData) => {
        const { data, error } = await authService.register(userData);
        if (data) {
            setUser(data.user);
            return { success: true };
        }
        return { success: false, error };
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
