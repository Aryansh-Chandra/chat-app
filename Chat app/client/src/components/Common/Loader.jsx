import { FiMessageCircle } from 'react-icons/fi';

const Loader = ({ fullPage = false, size = 'md' }) => {
    if (fullPage) {
        return (
            <div className="page-loader">
                <div className="page-loader-logo">
                    <FiMessageCircle style={{ width: 40, height: 40, color: 'white' }} />
                </div>
                <div className={`loader ${size}`}></div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading...</p>
            </div>
        );
    }

    return <div className={`loader ${size}`}></div>;
};

export default Loader;
