# Edge Server Setup Guide for Ubuntu

## Quick Setup for Testing on Single Machine

This guide shows you how to simulate multiple edge servers on a single Ubuntu machine for testing.

---

## Method 1: Manual Edge Server Setup (Recommended for Testing)

### Step 1: Create Edge Server Directories

```bash
# Create edge server directories
mkdir -p edge-server-5001
mkdir -p edge-server-5002
mkdir -p edge-server-5003
```

### Step 2: Copy Backend Files to Each Edge Server

```bash
# Copy backend to edge server 1
cp -r backend edge-server-5001/
cd edge-server-5001/backend
npm install
cd ../..

# Copy backend to edge server 2
cp -r backend edge-server-5002/
cd edge-server-5002/backend
npm install
cd ../..

# Copy backend to edge server 3
cp -r backend edge-server-5003/
cd edge-server-5003/backend
npm install
cd ../..
```

### Step 3: Configure Each Edge Server

Create `.env` file for each edge server:

**edge-server-5001/backend/.env:**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EDGE_SERVER_MODE=true
EDGE_SERVER_API_KEY=edge-server-1-secret-key
```

**edge-server-5002/backend/.env:**
```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EDGE_SERVER_MODE=true
EDGE_SERVER_API_KEY=edge-server-2-secret-key
```

**edge-server-5003/backend/.env:**
```env
PORT=5003
MONGODB_URI=mongodb://localhost:27017/pakstream
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
ADMIN_REGISTRATION_KEY=admin123
NODE_ENV=development
EDGE_SERVER_MODE=true
EDGE_SERVER_API_KEY=edge-server-3-secret-key
```

### Step 4: Start Edge Servers

Open multiple terminal windows and run:

**Terminal 1 - Origin Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Edge Server 1:**
```bash
cd edge-server-5001/backend
npm start
```

**Terminal 3 - Edge Server 2:**
```bash
cd edge-server-5002/backend
npm start
```

**Terminal 4 - Edge Server 3:**
```bash
cd edge-server-5003/backend
npm start
```

### Step 5: Register Edge Servers in Admin Dashboard

1. Open browser and go to: `http://localhost:3000`
2. Login as admin
3. Go to Edge Server Management section
4. Click "Register Edge Server"

**Register Edge Server 1:**
- Name: Edge Server 1
- Host: localhost
- Port: 5001
- Protocol: http
- API Key: edge-server-1-secret-key
- Capacity: Storage 1000 GB, Bandwidth 1000 Mbps
- Location: Region: Building A, Datacenter: Server Room 1

**Register Edge Server 2:**
- Name: Edge Server 2
- Host: localhost
- Port: 5002
- Protocol: http
- API Key: edge-server-2-secret-key
- Capacity: Storage 1000 GB, Bandwidth 1000 Mbps
- Location: Region: Building B, Datacenter: Server Room 2

**Register Edge Server 3:**
- Name: Edge Server 3
- Host: localhost
- Port: 5003
- Protocol: http
- API Key: edge-server-3-secret-key
- Capacity: Storage 1000 GB, Bandwidth 1000 Mbps
- Location: Region: Building C, Datacenter: Server Room 3

---

## Method 2: Using PM2 (Process Manager)

### Install PM2

```bash
npm install -g pm2
```

### Create Edge Server Start Scripts

**start-edge-servers.sh:**
```bash
#!/bin/bash

# Start origin server
cd backend
pm2 start npm --name "origin-server" -- run dev

# Start edge servers
cd ../edge-server-5001/backend
pm2 start npm --name "edge-server-1" -- start

cd ../../edge-server-5002/backend
pm2 start npm --name "edge-server-2" -- start

cd ../../edge-server-5003/backend
pm2 start npm --name "edge-server-3" -- start

# Show status
pm2 status
```

**stop-edge-servers.sh:**
```bash
#!/bin/bash
pm2 stop all
pm2 delete all
```

### Use PM2 Commands

```bash
# Start all servers
./start-edge-servers.sh

# Stop all servers
./stop-edge-servers.sh

# View logs
pm2 logs

# Monitor
pm2 monit
```

---

## Method 3: Using Docker Compose (Advanced)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  origin:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGODB_URI=mongodb://mongo:27017/pakstream
    volumes:
      - ./backend/uploads:/app/uploads
    depends_on:
      - mongo

  edge1:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - PORT=5001
      - MONGODB_URI=mongodb://mongo:27017/pakstream
      - EDGE_SERVER_API_KEY=edge-server-1-secret-key
    volumes:
      - ./edge-server-5001/uploads:/app/uploads

  edge2:
    build: ./backend
    ports:
      - "5002:5002"
    environment:
      - PORT=5002
      - MONGODB_URI=mongodb://mongo:27017/pakstream
      - EDGE_SERVER_API_KEY=edge-server-2-secret-key
    volumes:
      - ./edge-server-5002/uploads:/app/uploads

  edge3:
    build: ./backend
    ports:
      - "5003:5003"
    environment:
      - PORT=5003
      - MONGODB_URI=mongodb://mongo:27017/pakstream
      - EDGE_SERVER_API_KEY=edge-server-3-secret-key
    volumes:
      - ./edge-server-5003/uploads:/app/uploads

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

Run with:
```bash
docker-compose up -d
```

---

## Testing the Edge Server Setup

### 1. Check All Servers Are Running

```bash
# Check origin server
curl http://localhost:5000/api/edge/health

# Check edge servers
curl http://localhost:5001/api/edge/health
curl http://localhost:5002/api/edge/health
curl http://localhost:5003/api/edge/health
```

### 2. Upload a Video

1. Login as admin
2. Upload a video
3. Wait for processing to complete
4. Check edge server logs - you should see video sync messages

### 3. Verify Edge Servers Have Videos

```bash
# Check videos on edge server 1
curl http://localhost:5001/api/videos

# Should return same videos as origin server
```

---

## Troubleshooting

### Edge Server Not Responding

1. Check if port is available:
   ```bash
   sudo lsof -i :5001
   ```

2. Check logs:
   ```bash
   tail -f edge-server-5001/backend/server.log
   ```

3. Restart edge server:
   ```bash
   cd edge-server-5001/backend
   npm start
   ```

### Video Sync Failing

1. Check origin server logs for sync errors
2. Verify API keys match
3. Check network connectivity between servers
4. Verify edge server status in admin dashboard

### Port Already in Use

1. Kill process using the port:
   ```bash
   sudo kill -9 $(sudo lsof -t -i:5001)
   ```

2. Or use different ports in `.env` files

---

## Production Deployment

For production on separate Ubuntu machines:

1. Install Node.js, MongoDB, FFmpeg on each machine
2. Copy backend code to each edge server
3. Configure `.env` with correct IP addresses
4. Register edge servers in admin dashboard
5. Videos will automatically sync to all edge servers

---

## Summary

- **Origin Server**: Port 5000 - Where you upload videos
- **Edge Servers**: Ports 5001, 5002, 5003 - Receive pushed videos
- **How It Works**: Origin server pushes videos to edge servers automatically
- **Load Balancing**: System distributes requests across active edge servers
- **Monitoring**: Check status in Edge Server Management dashboard

**Last Updated:** January 2025

