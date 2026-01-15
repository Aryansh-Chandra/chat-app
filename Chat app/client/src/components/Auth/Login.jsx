import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiMessageCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
    const { login, googleLogin } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (!result.success) {
            setErrors({ general: result.message });
        }
    };

    const handleGoogleLogin = () => {
        googleLogin();
    };

    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <FiMessageCircle />
                        </div>
                        <h1 className="auth-title">Welcome Back</h1>
                        <p className="auth-subtitle">Sign in to continue to ChatApp</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {errors.general && (
                            <div className="form-error" style={{ marginBottom: '16px', justifyContent: 'center' }}>
                                {errors.general}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-wrapper">
                                <FiMail className="input-icon" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={`form-input with-icon-left ${errors.email ? 'error' : ''}`}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="form-error">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`form-input with-icon-left with-icon-right ${errors.password ? 'error' : ''}`}
                                    autoComplete="current-password"
                                />
                                <span
                                    className="input-icon-right"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                            </div>
                            {errors.password && <span className="form-error">{errors.password}</span>}
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                            <Link to="/forgot-password" style={{ fontSize: '13px' }}>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? '' : 'Sign In'}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or</span>
                    </div>

                    <button
                        type="button"
                        className="btn btn-google btn-full"
                        onClick={handleGoogleLogin}
                    >
                        <FcGoogle />
                        Continue with Google
                    </button>

                    <p className="auth-footer">
                        Don't have an account? <Link to="/register">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
