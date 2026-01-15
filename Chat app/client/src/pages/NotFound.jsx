import { Link } from 'react-router-dom';
import { FiMessageCircle, FiHome, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
    return (
        <div className="auth-layout">
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center' }}>
                    <div className="auth-logo" style={{ marginBottom: '24px' }}>
                        <FiMessageCircle />
                    </div>

                    <h1 style={{
                        fontSize: '80px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        marginBottom: '8px',
                        lineHeight: 1
                    }}>
                        404
                    </h1>

                    <h2 style={{
                        fontSize: '24px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '12px'
                    }}>
                        Page Not Found
                    </h2>

                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '32px',
                        fontSize: '15px'
                    }}>
                        The page you're looking for doesn't exist or has been moved.
                    </p>

                    <Link to="/" className="btn btn-primary">
                        <FiHome />
                        Go to Home
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="btn btn-secondary"
                        style={{ marginLeft: '12px' }}
                    >
                        <FiArrowLeft />
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
