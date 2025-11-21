# Airgapped Deployment Guide

This guide explains how to deploy PakStream in an airgapped (offline) environment without internet connectivity.

## Overview

PakStream has been configured to work in airgapped environments by:
1. Removing internet dependencies (ffmpeg-static replaced with system FFmpeg)
2. Supporting MinIO object storage (runs in Docker, no internet needed)
3. Using Docker for containerized deployment
4. Allowing offline npm package installation

## Prerequisites

Before deploying in an airgapped environment, you need to:

1. **Prepare Docker images** (on a machine with internet):
   - Pull base images: `node:18-slim`, `mongo:7.0`, `minio/minio:latest`, `nginx:alpine`
   - Build application images: `docker-compose build`
   - Save images: `docker save -o pakstream-images.tar $(docker-compose config | grep image | awk '{print $2}')`

2. **Prepare npm packages** (on a machine with internet):
   - Run `npm ci` in both `backend/` and `frontend/` directories
   - Copy `node_modules` directories to airgapped machine

3. **Transfer to airgapped machine**:
   - Docker images tar file
   - Source code with node_modules
   - This deployment guide

## Deployment Steps

### Step 1: Load Docker Images

```bash
# Load Docker images
docker load -i pakstream-images.tar

# Verify images are loaded
docker images
```

### Step 2: Configure Environment Variables

```bash
# Copy example environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
nano .env
nano backend/.env
nano frontend/.env
```

**Important environment variables:**

```bash
# In root .env (for docker-compose)
STORAGE_TYPE=minio  # or 'local' for local filesystem
MINIO_ROOT_USER=your-minio-user
MINIO_ROOT_PASSWORD=your-minio-password
JWT_SECRET=your-strong-random-secret-key
CORS_ORIGIN=*  # or specific origins

# In backend/.env
STORAGE_TYPE=minio  # Must match docker-compose
MINIO_ENDPOINT=minio  # Docker service name
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-minio-user
MINIO_SECRET_KEY=your-minio-password
MINIO_BUCKET_NAME=pakstream-videos

# In frontend/.env
REACT_APP_API_URL=http://your-backend-ip:5000/api
REACT_APP_SOCKET_URL=http://your-backend-ip:5000
```

### Step 3: Build Frontend (if needed)

If you need to rebuild the frontend with new environment variables:

```bash
cd frontend
npm run build
cd ..
```

### Step 4: Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 5: Initialize MinIO Bucket (if using MinIO)

```bash
# Access MinIO console
# Open browser to: http://your-server-ip:9001
# Login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
# Create bucket: pakstream-videos (or your configured bucket name)
# Set bucket policy to public-read or use presigned URLs
```

Alternatively, use MinIO client:

```bash
# Install MinIO client (mc) on airgapped machine
# Or use Docker:
docker run --rm -it --network pakstream_pakstream-network \
  minio/mc alias set myminio http://minio:9000 minioadmin minioadmin
docker run --rm -it --network pakstream_pakstream-network \
  minio/mc mb myminio/pakstream-videos
```

### Step 6: Verify Deployment

1. **Check backend health:**
   ```bash
   curl http://localhost:5000/api/videos
   ```

2. **Check frontend:**
   ```bash
   curl http://localhost:3000
   ```

3. **Check MinIO (if enabled):**
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

## Storage Options

### Option 1: Local Filesystem (Simpler)

Set `STORAGE_TYPE=local` in environment variables. Files are stored in Docker volumes.

**Pros:**
- Simpler setup
- No additional service needed
- Good for single-server deployments

**Cons:**
- Not scalable
- Files lost if volume deleted
- Harder to backup

### Option 2: MinIO Object Storage (Recommended)

Set `STORAGE_TYPE=minio` in environment variables. Files are stored in MinIO.

**Pros:**
- Scalable
- S3-compatible API
- Better for distributed deployments
- Easier backup and migration

**Cons:**
- Additional service to manage
- Slightly more complex setup

## Troubleshooting

### Videos Not Playing

1. **Check CORS configuration:**
   - Ensure `CORS_ORIGIN=*` or includes your frontend URL
   - Check browser console for CORS errors

2. **Check HLS segment serving:**
   - Verify segments are accessible: `curl http://localhost:5000/api/videos/{videoId}/hls/{segment}.ts`
   - Check CORS headers are present

3. **Check storage:**
   - Verify files exist in storage (local or MinIO)
   - Check storage service logs: `docker-compose logs backend`

### FFmpeg Not Found

1. **Check FFmpeg path:**
   ```bash
   docker-compose exec backend which ffmpeg
   docker-compose exec backend ffmpeg -version
   ```

2. **Set FFMPEG_PATH environment variable:**
   ```bash
   # In backend/.env
   FFMPEG_PATH=/usr/bin/ffmpeg
   ```

### MinIO Connection Issues

1. **Check MinIO is running:**
   ```bash
   docker-compose ps minio
   docker-compose logs minio
   ```

2. **Verify network connectivity:**
   ```bash
   docker-compose exec backend ping minio
   ```

3. **Check credentials:**
   - Ensure `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` match `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`

## Maintenance

### Backup

1. **MongoDB backup:**
   ```bash
   docker-compose exec mongodb mongodump --out /data/backup
   docker cp pakstream-mongodb:/data/backup ./mongodb-backup
   ```

2. **MinIO backup (if using):**
   ```bash
   docker-compose exec minio mc mirror /data/pakstream-videos ./minio-backup
   ```

3. **Local files backup (if using):**
   ```bash
   docker cp pakstream-backend:/app/uploads ./uploads-backup
   ```

### Updates

To update the application in airgapped environment:

1. Build new images on internet-connected machine
2. Transfer images to airgapped machine
3. Load new images: `docker load -i new-images.tar`
4. Restart services: `docker-compose up -d --force-recreate`

## Security Considerations

1. **Change default passwords:**
   - JWT_SECRET
   - MinIO root credentials
   - MongoDB (if authentication enabled)

2. **Restrict network access:**
   - Use firewall rules
   - Limit exposed ports
   - Use internal Docker networks

3. **Regular updates:**
   - Keep Docker images updated
   - Monitor security advisories
   - Apply patches when available

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Review configuration files
- Verify environment variables
- Check network connectivity between services

