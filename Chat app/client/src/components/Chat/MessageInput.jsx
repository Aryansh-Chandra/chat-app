import { useState, useRef, useEffect, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FiSmile, FiPaperclip, FiSend, FiX, FiImage } from 'react-icons/fi';

const MessageInput = ({
    onSend,
    replyTo,
    onCancelReply,
    sending,
    chatId,
    onTypingStart,
    onTypingStop,
}) => {
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [attachmentPreview, setAttachmentPreview] = useState(null);

    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isTypingRef = useRef(false);

    // Focus input when chat changes or on reply
    useEffect(() => {
        inputRef.current?.focus();
    }, [chatId, replyTo]);

    // Clear attachment when chat changes
    useEffect(() => {
        setAttachment(null);
        setAttachmentPreview(null);
        setMessage('');
    }, [chatId]);

    // Handle typing indicators
    const handleTyping = useCallback(() => {
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            onTypingStart();
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            isTypingRef.current = false;
            onTypingStop();
        }, 2000);
    }, [onTypingStart, onTypingStop]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                onTypingStop();
            }
        };
    }, [onTypingStop]);

    // Handle input change
    const handleChange = (e) => {
        setMessage(e.target.value);
        handleTyping();
    };

    // Handle emoji select
    const handleEmojiClick = (emojiData) => {
        setMessage((prev) => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    // Handle file select
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (25MB max)
        if (file.size > 25 * 1024 * 1024) {
            alert('File size must be less than 25MB');
            return;
        }

        setAttachment(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setAttachmentPreview(e.target?.result);
            };
            reader.readAsDataURL(file);
        } else {
            setAttachmentPreview(null);
        }

        // Reset file input
        e.target.value = '';
    };

    // Remove attachment
    const handleRemoveAttachment = () => {
        setAttachment(null);
        setAttachmentPreview(null);
    };

    // Handle send
    const handleSend = () => {
        if ((!message.trim() && !attachment) || sending) return;

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (isTypingRef.current) {
            isTypingRef.current = false;
            onTypingStop();
        }

        onSend(message, attachment);
        setMessage('');
        setAttachment(null);
        setAttachmentPreview(null);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-resize textarea
    const handleInput = (e) => {
        const target = e.target;
        target.style.height = 'auto';
        target.style.height = Math.min(target.scrollHeight, 120) + 'px';
    };

    return (
        <div className="message-input-container">
            {/* Reply bar */}
            {replyTo && (
                <div className="reply-bar">
                    <div className="reply-bar-content">
                        <div className="reply-bar-sender">
                            Replying to {replyTo.sender?.name || 'Unknown'}
                        </div>
                        <div className="reply-bar-text text-ellipsis">
                            {replyTo.content || 'Attachment'}
                        </div>
                    </div>
                    <button className="reply-bar-close" onClick={onCancelReply}>
                        <FiX />
                    </button>
                </div>
            )}

            {/* Attachment preview */}
            {attachment && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    marginBottom: '8px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                }}>
                    {attachmentPreview ? (
                        <img
                            src={attachmentPreview}
                            alt="Preview"
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: 'var(--radius-md)',
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '48px',
                            height: '48px',
                            background: 'var(--primary)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                        }}>
                            <FiPaperclip size={20} />
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-ellipsis" style={{ fontSize: '14px' }}>
                            {attachment.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {(attachment.size / 1024).toFixed(1)} KB
                        </div>
                    </div>
                    <button className="btn-icon" onClick={handleRemoveAttachment}>
                        <FiX />
                    </button>
                </div>
            )}

            {/* Input area */}
            <div className="message-input-wrapper">
                <div className="message-input-actions">
                    <button
                        className={`btn-icon ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Emoji"
                    >
                        <FiSmile />
                    </button>
                    <button
                        className="btn-icon"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                    >
                        <FiPaperclip />
                    </button>
                </div>

                <textarea
                    ref={inputRef}
                    className="message-input"
                    placeholder="Type a message"
                    value={message}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    onInput={handleInput}
                    rows={1}
                    disabled={sending}
                />

                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={(!message.trim() && !attachment) || sending}
                    title="Send"
                >
                    <FiSend />
                </button>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Emoji picker */}
            {showEmojiPicker && (
                <div className="emoji-picker-container">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme="dark"
                        searchPlaceholder="Search emoji..."
                        width={320}
                        height={400}
                        previewConfig={{ showPreview: false }}
                        skinTonesDisabled
                    />
                </div>
            )}

            {/* Click outside to close emoji picker */}
            {showEmojiPicker && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99,
                    }}
                    onClick={() => setShowEmojiPicker(false)}
                />
            )}
        </div>
    );
};

export default MessageInput;
