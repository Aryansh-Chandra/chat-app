import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

// User API
export const userAPI = {
    getAll: () => api.get('/users'),
    search: (query) => api.get(`/users/search?q=${query}`),
    getById: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put('/users/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    updatePassword: (data) => api.put('/users/password', data),
};

// Chat API
export const chatAPI = {
    getAll: () => api.get('/chats'),
    access: (userId) => api.post('/chats', { userId }),
    createGroup: (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('users', JSON.stringify(data.users));
        if (data.description) formData.append('description', data.description);
        if (data.groupAvatar) formData.append('groupAvatar', data.groupAvatar);
        return api.post('/chats/group', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    renameGroup: (chatId, chatName) => api.put(`/chats/group/${chatId}/rename`, { chatName }),
    addToGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/add`, { userId }),
    removeFromGroup: (chatId, userId) => api.put(`/chats/group/${chatId}/remove`, { userId }),
    updateGroup: (chatId, data) => {
        const formData = new FormData();
        Object.keys(data).forEach((key) => {
            if (data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.put(`/chats/group/${chatId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    deleteGroup: (chatId) => api.delete(`/chats/group/${chatId}`),
};

// Message API
export const messageAPI = {
    getAll: (chatId, page = 1) => api.get(`/messages/${chatId}?page=${page}`),
    send: (data) => {
        const formData = new FormData();
        formData.append('chatId', data.chatId);
        if (data.content) formData.append('content', data.content);
        if (data.replyTo) formData.append('replyTo', data.replyTo);
        if (data.attachment) formData.append('attachment', data.attachment);
        return api.post('/messages', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/react`, { emoji }),
    markAsRead: (chatId) => api.put(`/messages/${chatId}/read`),
    edit: (messageId, content) => api.put(`/messages/${messageId}`, { content }),
    delete: (messageId) => api.delete(`/messages/${messageId}`),
};

export default api;
