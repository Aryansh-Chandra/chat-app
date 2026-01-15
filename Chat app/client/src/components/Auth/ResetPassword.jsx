import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiLock, FiEye, FiEyeOff, FiMessageCircle, FiArrowLeft } from 'react-icons/fi';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { resetPassword } = useAuth();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await resetPassword(token, formData.password);
        setLoading(false);

        if (result.success) {
            navigate('/');
        } else {
            setErrors({ general: result.message });
        }
    };

    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <FiMessageCircle />
                        </div>
                        <h1 className="auth-title">Reset Password</h1>
                        <p className="auth-subtitle">Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {errors.general && (
                            <div className="form-error" style={{ marginBottom: '16px', justifyContent: 'center' }}>
                                {errors.general}
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <div className="input-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className={`form-input with-icon-left with-icon-right ${errors.password ? 'error' : ''}`}
                                    autoComplete="new-password"
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

                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <div className="input-wrapper">
                                <FiLock className="input-icon" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className={`form-input with-icon-left with-icon-right ${errors.confirmPassword ? 'error' : ''}`}
                                    autoComplete="new-password"
                                />
                                <span
                                    className="input-icon-right"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </span>
                            </div>
                            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
                            disabled={loading}
                            style={{ marginTop: '8px' }}
                        >
                            {loading ? '' : 'Reset Password'}
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

export default ResetPassword;
