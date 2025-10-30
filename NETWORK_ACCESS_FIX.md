# Quick Fix for Network Access (192.168.100.72)

## Problem
Accessing the app from `http://192.168.100.72:3000` doesn't load videos/presentations because:
1. Backend CORS only allowed `localhost:3000`
2. Backend only listened on `localhost` (not accessible from network)
3. Frontend might be using `localhost:5000` for API calls

## Fixed ✅
1. ✅ Backend now allows IP addresses in CORS (192.168.x.x patterns)
2. ✅ Backend now listens on `0.0.0.0` (accessible from network)
3. ✅ Static files use proper CORS handling

## Frontend Setup Required

You need to create a `.env` file in the `frontend` directory:

```bash
cd frontend
nano .env
```

Add these lines (replace with your backend IP):
```bash
REACT_APP_API_URL=http://192.168.100.72:5000/api
REACT_APP_SOCKET_URL=http://192.168.100.72:5000
```

**Important:** After creating/updating `.env`, restart the frontend:
```bash
# Stop frontend (Ctrl+C)
# Then restart:
npm start
```

## Backend Setup

The backend is already configured to:
- Accept requests from `http://192.168.100.72:3000`
- Listen on all network interfaces (`0.0.0.0`)
- Serve files with proper CORS headers

Just restart the backend if it's running:
```bash
cd backend
npm start
```

## Verification

1. Backend should show:
   ```
   Server is running on port 5000
   Access from network: http://192.168.100.72:5000
   ```

2. Frontend should use `http://192.168.100.72:5000/api` for API calls

3. Check browser console (F12) - should see API calls going to `192.168.100.72:5000`

## If Still Not Working

1. **Check firewall**: Make sure ports 3000 and 5000 are open
   ```bash
   sudo ufw allow 3000
   sudo ufw allow 5000
   ```

2. **Check backend logs**: Look for CORS errors or connection issues

3. **Hard-code IP temporarily** (if env vars don't work):
   - Edit `frontend/src/services/videoService.ts`
   - Change: `const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';`
   - To: `const API_BASE_URL = 'http://192.168.100.72:5000/api';`
   - Same for other services

