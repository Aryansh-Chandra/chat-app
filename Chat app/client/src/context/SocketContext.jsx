import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const socketRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        if (isAuthenticated && user?._id) {
            const socketUrl = import.meta.env.VITE_SOCKET_URL || '';

            const newSocket = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('🔌 Socket connected');
                setIsConnected(true);
                // Setup user
                newSocket.emit('setup', user._id);
            });

            newSocket.on('disconnect', () => {
                console.log('🔌 Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                setIsConnected(false);
            });

            // Online/offline events
            newSocket.on('user online', (userId) => {
                setOnlineUsers((prev) => {
                    if (!prev.includes(userId)) {
                        return [...prev, userId];
                    }
                    return prev;
                });
            });

            newSocket.on('user offline', (userId) => {
                setOnlineUsers((prev) => prev.filter((id) => id !== userId));
            });

            // Typing events
            newSocket.on('typing', (data) => {
                setTypingUsers((prev) => {
                    const exists = prev.find(
                        (t) => t.chatId === data.chatId && t.userId === data.userId
                    );
                    if (!exists) {
                        return [...prev, data];
                    }
                    return prev;
                });
            });

            newSocket.on('stop typing', (data) => {
                setTypingUsers((prev) =>
                    prev.filter(
                        (t) => !(t.chatId === data.chatId && t.userId === data.userId)
                    )
                );
            });

            return () => {
                newSocket.disconnect();
                socketRef.current = null;
                setSocket(null);
                setIsConnected(false);
            };
        }
    }, [isAuthenticated, user?._id]);

    // Join a chat room
    const joinChat = useCallback((chatId) => {
        if (socketRef.current) {
            socketRef.current.emit('join chat', chatId);
        }
    }, []);

    // Leave a chat room
    const leaveChat = useCallback((chatId) => {
        if (socketRef.current) {
            socketRef.current.emit('leave chat', chatId);
        }
    }, []);

    // Send new message
    const sendMessage = useCallback((messageData) => {
        if (socketRef.current) {
            socketRef.current.emit('new message', messageData);
        }
    }, []);

    // Start typing
    const startTyping = useCallback((chatId) => {
        if (socketRef.current && user) {
            socketRef.current.emit('typing', {
                chatId,
                userId: user._id,
                userName: user.name,
            });
        }
    }, [user]);

    // Stop typing
    const stopTyping = useCallback((chatId) => {
        if (socketRef.current && user) {
            socketRef.current.emit('stop typing', {
                chatId,
                userId: user._id,
            });
        }
    }, [user]);

    // Mark messages as read
    const markMessagesRead = useCallback((chatId, messageIds) => {
        if (socketRef.current && user) {
            socketRef.current.emit('message read', {
                chatId,
                userId: user._id,
                messageIds,
            });
        }
    }, [user]);

    // Emit reaction
    const emitReaction = useCallback((chatId, messageId, reaction) => {
        if (socketRef.current) {
            socketRef.current.emit('reaction added', { chatId, messageId, reaction });
        }
    }, []);

    // Emit message deleted
    const emitMessageDeleted = useCallback((chatId, messageId) => {
        if (socketRef.current) {
            socketRef.current.emit('message deleted', { chatId, messageId });
        }
    }, []);

    // Emit message edited
    const emitMessageEdited = useCallback((chatId, message) => {
        if (socketRef.current) {
            socketRef.current.emit('message edited', { chatId, message });
        }
    }, []);

    // Check if user is online
    const isUserOnline = useCallback((userId) => {
        return onlineUsers.includes(userId);
    }, [onlineUsers]);

    // Get typing users for a chat
    const getTypingUsers = useCallback((chatId) => {
        return typingUsers.filter((t) => t.chatId === chatId && t.userId !== user?._id);
    }, [typingUsers, user?._id]);

    const value = {
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        joinChat,
        leaveChat,
        sendMessage,
        startTyping,
        stopTyping,
        markMessagesRead,
        emitReaction,
        emitMessageDeleted,
        emitMessageEdited,
        isUserOnline,
        getTypingUsers,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
