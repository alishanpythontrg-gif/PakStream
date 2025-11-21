# Backend Dockerfile for PakStream
# Uses system FFmpeg instead of npm package (no internet needed after build)

FROM node:18-slim

# Install FFmpeg and other system dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm ci for reproducible builds)
# Note: For airgapped deployment, copy node_modules or use npm ci with offline cache
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/videos/original uploads/videos/processed uploads/presentations/original uploads/presentations/processed

# Expose port
EXPOSE 5000

# Set environment variable for FFmpeg path
ENV FFMPEG_PATH=/usr/bin/ffmpeg

# Start server
CMD ["node", "src/server.js"]

