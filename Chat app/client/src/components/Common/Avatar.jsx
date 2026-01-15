import { getInitials, getAvatarColor } from '../../utils/helpers';

const Avatar = ({
    src,
    name,
    size = 'md',
    isOnline = false,
    showStatus = false,
    className = ''
}) => {
    const sizeClass = {
        sm: 'sm',
        md: '',
        lg: 'lg',
        xl: 'xl',
        xxl: 'xxl',
    }[size];

    const initials = getInitials(name);
    const bgColor = getAvatarColor(name);

    return (
        <div className={`avatar ${sizeClass} ${className}`.trim()} style={!src ? { background: bgColor } : {}}>
            {src ? (
                <img src={src} alt={name} loading="lazy" />
            ) : (
                initials
            )}
            {showStatus && isOnline && <span className="online-indicator" />}
        </div>
    );
};

export default Avatar;
