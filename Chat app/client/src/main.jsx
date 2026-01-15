import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import './index.css';
import './App.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <GoogleOAuthProvider clientId={googleClientId}>
                <AuthProvider>
                    <SocketProvider>
                        <CallProvider>
                            <App />
                            <Toaster
                                position="top-center"
                                toastOptions={{
                                    duration: 3000,
                                    style: {
                                        background: '#202c33',
                                        color: '#e9edef',
                                        borderRadius: '12px',
                                        border: '1px solid #2a3942',
                                        padding: '12px 16px',
                                        fontSize: '14px',
                                    },
                                    success: {
                                        iconTheme: {
                                            primary: '#00a884',
                                            secondary: '#fff',
                                        },
                                    },
                                    error: {
                                        iconTheme: {
                                            primary: '#f15c6d',
                                            secondary: '#fff',
                                        },
                                    },
                                }}
                            />
                        </CallProvider>
                    </SocketProvider>
                </AuthProvider>
            </GoogleOAuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);
