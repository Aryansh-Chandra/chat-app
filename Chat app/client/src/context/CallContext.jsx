import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CallContext = createContext(null);

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    const { socket } = useSocket();
    const { user } = useAuth();

    // Call state
    const [isInCall, setIsInCall] = useState(false);
    const [callId, setCallId] = useState(null);
    const [callType, setCallType] = useState(null); // 'video' or 'audio'
    const [isGroupCall, setIsGroupCall] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [callDuration, setCallDuration] = useState(0);

    // Incoming call state
    const [incomingCall, setIncomingCall] = useState(null);

    // Media state
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Refs
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);
    const peersRef = useRef({});
    const durationIntervalRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({});

    // Cleanup function
    const cleanup = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
            localStreamRef.current = null;
        }

        // Stop screen stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        // Destroy all peers
        Object.values(peersRef.current).forEach((peer) => {
            if (peer && !peer.destroyed) {
                peer.destroy();
            }
        });
        peersRef.current = {};

        // Clear duration interval
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }

        // Reset state
        setIsInCall(false);
        setCallId(null);
        setCallType(null);
        setIsGroupCall(false);
        setParticipants([]);
        setCallDuration(0);
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        setIncomingCall(null);
    }, []);

    // Get user media
    const getUserMedia = useCallback(async (isVideo) => {
        try {
            const constraints = {
                audio: true,
                video: isVideo ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                } : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
            return stream;
        } catch (error) {
            console.error('Failed to get user media:', error);
            toast.error('Failed to access camera/microphone');
            throw error;
        }
    }, []);

    // Start a call
    const startCall = useCallback(async (targetUsers, isVideo = true, chatId = null, isGroup = false) => {
        try {
            const stream = await getUserMedia(isVideo);

            setIsInCall(true);
            setCallType(isVideo ? 'video' : 'audio');
            setIsVideoOff(!isVideo);
            setIsGroupCall(isGroup);
            setParticipants([{
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                isMuted: false,
                isVideoOff: !isVideo
            }]);

            // Start duration counter
            durationIntervalRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);

            if (isGroup) {
                // Group call
                const usersToCall = targetUsers.filter((u) => u._id !== user._id);

                usersToCall.forEach((targetUser) => {
                    const peer = new SimplePeer({
                        initiator: true,
                        trickle: false,
                        stream,
                    });

                    peer.on('signal', (data) => {
                        socket.emit('call user', {
                            userToCall: targetUser._id,
                            signalData: data,
                            from: user._id,
                            callerName: user.name,
                            callerAvatar: user.avatar,
                            isVideo,
                            isGroup: true,
                            chatId,
                            participants: targetUsers.map((u) => u._id),
                        });
                    });

                    peer.on('stream', (remoteStream) => {
                        if (remoteVideosRef.current[targetUser._id]) {
                            remoteVideosRef.current[targetUser._id].srcObject = remoteStream;
                        }
                    });

                    peer.on('error', (err) => {
                        console.error('Peer error:', err);
                    });

                    peersRef.current[targetUser._id] = peer;
                });
            } else {
                // One-on-one call
                const targetUser = targetUsers[0];

                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream,
                });

                peer.on('signal', (data) => {
                    socket.emit('call user', {
                        userToCall: targetUser._id,
                        signalData: data,
                        from: user._id,
                        callerName: user.name,
                        callerAvatar: user.avatar,
                        isVideo,
                        isGroup: false,
                    });
                });

                peer.on('stream', (remoteStream) => {
                    if (remoteVideosRef.current[targetUser._id]) {
                        remoteVideosRef.current[targetUser._id].srcObject = remoteStream;
                    }
                });

                peer.on('error', (err) => {
                    console.error('Peer error:', err);
                });

                peersRef.current[targetUser._id] = peer;

                setParticipants((prev) => [
                    ...prev,
                    {
                        _id: targetUser._id,
                        name: targetUser.name,
                        avatar: targetUser.avatar,
                        isMuted: false,
                        isVideoOff: true,
                        connecting: true,
                    },
                ]);
            }

            return true;
        } catch (error) {
            cleanup();
            return false;
        }
    }, [user, socket, getUserMedia, cleanup]);

    // Answer a call
    const answerCall = useCallback(async () => {
        if (!incomingCall) return;

        try {
            const stream = await getUserMedia(incomingCall.isVideo);

            setIsInCall(true);
            setCallId(incomingCall.callId);
            setCallType(incomingCall.isVideo ? 'video' : 'audio');
            setIsVideoOff(!incomingCall.isVideo);
            setIsGroupCall(incomingCall.isGroup);
            setParticipants([
                {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                    isMuted: false,
                    isVideoOff: !incomingCall.isVideo
                },
                {
                    _id: incomingCall.from,
                    name: incomingCall.callerName,
                    avatar: incomingCall.callerAvatar,
                    isMuted: false,
                    isVideoOff: false
                },
            ]);

            // Start duration counter
            durationIntervalRef.current = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);

            const peer = new SimplePeer({
                initiator: false,
                trickle: false,
                stream,
            });

            peer.on('signal', (data) => {
                socket.emit('answer call', {
                    signal: data,
                    to: incomingCall.from,
                    callId: incomingCall.callId,
                    userId: user._id,
                    userName: user.name,
                    userAvatar: user.avatar,
                });
            });

            peer.on('stream', (remoteStream) => {
                if (remoteVideosRef.current[incomingCall.from]) {
                    remoteVideosRef.current[incomingCall.from].srcObject = remoteStream;
                }
            });

            peer.on('error', (err) => {
                console.error('Peer error:', err);
            });

            peer.signal(incomingCall.signal);
            peersRef.current[incomingCall.from] = peer;

            setIncomingCall(null);
        } catch (error) {
            cleanup();
            setIncomingCall(null);
        }
    }, [incomingCall, user, socket, getUserMedia, cleanup]);

    // Reject a call
    const rejectCall = useCallback(() => {
        if (!incomingCall) return;

        socket.emit('reject call', {
            to: incomingCall.from,
            callId: incomingCall.callId,
            reason: 'rejected',
            userId: user._id,
        });

        setIncomingCall(null);
    }, [incomingCall, socket, user]);

    // End the call
    const endCall = useCallback(() => {
        const participantIds = participants.map((p) => p._id);

        socket.emit('end call', {
            callId,
            userId: user._id,
            participants: participantIds,
        });

        cleanup();
    }, [callId, participants, user, socket, cleanup]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);

                const participantIds = participants.map((p) => p._id);
                socket.emit('toggle audio', {
                    callId,
                    userId: user._id,
                    isMuted: !audioTrack.enabled,
                    participants: participantIds,
                });
            }
        }
    }, [callId, participants, user, socket]);

    // Toggle video
    const toggleVideo = useCallback(async () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];

            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            } else if (!isVideoOff) {
                // No video track, try to add one
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    const newVideoTrack = stream.getVideoTracks()[0];
                    localStreamRef.current.addTrack(newVideoTrack);

                    // Replace track in all peers
                    Object.values(peersRef.current).forEach((peer) => {
                        const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'video');
                        if (sender) {
                            sender.replaceTrack(newVideoTrack);
                        }
                    });

                    setIsVideoOff(false);
                } catch (error) {
                    console.error('Failed to enable video:', error);
                    toast.error('Failed to enable camera');
                    return;
                }
            }

            const participantIds = participants.map((p) => p._id);
            socket.emit('toggle video', {
                callId,
                userId: user._id,
                isVideoOff: !isVideoOff,
                participants: participantIds,
            });
        }
    }, [callId, participants, user, socket, isVideoOff]);

    // Start screen sharing
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true,
            });

            screenStreamRef.current = stream;
            const videoTrack = stream.getVideoTracks()[0];

            // Replace video track in all peers
            Object.values(peersRef.current).forEach((peer) => {
                const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });

            // Handle when user stops screen share from browser UI
            videoTrack.onended = () => {
                stopScreenShare();
            };

            setIsScreenSharing(true);

            const participantIds = participants.map((p) => p._id);
            socket.emit('screen share start', {
                callId,
                userId: user._id,
                participants: participantIds,
            });

            toast.success('Screen sharing started');
        } catch (error) {
            console.error('Failed to start screen share:', error);
            if (error.name !== 'NotAllowedError') {
                toast.error('Failed to share screen');
            }
        }
    }, [callId, participants, user, socket]);

    // Stop screen sharing
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((track) => track.stop());
            screenStreamRef.current = null;
        }

        // Restore camera video
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                Object.values(peersRef.current).forEach((peer) => {
                    const sender = peer._pc?.getSenders().find((s) => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(videoTrack);
                    }
                });
            }
        }

        setIsScreenSharing(false);

        const participantIds = participants.map((p) => p._id);
        socket.emit('screen share stop', {
            callId,
            userId: user._id,
            participants: participantIds,
        });

        toast.success('Screen sharing stopped');
    }, [callId, participants, user, socket]);

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Incoming call
        socket.on('incoming call', (data) => {
            setIncomingCall(data);
        });

        // Call accepted
        socket.on('call accepted', (data) => {
            const peer = peersRef.current[data.userId];
            if (peer) {
                peer.signal(data.signal);

                setParticipants((prev) =>
                    prev.map((p) =>
                        p._id === data.userId
                            ? { ...p, connecting: false }
                            : p
                    )
                );
            }
        });

        // Call rejected
        socket.on('call rejected', (data) => {
            toast.error('Call was declined');
            cleanup();
        });

        // Call ended
        socket.on('call ended', (data) => {
            toast.info('Call ended');
            cleanup();
        });

        // User audio toggle
        socket.on('user audio toggle', (data) => {
            setParticipants((prev) =>
                prev.map((p) =>
                    p._id === data.userId ? { ...p, isMuted: data.isMuted } : p
                )
            );
        });

        // User video toggle
        socket.on('user video toggle', (data) => {
            setParticipants((prev) =>
                prev.map((p) =>
                    p._id === data.userId ? { ...p, isVideoOff: data.isVideoOff } : p
                )
            );
        });

        // User screen share
        socket.on('user screen share', (data) => {
            setParticipants((prev) =>
                prev.map((p) =>
                    p._id === data.userId ? { ...p, isScreenSharing: data.isSharing } : p
                )
            );
        });

        // ICE candidate
        socket.on('ice candidate', (data) => {
            const peer = peersRef.current[data.from];
            if (peer) {
                peer.signal(data.candidate);
            }
        });

        return () => {
            socket.off('incoming call');
            socket.off('call accepted');
            socket.off('call rejected');
            socket.off('call ended');
            socket.off('user audio toggle');
            socket.off('user video toggle');
            socket.off('user screen share');
            socket.off('ice candidate');
        };
    }, [socket, cleanup]);

    const value = {
        // State
        isInCall,
        callId,
        callType,
        isGroupCall,
        participants,
        callDuration,
        incomingCall,
        isMuted,
        isVideoOff,
        isScreenSharing,

        // Refs
        localStreamRef,
        localVideoRef,
        remoteVideosRef,

        // Actions
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        startScreenShare,
        stopScreenShare,
    };

    return (
        <CallContext.Provider value={value}>
            {children}
        </CallContext.Provider>
    );
};

export default CallContext;
