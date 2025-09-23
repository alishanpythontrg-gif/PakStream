# PakStream - Complete Setup Instructions

## 📋 Project Overview

PakStream is a full-stack video streaming application built with React, Node.js, Express, MongoDB, and Socket.IO. It features video upload, processing, streaming, presentation management, and live premiere functionality.

## 🏗️ Architecture

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Database**: MongoDB
- **Video Processing**: FFmpeg + HLS streaming
- **Presentation Processing**: LibreOffice
- **Real-time Communication**: Socket.IO

---

## 🚀 Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu/Debian recommended), macOS, or Windows
- **RAM**: Minimum 4GB (8GB+ recommended for video processing)
- **Storage**: At least 10GB free space
- **Internet**: Required for package installation

### Required Software

#### 1. Node.js and npm
```bash
# Install Node.js (version 18+ recommended)
# Using Node Version Manager (NVM) - Recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20.19.2
nvm use 20.19.2

# Verify installation
node --version  # Should show v20.19.2 or higher
npm --version   # Should show 10.0.0 or higher
```

#### 2. MongoDB
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongod --version
```

#### 3. FFmpeg
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ffmpeg

# Verify installation
ffmpeg -version
```

#### 4. LibreOffice
```bash
# Ubuntu/Debian
sudo apt install -y libreoffice

# Verify installation
libreoffice --version
```

#### 5. ImageMagick (Optional - for advanced image processing)
```bash
# Ubuntu/Debian
sudo apt install -y imagemagick

# Configure ImageMagick policy (if needed)
sudo nano /etc/ImageMagick-6/policy.xml
# Comment out or modify the PDF policy line:
# <policy domain="coder" rights="none" pattern="PDF" />
```

---

## 📦 Installation Steps

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd PakStream
```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# OR create manually:
cat > .env << 'ENVEOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
ENVEOF

# Verify backend setup
npm run dev
# Should start on http://localhost:5000
```

### Step 3: Frontend Setup
```bash
# Navigate to frontend directory (from project root)
cd ../frontend

# Install dependencies
npm install

# Create environment file
cat > .env << 'ENVEOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
ENVEOF

# Verify frontend setup
npm start
# Should start on http://localhost:3000
```

### Step 4: Database Initialization
```bash
# Start MongoDB (if not already running)
sudo systemctl start mongod

# The application will automatically create the database and collections
# No manual database setup required
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000                                    # Backend server port
MONGODB_URI=mongodb://localhost:27017/pakstream  # MongoDB connection string
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production  # JWT secret key
ADMIN_REGISTRATION_KEY=admin123             # Admin registration key
NODE_ENV=development                        # Environment (development/production)
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api    # Backend API URL
REACT_APP_SOCKET_URL=http://localhost:5000     # Socket.IO server URL
```

### Production Configuration
For production deployment, update the following:

1. **Backend .env**:
   - Change `JWT_SECRET` to a strong, unique secret
   - Set `NODE_ENV=production`
   - Update `MONGODB_URI` to your production database
   - Update CORS origins in `server.js`

2. **Frontend .env**:
   - Update URLs to your production domain
   - Set up proper SSL certificates

---

## 🚀 Running the Application

### Development Mode

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
# App runs on http://localhost:3000
```

#### Terminal 3 - MongoDB (if not running as service)
```bash
mongod
# Database runs on mongodb://localhost:27017
```

### Production Mode

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the build folder with a web server like nginx or serve
npx serve -s build -l 3000
```

---

## 🧪 Testing the Installation

### 1. Backend API Test
```bash
curl http://localhost:5000/api/videos
# Should return JSON response with videos array
```

### 2. Frontend Test
- Open http://localhost:3000 in browser
- Should see the PakStream application

### 3. Video Upload Test
- Register a new account or login
- Upload a video file
- Check if processing completes successfully

### 4. Socket.IO Test
- Open browser developer tools
- Check for Socket.IO connection in Network tab
- Should see WebSocket connection to localhost:5000

---

## 📁 Project Structure

```
PakStream/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Route controllers
│   │   ├── middleware/       # Custom middleware
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── socket/          # Socket.IO handlers
│   │   └── server.js        # Main server file
│   ├── uploads/             # File uploads directory
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main App component
│   ├── public/             # Static files
│   ├── package.json
│   └── .env
└── README.md
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill the process
sudo kill -9 <PID>

# Find process using port 3000
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>
```

#### 2. MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB if not running
sudo systemctl start mongod

# Check MongoDB logs
sudo journalctl -u mongod
```

#### 3. FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt install -y ffmpeg

# Verify installation
which ffmpeg
ffmpeg -version
```

#### 4. Permission Issues
```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER backend/uploads/
chmod -R 755 backend/uploads/
```

#### 5. Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 6. TypeScript Compilation Errors
```bash
# Check TypeScript version
npx tsc --version

# Reinstall TypeScript
npm install -g typescript@latest

# Clear build cache
rm -rf frontend/build
npm run build
```

---

## 📊 Performance Optimization

### Video Processing
- **FFmpeg Settings**: Optimized for fast processing with `ultrafast` preset
- **HLS Streaming**: Adaptive bitrate streaming for better performance
- **Progress Tracking**: Real-time progress updates via WebSocket

### Database
- **Indexing**: Ensure proper indexes on frequently queried fields
- **Connection Pooling**: MongoDB connection pooling enabled
- **Query Optimization**: Use projection to limit returned fields

### Frontend
- **Code Splitting**: React lazy loading for better performance
- **Image Optimization**: Compressed thumbnails and optimized images
- **Caching**: Browser caching for static assets

---

## 🔒 Security Considerations

### Backend Security
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All inputs validated and sanitized
- **File Upload Security**: File type and size restrictions
- **CORS Configuration**: Proper CORS settings for production

### Frontend Security
- **Environment Variables**: Sensitive data in environment variables
- **HTTPS**: Use HTTPS in production
- **Content Security Policy**: Implement CSP headers

---

## 🚀 Deployment

### Docker Deployment (Optional)
```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Manual Deployment
1. **Server Setup**: Ubuntu 20.04+ recommended
2. **Install Dependencies**: Follow prerequisites section
3. **Clone Repository**: Git clone the project
4. **Configure Environment**: Set up production environment variables
5. **Build Frontend**: `npm run build`
6. **Start Services**: Use PM2 or similar process manager
7. **Configure Nginx**: Reverse proxy setup
8. **SSL Certificate**: Let's Encrypt or similar

---

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Video Endpoints
- `GET /api/videos` - Get all videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/:id` - Get video details
- `DELETE /api/videos/:id` - Delete video (admin only)

### Presentation Endpoints
- `GET /api/presentations` - Get all presentations
- `POST /api/presentations/upload` - Upload presentation
- `GET /api/presentations/:id` - Get presentation details

### Premiere Endpoints
- `GET /api/premieres` - Get all premieres
- `POST /api/premieres` - Create premiere
- `GET /api/premieres/:id` - Get premiere details

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the logs for error messages
3. Check GitHub issues
4. Contact the development team

---

## 📋 Checklist for New Setup

- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] FFmpeg installed
- [ ] LibreOffice installed
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment files created
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Database connection working
- [ ] Video upload working
- [ ] Video processing working
- [ ] Socket.IO connection working

---

**🎉 Congratulations! Your PakStream application should now be fully functional!**
