# CDN Integration Guide for PakStream

## Overview

This guide provides recommendations and implementation steps for integrating a CDN (Content Delivery Network) to solve the single origin server bottleneck and improve video delivery performance for 4000+ concurrent streams.

## Why CDN is Critical

### Current Issues (Without CDN)
- ❌ **Single origin bottleneck** - Cannot handle 4000 concurrent streams
- ❌ **High latency** - Remote users experience slow load times
- ❌ **Bandwidth waste** - Every request hits origin server
- ❌ **Single point of failure** - Origin down = system down
- ❌ **Poor scalability** - Cannot handle traffic spikes

### Benefits with CDN
- ✅ **Global distribution** - Content served from edge locations worldwide
- ✅ **Reduced latency** - Users get content from nearest server
- ✅ **Origin protection** - CDN shields origin from direct traffic
- ✅ **Bandwidth savings** - 90%+ of traffic served from cache
- ✅ **High availability** - Multiple redundant servers
- ✅ **DDoS protection** - Built-in security features

---

## Recommended CDN Providers

### 1. **Cloudflare** (Recommended for Pakistan)
**Pros:**
- Free tier available with unlimited bandwidth
- 300+ data centers worldwide (including Pakistan neighbors)
- Built-in video optimization
- Automatic caching of HLS segments
- DDoS protection included
- Easy setup with minimal configuration

**Pricing:**
- Free: $0/month (good for starting)
- Pro: $20/month (recommended for production)
- Business: $200/month (for high traffic)

**Setup Time:** 30 minutes

### 2. **Bunny CDN**
**Pros:**
- Extremely affordable ($0.01/GB)
- Optimized for video streaming
- Built-in video processing
- Great for HLS/DASH streaming
- 114 PoPs globally

**Pricing:**
- Pay-as-you-go: ~$10-50/month for moderate traffic
- Volume discounts available

**Setup Time:** 1 hour

### 3. **AWS CloudFront**
**Pros:**
- Enterprise-grade infrastructure
- Integration with S3 for storage
- Highly scalable
- Advanced features and customization

**Cons:**
- More complex setup
- Higher costs
- Requires AWS expertise

**Pricing:**
- $0.085/GB (first 10TB)
- Decreases with volume

**Setup Time:** 2-3 hours

### 4. **DigitalOcean Spaces + CDN**
**Pros:**
- Simple setup
- Integrated CDN included
- $5/month for 250GB storage + 1TB bandwidth
- Good for startups

**Pricing:**
- $5/month base
- Additional storage: $0.02/GB
- Additional bandwidth: $0.01/GB

**Setup Time:** 1 hour

---

## Implementation Strategy

### Phase 1: Basic CDN Integration (Week 1)

#### Step 1: Choose CDN Provider
Recommendation: **Start with Cloudflare** (free tier)

#### Step 2: DNS Configuration
1. Point your domain to Cloudflare nameservers
2. Enable proxy for your domain
3. Configure SSL/TLS (Full mode)

#### Step 3: Caching Rules for Videos
```nginx
# Cloudflare Page Rules
URL Pattern: *pakstream.com/uploads/videos/*

Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
- Browser Cache TTL: 4 hours
- Origin Cache Control: On
```

#### Step 4: Update Backend Headers
Already implemented in `/backend/src/routes/video.js`:
```javascript
// HLS segments - cache forever (immutable)
res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

// Playlists - no cache
res.setHeader('Cache-Control', 'no-cache');

// Thumbnails - 1 day cache
res.setHeader('Cache-Control', 'public, max-age=86400');
```

---

### Phase 2: Object Storage Integration (Week 2)

Move video files to object storage for better scalability.

#### Recommended: AWS S3 or DigitalOcean Spaces

**Benefits:**
- Unlimited scalability
- 99.99% durability
- Automatic redundancy
- Lower costs than local storage

**Implementation:**

1. **Install AWS SDK**
```bash
cd backend
npm install aws-sdk
```

