# PakStream - Video Streaming App

A modern MERN stack video streaming application with Netflix-style dark theme UI and complete authentication system.

## Project Structure

```
PakStream/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── config/
│   │   └── server.js
│   ├── package.json
│   └── .env
├── frontend/         # React TypeScript application
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginModal.tsx
│   │   │   │   ├── RegisterModal.tsx
│   │   │   │   ├── AdminRegisterModal.tsx
│   │   │   │   └── UserProfile.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── VideoGrid.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── AdminDashboard.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   └── pages/
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env
└── README.md
```

## Features

### 🔐 **Complete Authentication System**
- **User Registration**: Regular user signup with email/password
- **Admin Registration**: Special admin registration with admin key
- **Login/Logout**: Secure JWT-based authentication
- **User Profiles**: Editable user profiles with bio, name, etc.
- **Role-based Access**: Different permissions for users and admins
- **Protected Routes**: Components that require authentication or admin access

### 🎨 **UI/UX Features**
- **Dark Theme**: Netflix-inspired UI design
- **Responsive Design**: Mobile-first responsive design
- **Modal System**: Clean modal dialogs for auth forms
- **Loading States**: Proper loading indicators
- **Error Handling**: User-friendly error messages

### 🏗️ **Technical Features**
- **Backend**: Express.js with MongoDB, JWT authentication, bcrypt password hashing
- **Frontend**: React with TypeScript and Tailwind CSS
- **State Management**: React Context for authentication state
- **API Integration**: Axios-like fetch service with token management
- **Type Safety**: Full TypeScript implementation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/register-admin` - Register admin (requires admin key)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Health Check
- `GET /api/health` - API health status

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Usage Examples

### Register as Regular User
1. Click "Sign Up" in the navbar
2. Fill in username, email, and password
3. Click "Sign Up"

### Register as Admin
1. Click "Sign Up" in the navbar
2. Click "Register as Admin"
3. Fill in details and admin key (default: "admin123")
4. Click "Register as Admin"

### Login
1. Click "Login" in the navbar
2. Enter email and password
3. Click "Login"

### Access Admin Features
- Admin users will see an "ADMIN" badge in the navbar
- Admin users can access admin-only features
- Use the `ProtectedRoute` component with `requireAdmin={true}`

## Development Status

✅ **Complete Authentication System**
- ✅ User registration and login
- ✅ Admin registration with special key
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ User profile management
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Modal-based UI for auth forms
- ✅ Error handling and validation
- ✅ TypeScript type safety

## Next Steps

Ready for additional features like:
- Video upload and streaming
- User playlists and favorites
- Search and filtering
- Payment integration
- Real-time notifications
- And more as guided by requirements!

## Security Notes

- Change the JWT_SECRET in production
- Change the ADMIN_REGISTRATION_KEY in production
- Use HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Consider implementing refresh tokens for better security
