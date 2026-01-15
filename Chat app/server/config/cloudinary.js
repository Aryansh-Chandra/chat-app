import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for chat attachments (images and files)
const attachmentStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'chatapp/attachments';
        let resourceType = 'auto';

        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            folder = 'chatapp/images';
        } else if (file.mimetype.startsWith('video/')) {
            folder = 'chatapp/videos';
        } else {
            folder = 'chatapp/files';
            resourceType = 'raw';
        }

        return {
            folder,
            resource_type: resourceType,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'txt', 'mp4', 'webm'],
            transformation: file.mimetype.startsWith('image/') ? [{ width: 1920, height: 1080, crop: 'limit' }] : undefined,
        };
    },
});

// Storage for profile pictures
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chatapp/profiles',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    },
});

// Storage for group avatars
const groupStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'chatapp/groups',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'video/mp4',
        'video/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type'), false);
    }
};

// Multer upload instances
export const uploadAttachment = multer({
    storage: attachmentStorage,
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

export const uploadProfile = multer({
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export const uploadGroupAvatar = multer({
    storage: groupStorage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export { cloudinary };
