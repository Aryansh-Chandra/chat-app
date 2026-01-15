import express from 'express';
import {
    getMessages,
    sendMessage,
    addReaction,
    markAsRead,
    deleteMessage,
    editMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';
import { uploadAttachment } from '../config/cloudinary.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// Message routes
router.get('/:chatId', getMessages);
router.post('/', uploadAttachment.single('attachment'), sendMessage);
router.post('/:messageId/react', addReaction);
router.put('/:chatId/read', markAsRead);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;
