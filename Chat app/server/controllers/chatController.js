import Chat from '../models/Chat.js';
import User from '../models/User.js';
import Message from '../models/Message.js';

// @desc    Access or create one-on-one chat
// @route   POST /api/chats
// @access  Private
export const accessChat = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'UserId is required',
            });
        }

        // Check if user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if chat already exists
        let chat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('latestMessage');

        chat = await User.populate(chat, {
            path: 'latestMessage.sender',
            select: 'name email avatar',
        });

        if (chat.length > 0) {
            return res.status(200).json({
                success: true,
                chat: chat[0],
            });
        }

        // Create new chat
        const newChat = await Chat.create({
            chatName: 'sender',
            isGroupChat: false,
            users: [req.user._id, userId],
        });

        const fullChat = await Chat.findById(newChat._id).populate(
            'users',
            'name email avatar isOnline lastSeen about'
        );

        res.status(201).json({
            success: true,
            chat: fullChat,
        });
    } catch (error) {
        console.error('Access chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get all chats for user
// @route   GET /api/chats
// @access  Private
export const getChats = async (req, res) => {
    try {
        let chats = await Chat.find({
            users: { $elemMatch: { $eq: req.user._id } },
        })
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar')
            .populate('latestMessage')
            .sort({ updatedAt: -1 });

        chats = await User.populate(chats, {
            path: 'latestMessage.sender',
            select: 'name email avatar',
        });

        res.status(200).json({
            success: true,
            chats,
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Create group chat
// @route   POST /api/chats/group
// @access  Private
export const createGroupChat = async (req, res) => {
    try {
        let { users, name, description } = req.body;

        if (!users || !name) {
            return res.status(400).json({
                success: false,
                message: 'Please provide group name and users',
            });
        }

        // Parse users if string
        if (typeof users === 'string') {
            users = JSON.parse(users);
        }

        if (users.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Group chat requires at least 2 other users',
            });
        }

        // Add current user
        users.push(req.user._id);

        const groupChat = await Chat.create({
            chatName: name,
            isGroupChat: true,
            users,
            groupAdmin: req.user._id,
            groupDescription: description || '',
            groupAvatar: req.file ? req.file.path : null,
        });

        const fullGroupChat = await Chat.findById(groupChat._id)
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar');

        res.status(201).json({
            success: true,
            chat: fullGroupChat,
        });
    } catch (error) {
        console.error('Create group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Rename group
// @route   PUT /api/chats/group/:chatId/rename
// @access  Private
export const renameGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { chatName } = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: 'This is not a group chat',
            });
        }

        // Only admin can rename
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only group admin can rename the group',
            });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { chatName },
            { new: true }
        )
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar');

        res.status(200).json({
            success: true,
            chat: updatedChat,
        });
    } catch (error) {
        console.error('Rename group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Add user to group
// @route   PUT /api/chats/group/:chatId/add
// @access  Private
export const addToGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: 'This is not a group chat',
            });
        }

        // Only admin can add
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only group admin can add users',
            });
        }

        // Check if user already in group
        if (chat.users.includes(userId)) {
            return res.status(400).json({
                success: false,
                message: 'User is already in the group',
            });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { $push: { users: userId } },
            { new: true }
        )
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar');

        res.status(200).json({
            success: true,
            chat: updatedChat,
        });
    } catch (error) {
        console.error('Add to group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Remove user from group
// @route   PUT /api/chats/group/:chatId/remove
// @access  Private
export const removeFromGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { userId } = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: 'This is not a group chat',
            });
        }

        // Admin can remove anyone, users can only remove themselves
        if (
            chat.groupAdmin.toString() !== req.user._id.toString() &&
            userId !== req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to remove this user',
            });
        }

        // Cannot remove admin
        if (userId === chat.groupAdmin.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot remove the group admin',
            });
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        )
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar');

        res.status(200).json({
            success: true,
            chat: updatedChat,
        });
    } catch (error) {
        console.error('Remove from group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Update group details
// @route   PUT /api/chats/group/:chatId
// @access  Private
export const updateGroup = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { chatName, description } = req.body;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: 'This is not a group chat',
            });
        }

        // Only admin can update
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only group admin can update the group',
            });
        }

        const updateData = {};
        if (chatName) updateData.chatName = chatName;
        if (description !== undefined) updateData.groupDescription = description;
        if (req.file) updateData.groupAvatar = req.file.path;

        const updatedChat = await Chat.findByIdAndUpdate(chatId, updateData, {
            new: true,
        })
            .populate('users', 'name email avatar isOnline lastSeen about')
            .populate('groupAdmin', 'name email avatar');

        res.status(200).json({
            success: true,
            chat: updatedChat,
        });
    } catch (error) {
        console.error('Update group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Delete/Leave group
// @route   DELETE /api/chats/group/:chatId
// @access  Private
export const deleteGroup = async (req, res) => {
    try {
        const { chatId } = req.params;

        const chat = await Chat.findById(chatId);

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
            });
        }

        if (!chat.isGroupChat) {
            return res.status(400).json({
                success: false,
                message: 'This is not a group chat',
            });
        }

        // Only admin can delete group
        if (chat.groupAdmin.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only group admin can delete the group',
            });
        }

        // Delete all messages in the chat
        await Message.deleteMany({ chat: chatId });

        // Delete the chat
        await Chat.findByIdAndDelete(chatId);

        res.status(200).json({
            success: true,
            message: 'Group deleted successfully',
        });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