2. **Create S3/Spaces Configuration**
```javascript
// backend/src/config/storage.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: process.env.SPACES_ENDPOINT || 's3.amazonaws.com',
  accessKeyId: process.env.SPACES_KEY,
  secretAccessKey: process.env.SPACES_SECRET,
  region: process.env.SPACES_REGION || 'us-east-1'
});

module.exports = { s3 };
```

3. **Update Video Upload to Use S3**
```javascript
// backend/src/services/videoUpload.js
const { s3 } = require('../config/storage');
const fs = require('fs');

async function uploadToS3(localPath, key) {
  const fileContent = fs.readFileSync(localPath);
  
  const params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: key,
    Body: fileContent,
    ACL: 'public-read',
    ContentType: 'video/mp4'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}
```

4. **Environment Variables**
```env
# .env
SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
SPACES_KEY=your_access_key
SPACES_SECRET=your_secret_key
SPACES_BUCKET=pakstream-videos
SPACES_REGION=nyc3
CDN_URL=https://pakstream-videos.nyc3.cdn.digitaloceanspaces.com
```

---

### Phase 3: Advanced Optimization (Week 3)

#### 1. Implement Video Streaming from CDN

Update video service to use CDN URLs:

```typescript
// frontend/src/services/videoService.ts
const CDN_URL = process.env.REACT_APP_CDN_URL || '';

getMasterPlaylistUrl(video: Video): string {
  if (video.status !== 'ready' || !video.processedFiles?.hls?.masterPlaylist) {
    return '';
  }

  const baseUrl = CDN_URL || `${API_BASE_URL.replace('/api', '')}`;
  return `${baseUrl}/uploads/videos/processed/${video._id}/hls/${video.processedFiles.hls.masterPlaylist}`;
}
```

#### 2. Implement CDN Purge on Video Update

