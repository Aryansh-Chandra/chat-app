import express from 'express';
import {
    accessChat,
    getChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    updateGroup,
    deleteGroup,
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { uploadGroupAvatar } from '../config/cloudinary.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// One-on-one and get chats
router.route('/').post(accessChat).get(getChats);

// Group chat routes
router.post('/group', uploadGroupAvatar.single('groupAvatar'), createGroupChat);
router.put('/group/:chatId/rename', renameGroup);
router.put('/group/:chatId/add', addToGroup);
router.put('/group/:chatId/remove', removeFromGroup);
router.put('/group/:chatId', uploadGroupAvatar.single('groupAvatar'), updateGroup);
router.delete('/group/:chatId', deleteGroup);

export default router;
