# 💬 ChatApp - MERN Stack Chat Application

A feature-rich, real-time chat application with video calling capabilities, built with the MERN stack. Inspired by WhatsApp's dark theme design.

![ChatApp Preview](https://via.placeholder.com/800x400/111b21/00a884?text=ChatApp+Preview)

## ✨ Features

### 🔐 Authentication
- Email/Password signup & signin
- Google OAuth 2.0 integration
- Password reset via email
- JWT-based session management
- Secure httpOnly cookies

### 💬 Chat Features
- **One-on-One Chats**: Private conversations
- **Group Chats**: Create and manage groups
- **Real-time Messaging**: Instant message delivery via Socket.io
- **Typing Indicators**: See when others are typing
- **Read Receipts**: Know when messages are read
- **Emoji Reactions**: React to messages with emojis
- **File Sharing**: Share images, documents, and videos (up to 25MB)
- **Message Replies**: Reply to specific messages
- **Message Editing/Deletion**: Edit or delete your messages

### 📹 Video Calling
- **One-on-One Video Calls**: Private video conversations
- **Group Video Calls**: Video calls with multiple participants
- **Audio-Only Calls**: Voice calls without video
- **Screen Sharing**: Share your screen during calls
- **Call Controls**: Mute, video toggle, end call

### 🎨 Design
- **Dark Theme**: WhatsApp-inspired dark mode
- **Responsive**: Works on desktop and mobile
- **Smooth Animations**: Polished user experience
- **Modern UI**: Clean and intuitive interface

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Socket.io-client for real-time communication
- Simple-peer (WebRTC) for video calls
- React Router for navigation
- Axios for API requests
- Emoji Picker React
- React Hot Toast for notifications

### Backend
- Node.js with Express
- MongoDB with Mongoose
- Socket.io for real-time events
- Passport.js with Google OAuth 2.0
- JWT for authentication
- Nodemailer for emails
- Cloudinary for file storage
- Multer for file uploads

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Cloudinary account (for file uploads)
- Google Cloud Console project (for OAuth)
- Gmail account (for sending emails)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd "Chat app"
```

### 2. Set Up Backend

```bash
cd server
npm install
```

Create `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Google OAuth (see setup guide below)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gmail (use App Password, not regular password)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password

# Cloudinary (see setup guide below)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

CLIENT_URL=http://localhost:5173
```

### 3. Set Up Frontend

```bash
cd ../client
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Run the Application

**Start Backend (from server folder):**
```bash
npm run dev
```

**Start Frontend (from client folder):**
```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## 🔧 Service Setup Guides

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Set Application type to **Web application**
6. Add Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://your-frontend-domain.vercel.app` (for production)
7. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://your-backend-domain.onrender.com/api/auth/google/callback` (for production)
8. Copy the Client ID and Client Secret

### Gmail App Password Setup

1. Enable 2-Step Verification on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select **Mail** and **Windows Computer**
4. Click **Generate**
5. Copy the 16-character password (use this in `EMAIL_PASS`)

### Cloudinary Setup

1. Create account at [Cloudinary](https://cloudinary.com/)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret

## 📦 Deployment

### Frontend on Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/) and import your repo
3. Set root directory to `client`
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Add environment variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_SOCKET_URL=https://your-backend.onrender.com`
   - `VITE_GOOGLE_CLIENT_ID=your_google_client_id`

### Backend on Render

1. Go to [Render](https://render.com/) and create new Web Service
2. Connect your GitHub repo
3. Set root directory to `server`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add all environment variables from `.env`
7. Update `CLIENT_URL` to your Vercel frontend URL

**Important:** After deploying backend, update:
- Frontend env `VITE_API_URL` with Render URL
- Google OAuth redirect URIs with production URLs

## 📁 Project Structure

```
Chat app/
├── client/                    # React Frontend
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Login, Register, Password Reset
│   │   │   ├── Chat/          # ChatWindow, MessageInput
│   │   │   ├── Common/        # Avatar, Modal, Loader
│   │   │   ├── Sidebar/       # Sidebar with chat list
│   │   │   └── VideoCall/     # VideoCall, IncomingCall
│   │   ├── context/           # Auth, Socket, Call contexts
│   │   ├── pages/            # Home, NotFound
│   │   ├── services/         # API service
│   │   ├── utils/            # Helper functions
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                    # Node.js Backend
│   ├── config/               # DB, Passport, Cloudinary config
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Auth middleware
│   ├── models/              # Mongoose models
│   ├── routes/              # API routes
│   ├── socket/              # Socket.io handlers
│   ├── utils/               # Helpers
│   ├── server.js
│   └── package.json
│
├── .gitignore
├── IMPLEMENTATION_PLAN.md
└── README.md
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT tokens with expiration
- httpOnly cookies for token storage
- CORS configuration
- Input validation and sanitization
- File upload restrictions

## 🐛 Troubleshooting

### Common Issues

**"Failed to connect to MongoDB"**
- Check your MongoDB URI in `.env`
- Ensure your IP is whitelisted in MongoDB Atlas

**"Google OAuth not working"**
- Verify redirect URIs match exactly
- Check Client ID is correct in both frontend and backend

**"Emails not sending"**
- Use App Password, not regular Gmail password
- Ensure 2-Step Verification is enabled

**"Video call not working"**
- Allow camera/microphone permissions in browser
- Some networks block WebRTC; try different network

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using the MERN Stack
