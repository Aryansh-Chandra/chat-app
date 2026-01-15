import express from 'express';
import {
    searchUsers,
    getUserById,
    updateProfile,
    updatePassword,
    getAllUsers,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';
import { uploadProfile } from '../config/cloudinary.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', uploadProfile.single('avatar'), updateProfile);
router.put('/password', updatePassword);

export default router;