```javascript
// backend/src/services/cdnPurge.js
const axios = require('axios');

async function purgeCloudflareCache(videoId) {
  const files = [
    `https://pakstream.com/uploads/videos/processed/${videoId}/hls/*`
  ];

  await axios.post(
    `https://api.cloudflare.com/client/v4/zones/${process.env.CF_ZONE_ID}/purge_cache`,
    { files },
    {
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
```

#### 3. Add CDN Health Monitoring

```javascript
// backend/src/services/cdnMonitor.js
const axios = require('axios');

async function checkCDNHealth() {
  try {
    const response = await axios.get(process.env.CDN_HEALTH_URL, {
      timeout: 5000
    });
    return response.status === 200;
  } catch (error) {
    console.error('CDN health check failed:', error);
    return false;
  }
}

// Run every 5 minutes
setInterval(checkCDNHealth, 5 * 60 * 1000);
```

---

## Configuration Examples

### Cloudflare Configuration

```yaml
# cloudflare-page-rules.yaml
rules:
  - url: "*pakstream.com/uploads/videos/*.ts"
    settings:
      cache_level: cache_everything
      edge_cache_ttl: 31536000  # 1 year
      browser_cache_ttl: 14400   # 4 hours
      
  - url: "*pakstream.com/uploads/videos/*.m3u8"
    settings:
      cache_level: bypass
      
  - url: "*pakstream.com/uploads/videos/*.jpg"
    settings:
      cache_level: cache_everything
      edge_cache_ttl: 86400      # 1 day
```

### Nginx Configuration (if using your own server)

```nginx
# nginx.conf
location ~ /uploads/videos/.*\.ts$ {
    # HLS segments - cache forever
    expires 365d;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin *;
}

location ~ /uploads/videos/.*\.m3u8$ {
    # Playlists - no cache
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Access-Control-Allow-Origin *;
}

location ~ /uploads/videos/.*\.(jpg|jpeg|png)$ {
    # Thumbnails - 1 day cache
    expires 1d;
    add_header Cache-Control "public";
    add_header Access-Control-Allow-Origin *;
}
```

---

## Performance Testing

### Before CDN (Baseline)
```bash
# Test from different locations
curl -w "@curl-format.txt" -o /dev/null -s https://pakstream.com/video.m3u8

Time to first byte: ~2000ms (Pakistan)
Time to first byte: ~5000ms (Europe)
Time to first byte: ~8000ms (USA)
```

### After CDN (Expected)
```bash
Time to first byte: ~50ms (Pakistan)
Time to first byte: ~100ms (Europe)
Time to first byte: ~150ms (USA)
```

---

## Cost Estimation

### Scenario: 4000 concurrent users, 500MB average video

**Without CDN (Current):**
- Bandwidth: 4000 users × 500MB = 2TB/hour
- Server costs: $500-1000/month (multiple servers needed)
- **Total: $500-1000/month + infrastructure complexity**

**With Cloudflare (Free tier):**
- Bandwidth: Unlimited
- CDN costs: $0
- Origin bandwidth: ~200GB (10% of traffic)
- **Total: $0-20/month**

**With Bunny CDN:**
- Bandwidth: 2TB × $0.01/GB = $20/hour peak
- Average: ~$300-500/month
- **Total: $300-500/month**

**With AWS CloudFront:**
- Bandwidth: 2TB × $0.085/GB = $170/hour peak
- Average: ~$1000-2000/month
- **Total: $1000-2000/month**

---

## Migration Checklist

### Pre-Migration
- [ ] Backup all video files
- [ ] Test CDN with sample videos
- [ ] Update DNS TTL to 5 minutes
- [ ] Prepare rollback plan

### Migration Day
- [ ] Enable CDN for test subdomain
- [ ] Verify HLS playback works
- [ ] Check analytics and monitoring
- [ ] Gradually route traffic to CDN
- [ ] Monitor error rates

### Post-Migration
- [ ] Verify all videos are accessible
- [ ] Check CDN cache hit ratio (should be >90%)
- [ ] Monitor origin server load (should drop 80%+)
- [ ] Update documentation
- [ ] Set up alerts for CDN issues

---

## Monitoring & Alerts

### Key Metrics to Track
1. **CDN Cache Hit Ratio** - Target: >90%
2. **Origin Server Load** - Should drop 80%+
3. **Video Start Time** - Target: <2 seconds
4. **Buffering Ratio** - Target: <1%
5. **CDN Bandwidth Usage** - Track costs

### Recommended Tools
- Cloudflare Analytics (built-in)
- Grafana + Prometheus for custom monitoring
- Uptime Robot for availability monitoring
- New Relic or Datadog for APM

---

## Troubleshooting

### Issue: Videos not loading from CDN
**Solution:**
1. Check CORS headers are set
2. Verify CDN cache rules
3. Check origin server is responding
4. Purge CDN cache

### Issue: High CDN costs
**Solution:**
1. Implement better caching rules
2. Optimize video compression
3. Use lower bitrates for popular content
4. Consider switching providers

### Issue: Slow video start time
**Solution:**
1. Reduce segment duration (10s → 6s)
2. Enable HTTP/2 push
3. Optimize playlist generation
4. Use adaptive bitrate streaming

---

## Next Steps

1. **Week 1**: Set up Cloudflare with basic caching
2. **Week 2**: Migrate to object storage (S3/Spaces)
3. **Week 3**: Optimize caching rules and monitoring
4. **Week 4**: Load testing and performance tuning

## Support Resources

- Cloudflare Docs: https://developers.cloudflare.com/stream/
- Bunny CDN Video Docs: https://docs.bunny.net/docs/stream
- AWS CloudFront Docs: https://docs.aws.amazon.com/cloudfront/
- HLS Streaming Best Practices: https://developer.apple.com/documentation/http_live_streaming

---

## Contact

For implementation assistance or questions:
- Create an issue in the repository
- Consult with DevOps team
- Reach out to CDN provider support

**Last Updated:** 2025-10-09

