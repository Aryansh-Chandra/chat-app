import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { chatAPI } from '../services/api';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import toast from 'react-hot-toast';

const Home = () => {
    const { user } = useAuth();
    const { socket, joinChat, leaveChat } = useSocket();

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
    const [showSidebar, setShowSidebar] = useState(true);

    // Fetch all chats
    const fetchChats = useCallback(async () => {
        try {
            const response = await chatAPI.getAll();
            setChats(response.data.chats);
        } catch (error) {
            console.error('Failed to fetch chats:', error);
            toast.error('Failed to load chats');
        } finally {
            setLoadingChats(false);
        }
    }, []);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);
            if (!mobile) {
                setShowSidebar(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle chat selection
    const handleSelectChat = useCallback((chat) => {
        // Leave previous chat room
        if (selectedChat) {
            leaveChat(selectedChat._id);
        }

        // Join new chat room
        joinChat(chat._id);
        setSelectedChat(chat);

        // Hide sidebar on mobile
        if (isMobileView) {
            setShowSidebar(false);
        }
    }, [selectedChat, leaveChat, joinChat, isMobileView]);

    // Handle back button on mobile
    const handleBackToSidebar = useCallback(() => {
        if (selectedChat) {
            leaveChat(selectedChat._id);
        }
        setSelectedChat(null);
        setShowSidebar(true);
    }, [selectedChat, leaveChat]);

    // Listen for new messages and update chat list
    useEffect(() => {
        if (!socket) return;

        const handleMessageReceived = (message) => {
            // Update chat list to move this chat to top
            setChats((prevChats) => {
                const chatIndex = prevChats.findIndex((c) => c._id === message.chat._id);
                if (chatIndex > -1) {
                    const updatedChat = {
                        ...prevChats[chatIndex],
                        latestMessage: message,
                    };
                    const newChats = [
                        updatedChat,
                        ...prevChats.slice(0, chatIndex),
                        ...prevChats.slice(chatIndex + 1),
                    ];
                    return newChats;
                }
                return prevChats;
            });
        };

        socket.on('message received', handleMessageReceived);

        return () => {
            socket.off('message received', handleMessageReceived);
        };
    }, [socket]);

    // Update chat in list when new message is sent
    const handleChatUpdate = useCallback((updatedChat) => {
        setChats((prevChats) => {
            const index = prevChats.findIndex((c) => c._id === updatedChat._id);
            if (index > -1) {
                const newChats = [...prevChats];
                newChats[index] = updatedChat;
                // Move to top if there's a new message
                if (updatedChat.latestMessage) {
                    newChats.splice(index, 1);
                    newChats.unshift(updatedChat);
                }
                return newChats;
            }
            // New chat, add to beginning
            return [updatedChat, ...prevChats];
        });
        setSelectedChat(updatedChat);
    }, []);

    // Add new chat to list
    const handleNewChat = useCallback((newChat) => {
        setChats((prev) => {
            // Check if chat already exists
            const exists = prev.find((c) => c._id === newChat._id);
            if (exists) return prev;
            return [newChat, ...prev];
        });
        handleSelectChat(newChat);
    }, [handleSelectChat]);

    return (
        <div className="chat-layout">
            <Sidebar
                chats={chats}
                selectedChat={selectedChat}
                onSelectChat={handleSelectChat}
                onNewChat={handleNewChat}
                loading={loadingChats}
                className={isMobileView && !showSidebar ? 'hidden-mobile' : ''}
            />

            <ChatWindow
                chat={selectedChat}
                onBack={isMobileView ? handleBackToSidebar : null}
                onChatUpdate={handleChatUpdate}
            />
        </div>
    );
};

export default Home;
