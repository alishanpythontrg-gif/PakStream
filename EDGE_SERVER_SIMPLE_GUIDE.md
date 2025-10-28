# Simple Edge Server Guide for Ubuntu

## What Are Edge Servers?

Edge servers are additional servers that store copies of your videos. When you upload a video to the origin server, it automatically gets pushed to all edge servers. This reduces load on the origin server.

---

## Quick Setup (5 Minutes)

### Step 1: Run the Setup Script

```bash
chmod +x start-edge-servers.sh
./start-edge-servers.sh
```

This will create 3 edge server directories.

### Step 2: Start Your Servers

Open **4 terminal windows** and run these commands:

**Terminal 1 - Start Origin Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Start Edge Server 1:**
```bash
cd edge-5001/backend
npm start
```

**Terminal 3 - Start Edge Server 2:**
```bash
cd edge-5002/backend
npm start
```

**Terminal 4 - Start Edge Server 3:**
```bash
cd edge-5003/backend
npm start
```

### Step 3: Register Edge Servers

1. Open browser: `http://localhost:3000`
2. Login as admin
3. Scroll to "Edge Server Management" section
4. Click "Register Edge Server" button

**Register Edge Server 1:**
- Name: Edge Server 1
- Host: localhost
- Port: 5001
- Protocol: http
- API Key: edge-server-1-secret-key
- Storage: 1000 GB
- Bandwidth: 1000 Mbps
- Region: Building A
- Datacenter: Server Room 1

**Register Edge Server 2:**
- Name: Edge Server 2
- Host: localhost
- Port: 5002
- Protocol: http
- API Key: edge-server-2-secret-key
- Storage: 1000 GB
- Bandwidth: 1000 Mbps
- Region: Building B
- Datacenter: Server Room 2

**Register Edge Server 3:**
- Name: Edge Server 3
- Host: localhost
- Port: 5003
- Protocol: http
- API Key: edge-server-3-secret-key
- Storage: 1000 GB
- Bandwidth: 1000 Mbps
- Region: Building C
- Datacenter: Server Room 3

### Step 4: Test It!

1. Upload a video through the admin dashboard
2. Wait for processing to complete
3. Check edge server terminals - you should see sync messages
4. Videos are now available on all edge servers!

---

## What Happens?

```
Origin Server (Port 5000)
    |
    | Admin uploads video
    v
Video processed
    |
    | Auto-push to edge servers
    v
Edge Server 1 (Port 5001) ✓
Edge Server 2 (Port 5002) ✓
Edge Server 3 (Port 5003) ✓
```

---

## Stop Edge Servers

Press `Ctrl+C` in each terminal window to stop the servers.

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

```bash
# Kill process on port 5001
sudo kill -9 $(sudo lsof -t -i:5001)

# Repeat for ports 5002, 5003
sudo kill -9 $(sudo lsof -t -i:5002)
sudo kill -9 $(sudo lsof -t -i:5003)
```

### Edge Server Not Responding

1. Check the terminal for error messages
2. Make sure MongoDB is running: `sudo systemctl status mongod`
3. Check if the port is open: `curl http://localhost:5001/api/edge/health`

### Video Not Syncing

1. Check origin server logs for sync errors
2. Verify edge server status in admin dashboard (should be "active")
3. Make sure API keys match exactly

---

## Files Created

After running the script, you'll have:

```
PakStream/
├── backend/          (Origin server - port 5000)
├── edge-5001/backend (Edge server 1 - port 5001)
├── edge-5002/backend (Edge server 2 - port 5002)
└── edge-5003/backend (Edge server 3 - port 5003)
```

---

## Summary

- **1 origin server** (where you upload)
- **3 edge servers** (where videos are copied)
- **Automatic sync** when videos are uploaded
- **Load balancing** across edge servers

That's it! Simple and ready to test.

