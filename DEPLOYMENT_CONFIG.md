# Deployment Configuration Guide

## CORS Configuration Overview

This application uses **end-to-end CORS configuration** where:
- **Backend** controls which frontend origins are allowed to access the API
- **Frontend** knows where to make API requests

## Backend Configuration

### File: `backend/src/config/appConfig.js`

This is the **single place** to configure CORS for deployment.

#### Option 1: Edit the config file directly
```javascript
if (process.env.NODE_ENV === 'production') {
  // Replace with your actual production domain(s)
  return ['https://yourdomain.com'];
}
```

#### Option 2: Use environment variable (Recommended)
Set `CORS_ORIGIN` in your `.env` file:
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
```

### Backend Environment Variables

Create `backend/.env`:
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-domain.com
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
```

## Frontend Configuration

### Frontend Environment Variables

Create `frontend/.env`:
```bash
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

**Important:** React requires the `REACT_APP_` prefix for environment variables.

## How It Works

1. **Backend** (`appConfig.js`):
   - Reads `CORS_ORIGIN` from environment variables
   - Falls back to default production/development values
   - Configures both HTTP CORS and Socket.IO CORS

2. **Frontend**:
   - Uses `REACT_APP_API_URL` for all API requests
   - Uses `REACT_APP_SOCKET_URL` for Socket.IO connections
   - All services and components use these environment variables

## Deployment Checklist

- [ ] Update `backend/.env` with production values
- [ ] Set `CORS_ORIGIN` to your frontend domain(s)
- [ ] Update `frontend/.env` with production backend URL
- [ ] Ensure `NODE_ENV=production` in backend
- [ ] Build frontend: `npm run build`
- [ ] Test CORS by accessing frontend from production domain

## Testing CORS

After deployment, check browser console for CORS errors. The backend will log allowed origins on startup:
```
CORS Origins: https://yourdomain.com
```

