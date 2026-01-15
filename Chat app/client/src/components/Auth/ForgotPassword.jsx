import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiMessageCircle, FiArrowLeft, FiCheck } from 'react-icons/fi';

const ForgotPassword = () => {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validate = () => {
        if (!email) {
            setError('Email is required');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Invalid email format');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validate()) return;

        setLoading(true);
        const result = await forgotPassword(email);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
        } else {
            setError(result.message);
        }
    };

    if (success) {
        return (
            <div className="auth-layout">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-header">
                            <div className="auth-logo" style={{ background: 'linear-gradient(135deg, #00a884, #008069)' }}>
                                <FiCheck />
                            </div>
                            <h1 className="auth-title">Check Your Email</h1>
                            <p className="auth-subtitle">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginBottom: '24px' }}>
                            Didn't receive the email? Check your spam folder or try again.
                        </p>

                        <button
                            type="button"
                            className="btn btn-secondary btn-full"
                            onClick={() => setSuccess(false)}
                        >
                            Try Different Email
                        </button>

                        <p className="auth-footer">
                            <Link to="/login">
                                <FiArrowLeft style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                Back to Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <FiMessageCircle />
                        </div>
                        <h1 className="auth-title">Forgot Password?</h1>
                        <p className="auth-subtitle">
                            Enter your email and we'll send you a reset link
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="form-error" style={{ marginBottom: '16px', justifyContent: 'center' }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter your email"
                                    className={`form-input with-icon-left ${error ? 'error' : ''}`}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '' : 'Send Reset Link'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        <Link to="/login">
                            <FiArrowLeft style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Back to Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
