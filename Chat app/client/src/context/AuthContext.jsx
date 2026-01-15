import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for token on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token && storedUser) {
                try {
                    // Verify token is still valid
                    const response = await authAPI.getMe();
                    setUser(response.data.user);
                    setIsAuthenticated(true);
                } catch (error) {
                    // Token invalid, clear storage
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Check for OAuth token in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        if (token) {
            localStorage.setItem('token', token);
            // Remove token from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Fetch user data
            authAPI.getMe().then((response) => {
                const userData = response.data.user;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                setIsAuthenticated(true);
                toast.success('Welcome back!');
            }).catch(() => {
                localStorage.removeItem('token');
            });
        }
    }, []);

    const register = useCallback(async (name, email, password) => {
        try {
            const response = await authAPI.register({ name, email, password });
            const { user: userData, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);

            toast.success('Account created successfully!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, message };
        }
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const { user: userData, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            setIsAuthenticated(true);

            toast.success('Welcome back!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, message };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            // Ignore error
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            toast.success('Logged out successfully');
        }
    }, []);

    const forgotPassword = useCallback(async (email) => {
        try {
            await authAPI.forgotPassword(email);
            toast.success('Password reset email sent!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send reset email';
            toast.error(message);
            return { success: false, message };
        }
    }, []);

    const resetPassword = useCallback(async (token, password) => {
        try {
            const response = await authAPI.resetPassword(token, password);
            const newToken = response.data.token;

            if (newToken) {
                localStorage.setItem('token', newToken);
                // Fetch user data
                const userResponse = await authAPI.getMe();
                const userData = userResponse.data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
                setIsAuthenticated(true);
            }

            toast.success('Password reset successful!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Password reset failed';
            toast.error(message);
            return { success: false, message };
        }
    }, []);

    const updateUser = useCallback((updates) => {
        setUser((prev) => {
            const updated = { ...prev, ...updates };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const googleLogin = useCallback(() => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        window.location.href = `${apiUrl}/api/auth/google`;
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
        googleLogin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
