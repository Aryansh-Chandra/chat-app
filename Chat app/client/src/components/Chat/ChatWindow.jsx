import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { messageAPI } from '../../services/api';
import Avatar from '../Common/Avatar';
import Loader from '../Common/Loader';
import MessageInput from './MessageInput';
import {
    FiArrowLeft,
    FiPhone,
    FiVideo,
    FiMoreVertical,
    FiUsers,
    FiCheck,
    FiCheckCircle,
    FiImage,
    FiFile,
    FiDownload,
    FiSmile
} from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';
import {
    getChatName,
    getChatAvatar,
    getOtherUser,
    formatMessageTime,
    formatLastSeen,
    formatFileSize,
    getFileIcon,
    isOnlyEmojis
} from '../../utils/helpers';
import toast from 'react-hot-toast';

const ChatWindow = ({ chat, onBack, onChatUpdate }) => {
    const { user } = useAuth();
    const { socket, isUserOnline, getTypingUsers, sendMessage: socketSendMessage, markMessagesRead, startTyping, stopTyping, emitReaction } = useSocket();
    const { startCall } = useCall();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null); // messageId for reaction picker
    const [hasMore, setHasMore] = useState(false);
    const [page, setPage] = useState(1);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const isScrolledToBottom = useRef(true);

    // Fetch messages
    const fetchMessages = useCallback(async (pageNum = 1, append = false) => {
        if (!chat) return;

        setLoading(true);
        try {
            const response = await messageAPI.getAll(chat._id, pageNum);
            const newMessages = response.data.messages;

            if (append) {
                setMessages((prev) => [...newMessages, ...prev]);
            } else {
                setMessages(newMessages);
            }

            setHasMore(response.data.pagination.hasMore);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [chat]);

    // Fetch messages when chat changes
    useEffect(() => {
        if (chat) {
            fetchMessages(1);
            markMessagesRead(chat._id, []);
        }
    }, [chat?._id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll to bottom on new messages
    useEffect(() => {
        if (isScrolledToBottom.current && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Listen for new messages
    useEffect(() => {
        if (!socket || !chat) return;

        const handleMessageReceived = (message) => {
            if (message.chat._id === chat._id || message.chat === chat._id) {
                setMessages((prev) => [...prev, message]);
                markMessagesRead(chat._id, [message._id]);
            }
        };

        const handleReactionUpdate = ({ messageId, reaction }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
                        : msg
                )
            );
        };

        const handleMessageRemoved = ({ messageId }) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg._id === messageId
                        ? { ...msg, isDeleted: true, content: 'This message was deleted' }
                        : msg
                )
            );
        };

        const handleMessageUpdated = ({ message }) => {
            setMessages((prev) =>
                prev.map((msg) => (msg._id === message._id ? message : msg))
            );
        };

        socket.on('message received', handleMessageReceived);
        socket.on('reaction update', handleReactionUpdate);
        socket.on('message removed', handleMessageRemoved);
        socket.on('message updated', handleMessageUpdated);

        return () => {
            socket.off('message received', handleMessageReceived);
            socket.off('reaction update', handleReactionUpdate);
            socket.off('message removed', handleMessageRemoved);
            socket.off('message updated', handleMessageUpdated);
        };
    }, [socket, chat?._id, markMessagesRead]);

    // Handle scroll for infinite loading
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;

        // Check if scrolled to bottom
        isScrolledToBottom.current = scrollHeight - scrollTop - clientHeight < 50;

        // Load more on scroll to top
        if (scrollTop === 0 && hasMore && !loading) {
            fetchMessages(page + 1, true);
        }
    }, [hasMore, loading, page, fetchMessages]);

    // Send message
    const handleSendMessage = async (content, attachment) => {
        if (!chat || (!content.trim() && !attachment)) return;

        setSending(true);
        try {
            const messageData = {
                chatId: chat._id,
                content: content.trim(),
                replyTo: replyTo?._id,
            };

            if (attachment) {
                messageData.attachment = attachment;
            }

            const response = await messageAPI.send(messageData);
            const newMessage = response.data.message;

            setMessages((prev) => [...prev, newMessage]);
            socketSendMessage({ ...newMessage, chat });
            setReplyTo(null);

            // Update chat in parent
            if (onChatUpdate) {
                onChatUpdate({ ...chat, latestMessage: newMessage });
            }

            // Scroll to bottom
            isScrolledToBottom.current = true;
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Add reaction
    const handleReaction = async (messageId, emoji) => {
        try {
            const response = await messageAPI.addReaction(messageId, emoji);
            const updatedMessage = response.data.message;

            setMessages((prev) =>
                prev.map((msg) => (msg._id === messageId ? updatedMessage : msg))
            );

            emitReaction(chat._id, messageId, { user: user._id, emoji });
            setShowEmojiPicker(null);
        } catch (error) {
            console.error('Failed to add reaction:', error);
        }
    };

    // Start video call
    const handleVideoCall = () => {
        if (chat.isGroupChat) {
            startCall(chat.users, true, chat._id, true);
        } else {
            const otherUser = getOtherUser(chat, user._id);
            if (otherUser) {
                startCall([otherUser], true, null, false);
            }
        }
    };

    // Start audio call
    const handleAudioCall = () => {
        if (chat.isGroupChat) {
            startCall(chat.users, false, chat._id, true);
        } else {
            const otherUser = getOtherUser(chat, user._id);
            if (otherUser) {
                startCall([otherUser], false, null, false);
            }
        }
    };

    // Get typing users text
    const typingUsers = chat ? getTypingUsers(chat._id) : [];
    const typingText = typingUsers.length > 0
        ? typingUsers.length === 1
            ? `${typingUsers[0].userName} is typing...`
            : 'Several people are typing...'
        : null;

    // Empty state
    if (!chat) {
        return (
            <div className="chat-window-empty">
                <div className="chat-window-empty-icon">
                    <svg viewBox="0 0 303 172" width="200" height="200" preserveAspectRatio="xMidYMid meet">
                        <path fill="#00a884" d="M229.565 160.229c32.647-25.618 50.18-67.153 39.181-106.128C250.47 7.087 194.762-15.159 141.224 9.738c-35.846 16.67-58.738 52.205-59.508 90.606-.595 29.73 11.158 58.199 33.501 79.168 4.457 4.183 14.674 14.46 14.674 14.46s35.773-.284 63.213-.023c29.212.277 35.093-32.653 36.461-33.72z"></path>
                        <path fill="#025144" d="M115.479 91.12c-8.618 0-15.611 6.994-15.611 15.611 0 8.618 6.993 15.611 15.611 15.611 8.617 0 15.61-6.993 15.61-15.611 0-8.617-6.993-15.611-15.61-15.611zm69.371 0c-8.617 0-15.611 6.994-15.611 15.611 0 8.618 6.994 15.611 15.611 15.611 8.618 0 15.611-6.993 15.611-15.611 0-8.617-6.993-15.611-15.611-15.611z"></path>
                    </svg>
                </div>
                <h2>ChatApp Web</h2>
                <p>
                    Send and receive messages, make video calls, share files, and stay connected with your friends and groups.
                </p>
            </div>
        );
    }

    const chatName = getChatName(chat, user._id);
    const chatAvatar = getChatAvatar(chat, user._id);
    const otherUser = getOtherUser(chat, user._id);
    const isOnline = !chat.isGroupChat && otherUser && isUserOnline(otherUser._id);

    // Get status text
    let statusText = '';
    if (typingText) {
        statusText = typingText;
    } else if (chat.isGroupChat) {
        statusText = `${chat.users.length} members`;
    } else if (isOnline) {
        statusText = 'online';
    } else if (otherUser?.lastSeen) {
        statusText = `last seen ${formatLastSeen(otherUser.lastSeen)}`;
    }

    return (
        <div className="chat-window">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-info">
                    {onBack && (
                        <button className="btn-icon" onClick={onBack} style={{ marginRight: '8px' }}>
                            <FiArrowLeft />
                        </button>
                    )}
                    <div className="chat-item-avatar">
                        <Avatar src={chatAvatar} name={chatName} isOnline={isOnline} showStatus={!chat.isGroupChat} />
                    </div>
                    <div className="chat-header-details">
                        <h3>{chatName}</h3>
                        <p style={typingText ? { color: 'var(--primary)' } : {}}>
                            {statusText}
                        </p>
                    </div>
                </div>
                <div className="chat-header-actions">
                    <button className="btn-icon" onClick={handleVideoCall} title="Video call">
                        <FiVideo />
                    </button>
                    <button className="btn-icon" onClick={handleAudioCall} title="Audio call">
                        <FiPhone />
                    </button>
                    <button className="btn-icon" title="More options">
                        <FiMoreVertical />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                className="messages-container"
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {loading && page === 1 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                        <Loader />
                    </div>
                ) : (
                    <>
                        {hasMore && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                                {loading ? <Loader size="sm" /> : null}
                            </div>
                        )}

                        {messages.map((message, index) => {
                            const isSent = message.sender?._id === user._id;
                            const showSender = chat.isGroupChat && !isSent &&
                                (index === 0 || messages[index - 1]?.sender?._id !== message.sender?._id);
                            const isEmojiOnly = message.content && isOnlyEmojis(message.content);

                            return (
                                <div
                                    key={message._id}
                                    className={`message-wrapper ${isSent ? 'sent' : 'received'}`}
                                >
                                    <div
                                        className="message-bubble"
                                        style={isEmojiOnly ? {
                                            background: 'transparent',
                                            padding: '0',
                                            fontSize: '48px'
                                        } : {}}
                                    >
                                        {showSender && (
                                            <div className="message-sender">
                                                {message.sender?.name}
                                            </div>
                                        )}

                                        {/* Reply preview */}
                                        {message.replyTo && !message.isDeleted && (
                                            <div className="reply-preview">
                                                <div className="reply-preview-sender">
                                                    {message.replyTo.sender?.name || 'Unknown'}
                                                </div>
                                                <div className="reply-preview-content">
                                                    {message.replyTo.content || 'Attachment'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Message content */}
                                        {message.isDeleted ? (
                                            <div className="message-content" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                                                🚫 This message was deleted
                                            </div>
                                        ) : (
                                            <>
                                                {/* Image */}
                                                {message.messageType === 'image' && message.attachment?.url && (
                                                    <img
                                                        src={message.attachment.url}
                                                        alt="Shared image"
                                                        className="message-image"
                                                        loading="lazy"
                                                        onClick={() => window.open(message.attachment.url, '_blank')}
                                                    />
                                                )}

                                                {/* File */}
                                                {message.messageType === 'file' && message.attachment && (
                                                    <a
                                                        href={message.attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="message-file"
                                                    >
                                                        <div className="message-file-icon">
                                                            {getFileIcon(message.attachment.mimeType)}
                                                        </div>
                                                        <div className="message-file-info">
                                                            <div className="message-file-name text-ellipsis">
                                                                {message.attachment.fileName}
                                                            </div>
                                                            <div className="message-file-size">
                                                                {formatFileSize(message.attachment.fileSize)}
                                                            </div>
                                                        </div>
                                                        <FiDownload />
                                                    </a>
                                                )}

                                                {/* Text content */}
                                                {message.content && (
                                                    <div
                                                        className="message-content"
                                                        style={isEmojiOnly ? { lineHeight: 1 } : {}}
                                                    >
                                                        {message.content}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Footer */}
                                        {!isEmojiOnly && (
                                            <div className="message-footer">
                                                {message.isEdited && (
                                                    <span style={{ fontSize: '11px', marginRight: '4px' }}>edited</span>
                                                )}
                                                <span className="message-time">
                                                    {formatMessageTime(message.createdAt)}
                                                </span>
                                                {isSent && (
                                                    <span className={`message-status ${message.readBy?.length > 1 ? 'read' : ''}`}>
                                                        {message.readBy?.length > 1 ? <FiCheckCircle size={14} /> : <FiCheck size={14} />}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Reaction button */}
                                        {!message.isDeleted && (
                                            <button
                                                className="btn-icon"
                                                style={{
                                                    position: 'absolute',
                                                    [isSent ? 'left' : 'right']: '-32px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    opacity: 0.6,
                                                    width: '28px',
                                                    height: '28px',
                                                }}
                                                onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                                            >
                                                <FiSmile size={16} />
                                            </button>
                                        )}

                                        {/* Emoji picker for reactions */}
                                        {showEmojiPicker === message._id && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    [isSent ? 'right' : 'left']: 0,
                                                    bottom: '100%',
                                                    zIndex: 100,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '4px',
                                                        background: 'var(--bg-dropdown)',
                                                        padding: '8px',
                                                        borderRadius: '20px',
                                                        boxShadow: 'var(--shadow-lg)',
                                                    }}
                                                >
                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(message._id, emoji)}
                                                            style={{
                                                                fontSize: '20px',
                                                                padding: '4px 8px',
                                                                background: 'none',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px',
                                                                transition: 'all 0.15s',
                                                            }}
                                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Reactions */}
                                    {message.reactions?.length > 0 && (
                                        <div className="message-reactions">
                                            {Object.entries(
                                                message.reactions.reduce((acc, r) => {
                                                    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                                    return acc;
                                                }, {})
                                            ).map(([emoji, count]) => (
                                                <span
                                                    key={emoji}
                                                    className={`reaction-badge ${message.reactions.find(r => r.user?._id === user._id && r.emoji === emoji) ? 'own' : ''}`}
                                                    onClick={() => handleReaction(message._id, emoji)}
                                                >
                                                    {emoji} {count > 1 && count}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Typing indicator */}
                        {typingUsers.length > 0 && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <MessageInput
                onSend={handleSendMessage}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                sending={sending}
                chatId={chat._id}
                onTypingStart={() => startTyping(chat._id)}
                onTypingStop={() => stopTyping(chat._id)}
            />

            {/* Click outside to close emoji picker */}
            {showEmojiPicker && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                    }}
                    onClick={() => setShowEmojiPicker(null)}
                />
            )}
        </div>
    );
};

export default ChatWindow;
