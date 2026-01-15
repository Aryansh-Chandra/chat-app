import { useEffect, useRef } from 'react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../Common/Avatar';
import {
    FiMic,
    FiMicOff,
    FiVideo,
    FiVideoOff,
    FiPhoneOff,
    FiMonitor,
    FiMaximize2,
    FiMinimize2
} from 'react-icons/fi';
import { formatCallDuration } from '../../utils/helpers';

const VideoCall = () => {
    const { user } = useAuth();
    const {
        callType,
        isGroupCall,
        participants,
        callDuration,
        isMuted,
        isVideoOff,
        isScreenSharing,
        localStreamRef,
        localVideoRef,
        remoteVideosRef,
        endCall,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
    } = useCall();

    const localVideoElement = useRef(null);

    // Set up local video
    useEffect(() => {
        if (localStreamRef.current && localVideoElement.current) {
            localVideoElement.current.srcObject = localStreamRef.current;
        }
    }, [localStreamRef.current]);

    // Get other participants (excluding self)
    const otherParticipants = participants.filter((p) => p._id !== user._id);

    // Determine grid layout
    const getGridClass = () => {
        if (otherParticipants.length === 0) return 'single';
        if (otherParticipants.length === 1) return 'single';
        if (otherParticipants.length <= 3) return 'double';
        return 'multi';
    };

    return (
        <div className="video-call-overlay">
            {/* Header */}
            <div className="video-call-header">
                <div className="video-call-info">
                    <h3>{isGroupCall ? 'Group Call' : otherParticipants[0]?.name || 'Calling...'}</h3>
                    <p>{formatCallDuration(callDuration)}</p>
                </div>
            </div>

            {/* Video Grid */}
            <div className={`video-call-grid ${getGridClass()}`}>
                {otherParticipants.length > 0 ? (
                    otherParticipants.map((participant) => (
                        <div key={participant._id} className={`video-tile ${participant.isVideoOff ? 'no-video' : ''}`}>
                            {participant.isVideoOff || participant.connecting ? (
                                <div className="video-tile-avatar">
                                    <Avatar
                                        src={participant.avatar}
                                        name={participant.name}
                                        size="xxl"
                                    />
                                    {participant.connecting && (
                                        <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                                            Connecting...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <video
                                    ref={(el) => {
                                        if (el) {
                                            remoteVideosRef.current[participant._id] = el;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                />
                            )}
                            <div className="video-tile-name">{participant.name}</div>
                            {participant.isMuted && (
                                <div className="video-tile-muted">
                                    <FiMicOff size={16} />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="video-tile no-video">
                        <div className="video-tile-avatar">
                            <Avatar src={user.avatar} name={user.name} size="xxl" />
                            <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>
                                Waiting for others to join...
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <div className={`local-video ${isVideoOff ? 'no-video' : ''}`}>
                {isVideoOff ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        background: 'var(--bg-secondary)'
                    }}>
                        <Avatar src={user.avatar} name={user.name} size="lg" />
                    </div>
                ) : (
                    <video
                        ref={localVideoElement}
                        autoPlay
                        playsInline
                        muted
                    />
                )}
            </div>

            {/* Controls */}
            <div className="video-call-controls">
                <button
                    className={`call-control-btn ${isMuted ? 'muted' : 'active'}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                >
                    {isMuted ? <FiMicOff /> : <FiMic />}
                </button>

                <button
                    className={`call-control-btn ${isVideoOff ? 'muted' : 'active'}`}
                    onClick={toggleVideo}
                    title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                    {isVideoOff ? <FiVideoOff /> : <FiVideo />}
                </button>

                <button
                    className={`call-control-btn ${isScreenSharing ? 'active' : 'muted'}`}
                    onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                    <FiMonitor />
                </button>

                <button
                    className="call-control-btn end-call"
                    onClick={endCall}
                    title="End call"
                >
                    <FiPhoneOff />
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
