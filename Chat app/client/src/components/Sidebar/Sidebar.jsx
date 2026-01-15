import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { userAPI, chatAPI } from '../../services/api';
import Avatar from '../Common/Avatar';
import Modal from '../Common/Modal';
import Loader from '../Common/Loader';
import {
    FiSearch,
    FiMessageSquare,
    FiUsers,
    FiMoreVertical,
    FiLogOut,
    FiUser,
    FiX
} from 'react-icons/fi';
import { getChatName, getChatAvatar, getOtherUser, formatChatDate, truncateText } from '../../utils/helpers';
import toast from 'react-hot-toast';

const Sidebar = ({ chats, selectedChat, onSelectChat, onNewChat, loading, className = '' }) => {
    const { user, logout } = useAuth();
    const { isUserOnline, getTypingUsers } = useSocket();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const dropdownRef = useRef(null);
    const searchTimeoutRef = useRef(null);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim()) {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const response = await userAPI.search(searchQuery);
                    setSearchResults(response.data.users);
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
        } else {
            setSearchResults([]);
        }

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle user click (start chat)
    const handleUserClick = async (targetUser) => {
        try {
            const response = await chatAPI.access(targetUser._id);
            setSearchQuery('');
            setShowSearch(false);
            onNewChat(response.data.chat);
        } catch (error) {
            toast.error('Failed to start chat');
        }
    };

    // Handle logout
    const handleLogout = () => {
        setShowDropdown(false);
        logout();
    };

    // Get typing text for a chat
    const getTypingText = (chatId) => {
        const typingUsers = getTypingUsers(chatId);
        if (typingUsers.length === 0) return null;

        if (typingUsers.length === 1) {
            return 'typing...';
        }
        return 'typing...';
    };

    // Render chat list item
    const renderChatItem = (chat) => {
        const chatName = getChatName(chat, user._id);
        const chatAvatar = getChatAvatar(chat, user._id);
        const otherUser = getOtherUser(chat, user._id);
        const isOnline = !chat.isGroupChat && otherUser && isUserOnline(otherUser._id);
        const typingText = getTypingText(chat._id);

        let lastMessage = '';
        if (typingText) {
            lastMessage = typingText;
        } else if (chat.latestMessage) {
            const sender = chat.latestMessage.sender?._id === user._id ? 'You: ' : '';
            if (chat.latestMessage.messageType === 'image') {
                lastMessage = `${sender}📷 Photo`;
            } else if (chat.latestMessage.messageType === 'file') {
                lastMessage = `${sender}📎 File`;
            } else {
                lastMessage = `${sender}${truncateText(chat.latestMessage.content, 35)}`;
            }
        }

        return (
            <div
                key={chat._id}
                className={`chat-item ${selectedChat?._id === chat._id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat)}
            >
                <div className="chat-item-avatar">
                    <Avatar
                        src={chatAvatar}
                        name={chatName}
                        isOnline={isOnline}
                        showStatus={!chat.isGroupChat}
                    />
                </div>
                <div className="chat-item-info">
                    <div className="chat-item-header">
                        <span className="chat-item-name text-ellipsis">{chatName}</span>
                        {chat.latestMessage && (
                            <span className="chat-item-time">
                                {formatChatDate(chat.latestMessage.createdAt)}
                            </span>
                        )}
                    </div>
                    <div className="chat-item-message text-ellipsis" style={typingText ? { color: 'var(--primary)' } : {}}>
                        {chat.isGroupChat && !typingText && chat.latestMessage && (
                            <span style={{ color: 'var(--text-muted)' }}>
                                {chat.latestMessage.sender?.name?.split(' ')[0]}:{' '}
                            </span>
                        )}
                        {lastMessage || 'No messages yet'}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`sidebar ${className}`}>
            {/* Header */}
            <div className="sidebar-header">
                <div className="sidebar-header-user" onClick={() => setShowProfileModal(true)}>
                    <Avatar src={user?.avatar} name={user?.name} size="sm" />
                    <span style={{ fontWeight: 500 }}>{user?.name?.split(' ')[0]}</span>
                </div>

                <div className="sidebar-header-actions">
                    <button
                        className="btn-icon"
                        onClick={() => setShowNewGroupModal(true)}
                        title="New group"
                    >
                        <FiUsers />
                    </button>
                    <button
                        className={`btn-icon ${showSearch ? 'active' : ''}`}
                        onClick={() => setShowSearch(!showSearch)}
                        title="New chat"
                    >
                        <FiMessageSquare />
                    </button>
                    <div className="dropdown" ref={dropdownRef}>
                        <button
                            className="btn-icon"
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <FiMoreVertical />
                        </button>
                        {showDropdown && (
                            <div className="dropdown-menu">
                                <div
                                    className="dropdown-item"
                                    onClick={() => {
                                        setShowDropdown(false);
                                        setShowProfileModal(true);
                                    }}
                                >
                                    <FiUser />
                                    Profile
                                </div>
                                <div className="dropdown-item danger" onClick={handleLogout}>
                                    <FiLogOut />
                                    Logout
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="search-container">
                <div className="search-wrapper">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder={showSearch ? "Search users to chat..." : "Search or start new chat"}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowSearch(true)}
                    />
                    {(searchQuery || showSearch) && (
                        <button
                            className="btn-icon"
                            style={{ padding: '4px' }}
                            onClick={() => {
                                setSearchQuery('');
                                setShowSearch(false);
                            }}
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat List / Search Results */}
            <div className="chat-list">
                {showSearch && searchQuery ? (
                    // Search Results
                    isSearching ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader size="sm" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((searchUser) => (
                            <div
                                key={searchUser._id}
                                className="chat-item"
                                onClick={() => handleUserClick(searchUser)}
                            >
                                <div className="chat-item-avatar">
                                    <Avatar
                                        src={searchUser.avatar}
                                        name={searchUser.name}
                                        isOnline={isUserOnline(searchUser._id)}
                                        showStatus
                                    />
                                </div>
                                <div className="chat-item-info">
                                    <div className="chat-item-header">
                                        <span className="chat-item-name">{searchUser.name}</span>
                                    </div>
                                    <div className="chat-item-message text-ellipsis">
                                        {searchUser.about || searchUser.email}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No users found
                        </div>
                    )
                ) : loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader size="sm" />
                    </div>
                ) : chats.length > 0 ? (
                    chats.map(renderChatItem)
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        <FiMessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No chats yet</p>
                        <p style={{ fontSize: '13px' }}>Search for users to start chatting</p>
                    </div>
                )}
            </div>

            {/* New Group Modal */}
            <NewGroupModal
                isOpen={showNewGroupModal}
                onClose={() => setShowNewGroupModal(false)}
                onGroupCreated={onNewChat}
            />

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
            />
        </div>
    );
};

// New Group Modal Component
const NewGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
    const [step, setStep] = useState(1);
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setGroupName('');
            setDescription('');
            setSelectedUsers([]);
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [isOpen]);

    // Search users
    useEffect(() => {
        if (searchQuery.trim()) {
            const timeout = setTimeout(async () => {
                setIsSearching(true);
                try {
                    const response = await userAPI.search(searchQuery);
                    setSearchResults(response.data.users.filter(
                        (u) => !selectedUsers.find((s) => s._id === u._id)
                    ));
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setIsSearching(false);
                }
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, selectedUsers]);

    const handleUserSelect = (user) => {
        setSelectedUsers((prev) => [...prev, user]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleUserRemove = (userId) => {
        setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedUsers.length < 2) return;

        setIsCreating(true);
        try {
            const response = await chatAPI.createGroup({
                name: groupName,
                users: selectedUsers.map((u) => u._id),
                description,
            });
            onGroupCreated(response.data.chat);
            onClose();
            toast.success('Group created successfully!');
        } catch (error) {
            toast.error('Failed to create group');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 1 ? 'Add Group Members' : 'New Group'}
        >
            {step === 1 ? (
                <>
                    {/* Selected users */}
                    {selectedUsers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                            {selectedUsers.map((user) => (
                                <div
                                    key={user._id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '4px 12px 4px 4px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '20px',
                                    }}
                                >
                                    <Avatar src={user.avatar} name={user.name} size="sm" />
                                    <span style={{ fontSize: '14px' }}>{user.name.split(' ')[0]}</span>
                                    <FiX
                                        size={14}
                                        style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
                                        onClick={() => handleUserRemove(user._id)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div className="search-wrapper" style={{ marginBottom: '16px' }}>
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Search results */}
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {isSearching ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                <Loader size="sm" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((user) => (
                                <div
                                    key={user._id}
                                    className="chat-item"
                                    onClick={() => handleUserSelect(user)}
                                >
                                    <Avatar src={user.avatar} name={user.name} />
                                    <div className="chat-item-info">
                                        <div className="chat-item-name">{user.name}</div>
                                        <div className="chat-item-message">{user.about || user.email}</div>
                                    </div>
                                </div>
                            ))
                        ) : searchQuery ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                                No users found
                            </p>
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                                Search for users to add to group
                            </p>
                        )}
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-primary"
                            disabled={selectedUsers.length < 2}
                            onClick={() => setStep(2)}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="form-group">
                        <label className="form-label">Group Name *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            maxLength={50}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description (optional)</label>
                        <textarea
                            className="form-input"
                            placeholder="Enter group description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            maxLength={200}
                        />
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        {selectedUsers.length} members selected
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setStep(1)}>
                            Back
                        </button>
                        <button
                            className={`btn btn-primary ${isCreating ? 'btn-loading' : ''}`}
                            disabled={!groupName.trim() || isCreating}
                            onClick={handleCreate}
                        >
                            {isCreating ? '' : 'Create Group'}
                        </button>
                    </div>
                </>
            )}
        </Modal>
    );
};

// Profile Modal Component
const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUser, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [about, setAbout] = useState(user?.about || '');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setAbout(user.about || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const response = await userAPI.updateProfile({ name: name.trim(), about: about.trim() });
            updateUser(response.data.user);
            setIsEditing(false);
            toast.success('Profile updated!');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Profile"
        >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar src={user?.avatar} name={user?.name} size="xxl" />

                <div style={{ width: '100%', marginTop: '24px' }}>
                    {isEditing ? (
                        <>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">About</label>
                                <textarea
                                    className="form-input"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    rows={2}
                                    maxLength={200}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button className="btn btn-secondary btn-full" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button
                                    className={`btn btn-primary btn-full ${isSaving ? 'btn-loading' : ''}`}
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? '' : 'Save'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="profile-field">
                                <div className="profile-field-label">Name</div>
                                <div className="profile-field-value">{user?.name}</div>
                            </div>
                            <div className="profile-field">
                                <div className="profile-field-label">Email</div>
                                <div className="profile-field-value">{user?.email}</div>
                            </div>
                            <div className="profile-field">
                                <div className="profile-field-label">About</div>
                                <div className="profile-field-value">{user?.about || 'Hey there! I am using ChatApp'}</div>
                            </div>

                            <button
                                className="btn btn-secondary btn-full"
                                style={{ marginTop: '24px' }}
                                onClick={() => setIsEditing(true)}
                            >
                                <FiUser />
                                Edit Profile
                            </button>
                            <button
                                className="btn btn-outline btn-full"
                                style={{ marginTop: '12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                                onClick={logout}
                            >
                                <FiLogOut />
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default Sidebar;
