// Format time for messages
export const formatMessageTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};

// Format date for chat list
export const formatChatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;

    if (diff < oneDay && d.getDate() === now.getDate()) {
        return formatMessageTime(date);
    } else if (diff < 2 * oneDay) {
        return 'Yesterday';
    } else if (diff < oneWeek) {
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }
};

// Format last seen time
export const formatLastSeen = (date) => {
    if (!date) return 'Never';

    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const oneMinute = 60 * 1000;
    const oneHour = 60 * oneMinute;
    const oneDay = 24 * oneHour;

    if (diff < oneMinute) {
        return 'Just now';
    } else if (diff < oneHour) {
        const mins = Math.floor(diff / oneMinute);
        return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diff < oneDay) {
        const hours = Math.floor(diff / oneHour);
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diff < 2 * oneDay) {
        return `Yesterday at ${formatMessageTime(date)}`;
    } else {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    }
};

// Get initials from name
export const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

// Get chat name (for one-on-one chats, get other user's name)
export const getChatName = (chat, currentUserId) => {
    if (chat.isGroupChat) {
        return chat.chatName;
    }
    const otherUser = chat.users.find((user) => user._id !== currentUserId);
    return otherUser?.name || 'Unknown User';
};

// Get chat avatar
export const getChatAvatar = (chat, currentUserId) => {
    if (chat.isGroupChat) {
        return chat.groupAvatar;
    }
    const otherUser = chat.users.find((user) => user._id !== currentUserId);
    return otherUser?.avatar;
};

// Get other user in one-on-one chat
export const getOtherUser = (chat, currentUserId) => {
    if (chat.isGroupChat) return null;
    return chat.users.find((user) => user._id !== currentUserId);
};

// Format file size
export const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('video/')) return '🎬';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('text')) return '📃';
    return '📎';
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// Validate email
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Generate random color for avatar background
export const getAvatarColor = (name) => {
    const colors = [
        '#00a884', '#5856d6', '#ff9500', '#ff2d55', '#af52de',
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    ];
    if (!name) return colors[0];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

// Check if user is typing
export const isUserTyping = (typingUsers, chatId, currentUserId) => {
    return typingUsers.filter(
        (t) => t.chatId === chatId && t.userId !== currentUserId
    );
};

// Format typing indicator text
export const formatTypingText = (typingUsers) => {
    if (!typingUsers || typingUsers.length === 0) return '';
    if (typingUsers.length === 1) {
        return `${typingUsers[0].userName} is typing...`;
    }
    if (typingUsers.length === 2) {
        return `${typingUsers[0].userName} and ${typingUsers[1].userName} are typing...`;
    }
    return 'Several people are typing...';
};

// Call duration formatter
export const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Detect if message contains only emojis
export const isOnlyEmojis = (text) => {
    const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\s]+$/u;
    return emojiRegex.test(text);
};
