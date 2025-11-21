# Quick Start Guide

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB RAM available
- Ports 3000, 5000, 9000, 9001, 27017 available

## Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Navigate to project directory
cd PakStream

# Copy environment files (if they don't exist)
cp backend/.env.example backend/.env 2>/dev/null || true
cp frontend/.env.example frontend/.env 2>/dev/null || true
```

### 2. Configure Environment (Optional)

Edit `backend/.env`:
```bash
CORS_ORIGIN=*
STORAGE_TYPE=local  # or 'minio' for object storage
JWT_SECRET=your-secret-key-here
```

Edit `frontend/.env`:
```bash
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **MinIO Console**: http://localhost:9001 (if using MinIO)
  - Default credentials: `minioadmin` / `minioadmin`

### 5. Verify Installation

```bash
# Check backend health
curl http://localhost:5000/api/videos

# Check all services
docker-compose ps
```

## Using MinIO Storage

### Enable MinIO

1. Edit `backend/.env`:
   ```bash
   STORAGE_TYPE=minio
   MINIO_ENDPOINT=minio
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_BUCKET_NAME=pakstream-videos
   ```

2. Restart backend:
   ```bash
   docker-compose restart backend
   ```

3. Create bucket in MinIO console:
   - Go to http://localhost:9001
   - Login with MinIO credentials
   - Create bucket: `pakstream-videos`
   - Set policy to `public-read` (or use presigned URLs)

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild after code changes
docker-compose up -d --build

# Access backend shell
docker-compose exec backend sh

# Access MongoDB shell
docker-compose exec mongodb mongosh

# Clean up everything (WARNING: deletes data)
docker-compose down -v
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :5000  # or :3000, :9000, etc.

# Kill process or change port in docker-compose.yml
```

### Videos Not Playing

1. Check CORS: Ensure `CORS_ORIGIN=*` in `backend/.env`
2. Check browser console for errors
3. Verify backend is running: `docker-compose logs backend`
4. Test HLS endpoint: `curl http://localhost:5000/api/videos/{videoId}/hls/{masterPlaylist}.m3u8`

### MinIO Connection Issues

1. Check MinIO is running: `docker-compose ps minio`
2. Verify credentials match in `backend/.env`
3. Check network: `docker-compose exec backend ping minio`

### FFmpeg Not Found

```bash
# Check FFmpeg in container
docker-compose exec backend ffmpeg -version

# Should show FFmpeg version, if not, rebuild:
docker-compose up -d --build backend
```

## Production Deployment

For production deployment, see `AIRGAPPED_DEPLOYMENT.md` for:
- Airgapped deployment instructions
- Security hardening
- Backup procedures
- Scaling considerations

## Next Steps

1. Create admin user (see `ADMIN_SETUP.md`)
2. Upload test video
3. Configure MinIO (if using object storage)
4. Set up backups
5. Configure monitoring

