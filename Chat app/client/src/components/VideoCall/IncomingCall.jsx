import { useCall } from '../../context/CallContext';
import Avatar from '../Common/Avatar';
import { FiPhone, FiPhoneOff, FiVideo } from 'react-icons/fi';

const IncomingCall = () => {
    const { incomingCall, answerCall, rejectCall } = useCall();

    if (!incomingCall) return null;

    const { callerName, callerAvatar, isVideo, isGroup } = incomingCall;

    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-card">
                <div className="incoming-call-avatar">
                    <Avatar
                        src={callerAvatar}
                        name={callerName}
                        size="xxl"
                    />
                </div>

                <h2 className="incoming-call-name">{callerName}</h2>
                <p className="incoming-call-type">
                    {isGroup ? 'Group ' : ''}
                    {isVideo ? 'Video' : 'Audio'} Call
                </p>

                <div className="incoming-call-actions">
                    <button
                        className="call-action-btn reject"
                        onClick={rejectCall}
                        title="Decline"
                    >
                        <FiPhoneOff />
                    </button>
                    <button
                        className="call-action-btn accept"
                        onClick={answerCall}
                        title="Accept"
                    >
                        {isVideo ? <FiVideo /> : <FiPhone />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCall;
