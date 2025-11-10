# CORS and Network Access Fix - Implementation Summary

## Overview

This implementation fixes CORS and network access issues to enable deployment on Docker/Ubuntu VM accessible from any network. All services (videos, presentations, hero section, Socket.IO) now work without CORS errors and support `0.0.0.0` binding for network access.

## Changes Made

### Backend Changes

1. **`backend/src/config/appConfig.js`**
   - Updated CORS configuration to support `*` (allow all origins) for Docker deployments
   - Defaults to `*` in development mode for easier network access
   - Supports `CORS_ORIGIN` environment variable (comma-separated or `*`)

2. **`backend/src/server.js`**
   - Updated `isOriginAllowed()` helper to handle `*` CORS origin
   - Updated static file middleware (`/uploads/videos` and `/uploads/presentations`) to properly handle `*` CORS
   - Fixed logging to handle both `*` and array-based CORS origins

3. **`backend/src/routes/video.js`**
   - Updated HLS route (`/:id/hls/*`) CORS handling to support `*` origin

4. **`backend/src/socket/socketHandler.js`**
   - Already uses `appConfig.socketCors`, so automatically supports `*` CORS

### Frontend Changes

1. **`frontend/src/config/api.ts`** (NEW)
   - Centralized API configuration file
   - Provides `getApiBaseUrl()`, `getSocketUrl()`, `getBaseUrl()`, and `getStaticFileUrl()` functions
   - Automatically detects current origin for relative URLs when environment variables not set
   - Falls back to `localhost:5000` only in development

2. **All Frontend Services Updated**
   - `videoService.ts` - Uses centralized config, updated URL methods
   - `presentationService.ts` - Uses centralized config, updated URL methods
   - `authService.ts` - Uses centralized config
   - `premiereService.ts` - Uses centralized config, updated `getPosterUrl()`
   - `userService.ts` - Uses centralized config
   - `socketService.ts` - Uses centralized config

3. **All Frontend Components Updated**
   - `VideoGrid.tsx` - Uses `videoService.getPosterUrl()`
   - `VideoProcessingStatus.tsx` - Uses `SOCKET_URL` from config
   - `PremiereGrid.tsx` - Uses `premiereService.getPosterUrl()`
   - `ScheduledPremiere.tsx` - Uses `premiereService.getPosterUrl()`
   - `AdminPremiereDashboard.tsx` - Uses `premiereService.getPosterUrl()`
   - `LivePremiereControlPage.tsx` - Uses `premiereService.getPosterUrl()`
   - `PresentationViewer.tsx` - Uses `getBaseUrl()` from config

## Docker Deployment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# MongoDB connection
MONGODB_URI=mongodb://mongodb:27017/pakstream

# Server port
PORT=5000

# CORS Configuration
# Option 1: Allow all origins (recommended for Docker/network deployments)
CORS_ORIGIN=*

# Option 2: Specific origins (comma-separated)
# CORS_ORIGIN=http://192.168.1.100:3000,http://localhost:3000

# JWT Secret
JWT_SECRET=your-secret-key-here

# Node Environment
NODE_ENV=production
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
# Backend API URL (replace with your backend IP/hostname)
REACT_APP_API_URL=http://192.168.1.100:5000/api

# Socket.IO URL (replace with your backend IP/hostname)
REACT_APP_SOCKET_URL=http://192.168.1.100:5000
```

**Important:** After creating/updating `.env` files, rebuild the frontend:
```bash
cd frontend
npm run build
```

### Docker Compose Example

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/pakstream
      - PORT=5000
      - CORS_ORIGIN=*
      - NODE_ENV=production
      - JWT_SECRET=your-secret-key
    depends_on:
      - mongodb
    networks:
      - app-network

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://192.168.1.100:5000/api
      - REACT_APP_SOCKET_URL=http://192.168.1.100:5000
    depends_on:
      - backend
    networks:
      - app-network

  mongodb:
    image: mongo:latest
    volumes:
      - mongodb-data:/data/db
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongodb-data:
```

## Network Access Configuration

### For Ubuntu VM Deployment

1. **Backend Configuration:**
   - Server already listens on `0.0.0.0:5000` (all interfaces)
   - Set `CORS_ORIGIN=*` in backend `.env` for maximum compatibility
   - Or set specific origins: `CORS_ORIGIN=http://192.168.1.100:3000,http://10.0.0.50:3000`

2. **Frontend Configuration:**
   - Set `REACT_APP_API_URL` to the backend's IP address
   - Set `REACT_APP_SOCKET_URL` to the backend's IP address
   - Example: `REACT_APP_API_URL=http://192.168.1.100:5000/api`

3. **Firewall Configuration:**
   ```bash
   sudo ufw allow 3000/tcp
   sudo ufw allow 5000/tcp
   ```

## Verification

After deployment, verify:

1. **Backend logs should show:**
   ```
   CORS Origins: *
   Access from network: http://0.0.0.0:5000 (all interfaces)
   ```

2. **Browser console should show:**
   - No CORS errors
   - API calls going to correct backend URL
   - Socket.IO connection successful

3. **Test endpoints:**
   - Videos load and play correctly
   - Presentations load correctly
   - Hero section video plays
   - Socket.IO connections work

## Key Features

- ✅ **Generic CORS Solution**: Works with any IP address/network
- ✅ **0.0.0.0 Binding**: Server accessible from any network interface
- ✅ **Centralized URL Config**: Single source of truth for all URLs
- ✅ **Environment-Based**: Easy configuration via environment variables
- ✅ **Backward Compatible**: Falls back to localhost in development
- ✅ **No Hardcoded URLs**: All URLs use centralized configuration

## Troubleshooting

### Videos Not Loading
- Check browser console for CORS errors
- Verify `CORS_ORIGIN=*` in backend `.env`
- Verify `REACT_APP_API_URL` points to correct backend IP
- Check firewall allows port 5000

### Socket.IO Not Connecting
- Verify `REACT_APP_SOCKET_URL` points to correct backend IP
- Check backend logs for Socket.IO connection attempts
- Verify CORS allows the frontend origin

### Static Files Not Loading
- Check that backend static file middleware has CORS headers
- Verify file paths are correct
- Check browser Network tab for 404 or CORS errors

## Notes

- The backend server already binds to `0.0.0.0` by default
- CORS defaults to `*` (allow all) in development mode
- Production mode requires explicit `CORS_ORIGIN` configuration
- Frontend automatically detects origin when environment variables not set (for same-origin deployments)

