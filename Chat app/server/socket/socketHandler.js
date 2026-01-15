import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// Store active video calls
const activeCalls = new Map();
// Store typing users
const typingUsers = new Map();

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.id}`);

        // Setup user - called when user logs in
        socket.on('setup', async (userId) => {
            try {
                socket.join(userId);
                socket.userId = userId;

                // Update user online status
                await User.findByIdAndUpdate(userId, {
                    isOnline: true,
                    socketId: socket.id,
                    lastSeen: new Date(),
                });

                // Notify all users that this user is online
                socket.broadcast.emit('user online', userId);

                console.log(`✅ User ${userId} is online`);
            } catch (error) {
                console.error('Setup error:', error);
            }
        });

        // Join a chat room
        socket.on('join chat', (chatId) => {
            socket.join(chatId);
            console.log(`User joined chat: ${chatId}`);
        });

        // Leave a chat room
        socket.on('leave chat', (chatId) => {
            socket.leave(chatId);
            console.log(`User left chat: ${chatId}`);
        });

        // New message
        socket.on('new message', async (messageData) => {
            try {
                const chat = await Chat.findById(messageData.chat._id || messageData.chat);

                if (!chat || !chat.users) return;

                // Emit to all users in the chat except sender
                chat.users.forEach((userId) => {
                    if (userId.toString() === messageData.sender._id.toString()) return;
                    socket.to(userId.toString()).emit('message received', messageData);
                });
            } catch (error) {
                console.error('New message socket error:', error);
            }
        });

        // Typing indicator
        socket.on('typing', (data) => {
            const { chatId, userId, userName } = data;
            const key = `${chatId}-${userId}`;
            typingUsers.set(key, { chatId, userId, userName, timestamp: Date.now() });
            socket.to(chatId).emit('typing', { chatId, userId, userName });
        });

        // Stop typing
        socket.on('stop typing', (data) => {
            const { chatId, userId } = data;
            const key = `${chatId}-${userId}`;
            typingUsers.delete(key);
            socket.to(chatId).emit('stop typing', { chatId, userId });
        });

        // Message read
        socket.on('message read', (data) => {
            const { chatId, userId, messageIds } = data;
            socket.to(chatId).emit('messages read', { chatId, userId, messageIds });
        });

        // Reaction added
        socket.on('reaction added', (data) => {
            const { chatId, messageId, reaction } = data;
            socket.to(chatId).emit('reaction update', { messageId, reaction });
        });

        // Message deleted
        socket.on('message deleted', (data) => {
            const { chatId, messageId } = data;
            socket.to(chatId).emit('message removed', { messageId });
        });

        // Message edited
        socket.on('message edited', (data) => {
            const { chatId, message } = data;
            socket.to(chatId).emit('message updated', { message });
        });

        // ============== VIDEO CALL EVENTS ==============

        // Initiate a call
        socket.on('call user', async (data) => {
            const { userToCall, signalData, from, callerName, callerAvatar, isVideo, isGroup, chatId, participants } = data;

            if (isGroup) {
                // Group call
                const callId = `group-${chatId}-${Date.now()}`;
                activeCalls.set(callId, {
                    chatId,
                    initiator: from,
                    participants: [from],
                    isGroup: true,
                    isVideo,
                    startTime: Date.now(),
                });

                // Notify all participants
                participants.forEach((userId) => {
                    if (userId !== from) {
                        io.to(userId).emit('incoming call', {
                            signal: signalData,
                            from,
                            callerName,
                            callerAvatar,
                            isVideo,
                            isGroup: true,
                            callId,
                            chatId,
                        });
                    }
                });
            } else {
                // One-on-one call
                const callId = `call-${from}-${userToCall}-${Date.now()}`;
                activeCalls.set(callId, {
                    caller: from,
                    receiver: userToCall,
                    isGroup: false,
                    isVideo,
                    startTime: Date.now(),
                });

                io.to(userToCall).emit('incoming call', {
                    signal: signalData,
                    from,
                    callerName,
                    callerAvatar,
                    isVideo,
                    isGroup: false,
                    callId,
                });
            }
        });

        // Answer a call
        socket.on('answer call', (data) => {
            const { signal, to, callId, userId, userName, userAvatar } = data;

            // Update call participants
            const call = activeCalls.get(callId);
            if (call && call.isGroup) {
                call.participants.push(userId);
            }

            io.to(to).emit('call accepted', {
                signal,
                callId,
                userId,
                userName,
                userAvatar,
            });
        });

        // Reject a call
        socket.on('reject call', (data) => {
            const { to, callId, reason, userId } = data;

            io.to(to).emit('call rejected', { callId, reason, userId });

            // Clean up if call is cancelled
            if (activeCalls.has(callId)) {
                const call = activeCalls.get(callId);
                if (!call.isGroup) {
                    activeCalls.delete(callId);
                }
            }
        });

        // End a call
        socket.on('end call', (data) => {
            const { callId, userId, participants } = data;

            if (participants) {
                participants.forEach((participantId) => {
                    if (participantId !== userId) {
                        io.to(participantId).emit('call ended', { callId, endedBy: userId });
                    }
                });
            }

            activeCalls.delete(callId);
        });

        // Toggle audio
        socket.on('toggle audio', (data) => {
            const { callId, userId, isMuted, participants } = data;

            if (participants) {
                participants.forEach((participantId) => {
                    if (participantId !== userId) {
                        io.to(participantId).emit('user audio toggle', { userId, isMuted });
                    }
                });
            }
        });

        // Toggle video
        socket.on('toggle video', (data) => {
            const { callId, userId, isVideoOff, participants } = data;

            if (participants) {
                participants.forEach((participantId) => {
                    if (participantId !== userId) {
                        io.to(participantId).emit('user video toggle', { userId, isVideoOff });
                    }
                });
            }
        });

        // Screen sharing started
        socket.on('screen share start', (data) => {
            const { callId, userId, participants } = data;

            if (participants) {
                participants.forEach((participantId) => {
                    if (participantId !== userId) {
                        io.to(participantId).emit('user screen share', { userId, isSharing: true });
                    }
                });
            }
        });

        // Screen sharing stopped
        socket.on('screen share stop', (data) => {
            const { callId, userId, participants } = data;

            if (participants) {
                participants.forEach((participantId) => {
                    if (participantId !== userId) {
                        io.to(participantId).emit('user screen share', { userId, isSharing: false });
                    }
                });
            }
        });

        // ICE candidate exchange
        socket.on('ice candidate', (data) => {
            const { candidate, to } = data;
            io.to(to).emit('ice candidate', { candidate, from: socket.userId });
        });

        // ============== GROUP MANAGEMENT EVENTS ==============

        // User added to group
        socket.on('group user added', (data) => {
            const { chatId, addedUser, addedBy } = data;
            io.to(addedUser._id).emit('added to group', { chatId });
            socket.to(chatId).emit('group member added', { addedUser, addedBy });
        });

        // User removed from group
        socket.on('group user removed', (data) => {
            const { chatId, removedUserId, removedBy } = data;
            io.to(removedUserId).emit('removed from group', { chatId });
            socket.to(chatId).emit('group member removed', { removedUserId, removedBy });
        });

        // Group updated
        socket.on('group updated', (data) => {
            const { chatId, updates } = data;
            socket.to(chatId).emit('group info updated', { chatId, updates });
        });

        // ============== DISCONNECT ==============

        socket.on('disconnect', async () => {
            console.log(`🔌 User disconnected: ${socket.id}`);

            if (socket.userId) {
                try {
                    await User.findByIdAndUpdate(socket.userId, {
                        isOnline: false,
                        lastSeen: new Date(),
                        socketId: null,
                    });

                    // Notify all users that this user is offline
                    socket.broadcast.emit('user offline', socket.userId);

                    // Clean up any active calls
                    for (const [callId, call] of activeCalls) {
                        if (call.caller === socket.userId || call.receiver === socket.userId) {
                            const otherUser = call.caller === socket.userId ? call.receiver : call.caller;
                            io.to(otherUser).emit('call ended', { callId, endedBy: socket.userId, reason: 'disconnected' });
                            activeCalls.delete(callId);
                        } else if (call.isGroup && call.participants.includes(socket.userId)) {
                            call.participants = call.participants.filter((p) => p !== socket.userId);
                            call.participants.forEach((p) => {
                                io.to(p).emit('participant left', { callId, userId: socket.userId });
                            });
                            if (call.participants.length === 0) {
                                activeCalls.delete(callId);
                            }
                        }
                    }

                    // Clean up typing indicators
                    for (const [key, value] of typingUsers) {
                        if (value.userId === socket.userId) {
                            typingUsers.delete(key);
                        }
                    }
                } catch (error) {
                    console.error('Disconnect error:', error);
                }
            }
        });
    });
};

export default socketHandler;
