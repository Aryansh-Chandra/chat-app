import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';

// @desc    Get messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check if user is part of the chat
        const chat = await Chat.findOne({
            _id: chatId,
            users: { $elemMatch: { $eq: req.user._id } },
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or access denied',
            });
        }

        const messages = await Message.find({ chat: chatId })
            .populate('sender', 'name email avatar')
            .populate('reactions.user', 'name avatar')
            .populate('replyTo')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Populate replyTo sender
        await User.populate(messages, {
            path: 'replyTo.sender',
            select: 'name avatar',
        });

        const totalMessages = await Message.countDocuments({ chat: chatId });

        res.status(200).json({
            success: true,
            messages: messages.reverse(),
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMessages / limit),
                totalMessages,
                hasMore: page * limit < totalMessages,
            },
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { content, chatId, replyTo } = req.body;

        if (!content && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Message content or file is required',
            });
        }

        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID is required',
            });
        }

        // Check if user is part of the chat
        const chat = await Chat.findOne({
            _id: chatId,
            users: { $elemMatch: { $eq: req.user._id } },
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found or access denied',
            });
        }

        // Build message data
        const messageData = {
            sender: req.user._id,
            chat: chatId,
            content: content || '',
            readBy: [{ user: req.user._id, readAt: new Date() }],
        };

        // Handle reply
        if (replyTo) {
            messageData.replyTo = replyTo;
        }

        // Handle file attachment
        if (req.file) {
            const mimeType = req.file.mimetype;
            let messageType = 'file';

            if (mimeType.startsWith('image/')) {
                messageType = 'image';
            } else if (mimeType.startsWith('video/')) {
                messageType = 'video';
            } else if (mimeType.startsWith('audio/')) {
                messageType = 'audio';
            }

            messageData.messageType = messageType;
            messageData.attachment = {
                url: req.file.path,
                publicId: req.file.filename,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: mimeType,
            };
        }

        let message = await Message.create(messageData);

        // Populate message
        message = await Message.findById(message._id)
            .populate('sender', 'name email avatar')
            .populate('replyTo')
            .populate('reactions.user', 'name avatar');

        if (message.replyTo) {
            await User.populate(message, {
                path: 'replyTo.sender',
                select: 'name avatar',
            });
        }

        // Update chat's latest message
        await Chat.findByIdAndUpdate(chatId, {
            latestMessage: message._id,
        });

        res.status(201).json({
            success: true,
            message,
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Add reaction to message
// @route   POST /api/messages/:messageId/react
// @access  Private
export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({
                success: false,
                message: 'Emoji is required',
            });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Check if user already reacted with same emoji
        const existingReaction = message.reactions.find(
            (r) => r.user.toString() === req.user._id.toString() && r.emoji === emoji
        );

        if (existingReaction) {
            // Remove the reaction (toggle off)
            message.reactions = message.reactions.filter(
                (r) =>
                    !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
            );
        } else {
            // Remove any other reaction from this user first
            message.reactions = message.reactions.filter(
                (r) => r.user.toString() !== req.user._id.toString()
            );
            // Add new reaction
            message.reactions.push({ user: req.user._id, emoji });
        }

        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate('sender', 'name email avatar')
            .populate('reactions.user', 'name avatar')
            .populate('replyTo');

        res.status(200).json({
            success: true,
            message: updatedMessage,
        });
    } catch (error) {
        console.error('Add reaction error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/:chatId/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;

        // Update all unread messages in the chat
        await Message.updateMany(
            {
                chat: chatId,
                'readBy.user': { $ne: req.user._id },
            },
            {
                $push: {
                    readBy: { user: req.user._id, readAt: new Date() },
                },
            }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Only sender can delete their message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message',
            });
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'This message was deleted';
        message.attachment = undefined;
        await message.save();

        res.status(200).json({
            success: true,
            message: 'Message deleted',
        });
    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Edit message
// @route   PUT /api/messages/:messageId
// @access  Private
export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }

        // Only sender can edit their message
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to edit this message',
            });
        }

        // Only text messages can be edited
        if (message.messageType !== 'text') {
            return res.status(400).json({
                success: false,
                message: 'Only text messages can be edited',
            });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const updatedMessage = await Message.findById(messageId)
            .populate('sender', 'name email avatar')
            .populate('reactions.user', 'name avatar')
            .populate('replyTo');

        res.status(200).json({
            success: true,
            message: updatedMessage,
        });
    } catch (error) {
        console.error('Edit message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
