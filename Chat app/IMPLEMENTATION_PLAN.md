# ChatApp - MERN Stack with Video Calling

## 🎯 Project Overview
A WhatsApp-inspired dark-themed chat application with real-time messaging, video/audio calling, and screen sharing capabilities.

## 🛠️ Tech Stack

### Frontend (Vercel)
- **React 18** with Vite
- **Socket.io-client** for real-time messaging
- **WebRTC** with simple-peer for video calls
- **React Router** for navigation
- **Axios** for API calls
- **Emoji Picker React** for emoji support
- **CSS** (WhatsApp dark theme)

### Backend (Render)
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Socket.io** for real-time events
- **Passport.js** with Google OAuth 2.0
- **JWT** for authentication
- **Nodemailer** for email (password reset)
- **Multer + Cloudinary** for file uploads
- **bcryptjs** for password hashing

## 📁 Project Structure

```
Chat app/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Register.jsx
│   │   │   │   ├── ForgotPassword.jsx
│   │   │   │   └── ResetPassword.jsx
│   │   │   ├── Chat/
│   │   │   │   ├── ChatWindow.jsx
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   ├── ChatHeader.jsx
│   │   │   │   └── EmojiPicker.jsx
│   │   │   ├── Sidebar/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── ChatList.jsx
│   │   │   │   ├── UserProfile.jsx
│   │   │   │   └── SearchUsers.jsx
│   │   │   ├── VideoCall/
│   │   │   │   ├── VideoCall.jsx
│   │   │   │   ├── CallControls.jsx
│   │   │   │   └── GroupVideoCall.jsx
│   │   │   └── Common/
│   │   │       ├── Avatar.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── Loader.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── SocketContext.jsx
│   │   │   └── CallContext.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   └── useWebRTC.js
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js Backend
│   ├── config/
│   │   ├── db.js
│   │   ├── passport.js
│   │   └── cloudinary.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Chat.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── messageRoutes.js
│   │   └── userRoutes.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── utils/
│   │   ├── sendEmail.js
│   │   └── generateToken.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── README.md
└── IMPLEMENTATION_PLAN.md
```

## 🔐 Authentication Flow
1. **Register**: Email/password with validation
2. **Login**: Email/password or Google OAuth
3. **Password Reset**: Send reset link via Gmail
4. **JWT**: Stored in httpOnly cookies

## 💬 Chat Features
- One-on-one private chats
- Group chats (create, add/remove members)
- Real-time messaging via Socket.io
- Typing indicators
- Read receipts
- Emoji reactions on messages
- File/image sharing (Cloudinary storage)

## 📹 Video Call Features
- One-on-one video calls
- Group video calls (up to 4 participants)
- Audio-only calls
- Screen sharing
- Call controls (mute, video toggle, end call)

## 🎨 Design
- Dark theme (WhatsApp-inspired)
- Primary: #00a884 (WhatsApp green)
- Background: #111b21
- Sidebar: #202c33
- Chat: #0b141a
- Accent: #00a884

## 📦 Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 🚀 Deployment

### Frontend (Vercel)
1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables

### Backend (Render)
1. Connect GitHub repo
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add environment variables
