# PakStream Microservices Migration Plan

## Current Architecture Analysis

**Monolithic Backend:**
- Express.js server with MongoDB
- Single codebase handling all domains
- Socket.IO for real-time features
- Video processing (FFmpeg) and presentation processing (LibreOffice)
- File storage in local filesystem

**Key Domains Identified:**
1. Authentication & Authorization
2. User Management
3. Video Management & Processing
4. Premiere/Live Streaming
5. Presentation Management
6. Real-time Communication (Socket.IO)
7. File Storage & CDN
8. API Gateway (needed for microservices)

---

## Proposed Microservices Architecture

### **9 Core Microservices + 1 API Gateway**

#### **1. Auth Service** (Port: 3001)

**Responsibilities:**
- User registration (regular & admin)
- Login/logout
- JWT token generation & validation
- Password management (change password, reset)
- Token refresh mechanism

**Database:** MongoDB (users collection - auth data only)

**Key Files to Extract:**
- `backend/src/controllers/authController.js`
- `backend/src/middleware/auth.js` (JWT validation)
- `backend/src/models/User.js` (auth-related fields)

**API Endpoints:**
- `POST /api/auth/register`
- `POST /api/auth/register-admin`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh-token`
- `PUT /api/auth/change-password`
- `GET /api/auth/validate-token`

**Dependencies:**
- MongoDB
- JWT library
- bcryptjs

---

#### **2. User Service** (Port: 3002)

**Responsibilities:**
- User profile management (CRUD)
- User search & listing
- User preferences management
- User statistics (views, uploads, etc.)
- Admin user management operations

**Database:** MongoDB (users collection - profile data)

**Key Files to Extract:**
- `backend/src/controllers/userController.js`
- `backend/src/routes/user.js`
- User profile-related model fields

**API Endpoints:**
- `GET /api/users` (admin: list all users)
- `GET /api/users/:id`
- `GET /api/users/:id/profile`
- `PUT /api/users/:id/profile`
- `PUT /api/users/:id/preferences`
- `PUT /api/users/:id` (admin: update user)
- `DELETE /api/users/:id` (admin)
- `POST /api/users/:id/toggle-status` (admin)

**Dependencies:**
- MongoDB
- Auth Service (for token validation via API Gateway)

---

#### **3. Video Service** (Port: 3003)

**Responsibilities:**
- Video metadata management (CRUD)
- Video listing, search, filtering
- Video status tracking
- Video view tracking
- Featured videos management
- Video categorization & tagging

**Database:** MongoDB (videos collection)

**Key Files to Extract:**
- `backend/src/controllers/videoController.js` (metadata operations only)
- `backend/src/routes/video.js`
- `backend/src/models/Video.js`

**API Endpoints:**
- `GET /api/videos`
- `GET /api/videos/featured`
- `GET /api/videos/:id`
- `GET /api/videos/user/:userId`
- `POST /api/videos` (create metadata record)
- `PUT /api/videos/:id`
- `DELETE /api/videos/:id` (admin only)
- `POST /api/videos/:id/view` (track view)
- `GET /api/videos/:id/status`

**Dependencies:**
- MongoDB
- Video Processing Service (for processing status)
- File Storage Service (for file URLs)

**Note:** Upload endpoint handled by File Storage Service, metadata created here

---

#### **4. Video Processing Service** (Port: 3004)

**Responsibilities:**
- Video transcoding (FFmpeg)
- HLS variant generation (360p, 480p, 720p, 1080p)
- Thumbnail generation
- Processing queue management
- Progress tracking & WebSocket notifications

**Database:** MongoDB (processing jobs collection) or Redis (for queue)

**Key Files to Extract:**
- `backend/src/services/videoProcessor.js`
- `backend/src/services/videoQueue.js`
- Processing-related endpoints from `videoController.js`

**API Endpoints:**
- `POST /api/processing/videos/:videoId/start`
- `GET /api/processing/videos/:videoId/status`
- `GET /api/processing/queue/status`
- `POST /api/processing/videos/:videoId/cancel`

**WebSocket Events:**
- `videoProcessingProgress`
- `videoProcessingComplete`
- `videoProcessingError`

**Dependencies:**
- FFmpeg
- Redis (for queue management)
- File Storage Service (read original, write processed)
- Video Service (update video status)
- Socket Service (for progress notifications)

**Technology Considerations:**
- CPU-intensive, should scale horizontally
- Consider containerization with resource limits
- May need dedicated worker nodes

---

#### **5. Premiere Service** (Port: 3005)

**Responsibilities:**
- Premiere creation & scheduling
- Premiere status management
- Premiere listing (active, upcoming, past)
- Premiere metadata management
- Viewer tracking

**Database:** MongoDB (premieres collection)

**Key Files to Extract:**
- `backend/src/controllers/premiereController.js`
- `backend/src/routes/premiere.js`
- `backend/src/models/Premiere.js`

**API Endpoints:**
- `POST /api/premieres`
- `GET /api/premieres/active`
- `GET /api/premieres/upcoming`
- `GET /api/premieres`
- `GET /api/premieres/:id`
- `PUT /api/premieres/:id`
- `DELETE /api/premieres/:id`
- `POST /api/premieres/:id/join`
- `POST /api/premieres/:id/end`

**Dependencies:**
- MongoDB
- Video Service (validate video exists)
- Socket Service (for real-time synchronization)

---

#### **6. Presentation Service** (Port: 3006)

**Responsibilities:**
- Presentation metadata management
- Presentation listing & search
- Presentation slide management
- Presentation processing coordination

**Database:** MongoDB (presentations collection)

**Key Files to Extract:**
- `backend/src/controllers/presentationController.js` (metadata operations)
- `backend/src/routes/presentation.js`
- `backend/src/models/Presentation.js`

**API Endpoints:**
- `GET /api/presentations`
- `GET /api/presentations/:id`
- `GET /api/presentations/:id/slides`
- `POST /api/presentations` (create metadata)
- `PUT /api/presentations/:id`
- `DELETE /api/presentations/:id`

**Dependencies:**
- MongoDB
- Presentation Processing Service (for processing status)
- File Storage Service (for slide images)

**Note:** Actual file processing handled by Presentation Processing Service

---

#### **7. Presentation Processing Service** (Port: 3007)

**Responsibilities:**
- PPTX to PNG conversion (LibreOffice)
- Thumbnail generation (ImageMagick)
- Processing queue management
- Progress tracking

**Database:** MongoDB (processing jobs) or Redis

**Key Files to Extract:**
- `backend/src/services/presentationProcessor.js`
- Processing logic from `presentationController.js`

**API Endpoints:**
- `POST /api/processing/presentations/:presentationId/start`
- `GET /api/processing/presentations/:presentationId/status`

**Dependencies:**
- LibreOffice
- ImageMagick/Poppler
- File Storage Service
- Presentation Service (update status)

**Technology Considerations:**
- CPU-intensive, similar to video processing
- May need dedicated worker nodes

---

#### **8. Socket Service** (Port: 3008)

**Responsibilities:**
- Real-time WebSocket connections
- Premiere synchronization (play/pause/seek)
- Chat functionality
- Viewer count management
- Video processing progress broadcasting

**Key Files to Extract:**
- `backend/src/socket/socketHandler.js`
- Socket.IO server setup

**WebSocket Events:**
- Premiere: `join-premiere`, `leave-premiere`, `play-video`, `pause-video`, `seek-video`, `send-message`
- Admin: `admin-start-premiere`, `admin-end-premiere`
- Processing: `videoProcessingProgress`, `videoProcessingComplete`

**Dependencies:**
- Socket.IO
- Premiere Service (for premiere data)
- Video Processing Service (for progress updates)
- Redis (for scaling across instances)

**Scaling Considerations:**
- Use Redis adapter for Socket.IO to scale horizontally
- Consider separate Socket Service instances

---

#### **9. File Storage Service** (Port: 3009)

**Responsibilities:**
- File upload handling (videos, presentations)
- File serving (static files, HLS segments, images)
- CDN integration
- File deletion
- Storage management

**Key Files to Extract:**
- `backend/src/middleware/upload.js`
- `backend/src/middleware/presentationUpload.js`
- `backend/src/utils/cdnUtils.js`
- Static file serving from `server.js`

**API Endpoints:**
- `POST /api/storage/upload/video`
- `POST /api/storage/upload/presentation`
- `GET /api/storage/files/:fileId`
- `GET /api/storage/videos/:videoId/original`
- `GET /api/storage/videos/:videoId/hls/:playlist`
- `GET /api/storage/presentations/:presentationId/slides/:slideNumber`
- `DELETE /api/storage/files/:fileId`

**Dependencies:**
- Multer (for uploads)
- File system or Object Storage (S3, etc.)
- CDN service (if using external CDN)

**Storage Options:**
- Local filesystem (current)
- AWS S3 / Google Cloud Storage
- MinIO (self-hosted S3-compatible)

---

#### **10. API Gateway** (Port: 3000)

**Responsibilities:**
- Request routing to appropriate services
- Authentication middleware (validates tokens via Auth Service)
- Rate limiting
- Request/response logging
- CORS handling
- Load balancing

**Technology Options:**
- Express.js with http-proxy-middleware
- Kong
- Nginx
- AWS API Gateway
- Traefik

**Routing Configuration:**
```
/api/auth/*          -> Auth Service (3001)
/api/users/*         -> User Service (3002)
/api/videos/*        -> Video Service (3003)
/api/processing/*    -> Video Processing (3004) or Presentation Processing (3007)
/api/premieres/*     -> Premiere Service (3005)
/api/presentations/* -> Presentation Service (3006)
/api/storage/*       -> File Storage Service (3009)
/ws                  -> Socket Service (3008)
```

**Authentication Flow:**
1. Extract JWT token from request
2. Validate token with Auth Service
3. Attach user info to request
4. Forward to target service

---

## Database Strategy

### Option 1: Shared Database (Easier Migration)
- Single MongoDB instance
- Each service accesses its own collections
- **Pros:** Easier migration, no data sync issues
- **Cons:** Tight coupling, harder to scale independently

### Option 2: Database per Service (Recommended)
- Each service has its own database
- Services communicate via APIs
- **Pros:** True microservices, independent scaling
- **Cons:** More complex, need data synchronization strategy

**Recommended Approach:** Start with shared database, migrate to separate databases gradually

---

## Inter-Service Communication

### Synchronous (HTTP/REST)
- API Gateway -> Services
- Service -> Service (via API Gateway or direct)
- Use axios/fetch for HTTP calls

### Asynchronous (Message Queue)
- Video upload -> Video Processing Service
- Presentation upload -> Presentation Processing Service
- Use Redis/RabbitMQ/Kafka for queues

### Real-time (WebSocket)
- Socket Service -> Clients
- Services -> Socket Service (for broadcasting)

---

## Migration Strategy

### Phase 1: Preparation (Week 1-2)
1. Set up API Gateway
2. Extract shared utilities (JWT validation, error handling)
3. Create shared npm package for common code
4. Set up service discovery/configuration

### Phase 2: Extract Auth Service (Week 3)
1. Create Auth Service
2. Move authentication logic
3. Update API Gateway to route auth requests
4. Update frontend to use new endpoints
5. Test thoroughly

### Phase 3: Extract User Service (Week 4)
1. Create User Service
2. Move user management logic
3. Update API Gateway routing
4. Test user operations

### Phase 4: Extract File Storage Service (Week 5)
1. Create File Storage Service
2. Move upload/download logic
3. Update video/presentation services to use File Storage API
4. Test file operations

### Phase 5: Extract Video Service (Week 6)
1. Create Video Service (metadata only)
2. Move video CRUD operations
3. Keep processing logic in monolith temporarily
4. Test video metadata operations

### Phase 6: Extract Video Processing Service (Week 7-8)
1. Create Video Processing Service
2. Move FFmpeg processing logic
3. Set up message queue for processing jobs
4. Update Video Service to trigger processing
5. Test video upload & processing flow

### Phase 7: Extract Presentation Services (Week 9)
1. Create Presentation Service
2. Create Presentation Processing Service
3. Move processing logic
4. Test presentation upload & processing

### Phase 8: Extract Premiere Service (Week 10)
1. Create Premiere Service
2. Move premiere logic
3. Test premiere operations

### Phase 9: Extract Socket Service (Week 11)
1. Create Socket Service
2. Move Socket.IO logic
3. Set up Redis adapter for scaling
4. Test real-time features

### Phase 10: Cleanup & Optimization (Week 12)
1. Remove old monolithic code
2. Optimize inter-service communication
3. Add monitoring & logging
4. Performance testing
5. Documentation

---

## Infrastructure Requirements

### Development
- Docker Compose for local development
- Each service in separate container
- Shared MongoDB instance
- Redis for queues/caching

### Production
- Kubernetes or Docker Swarm
- Service mesh (Istio/Linkerd) for service-to-service communication
- Load balancer for API Gateway
- Monitoring (Prometheus + Grafana)
- Logging (ELK stack or similar)
- Distributed tracing (Jaeger/Zipkin)

---

## Key Challenges & Solutions

### Challenge 1: Shared Database
**Solution:** Start with shared DB, migrate to separate DBs gradually

### Challenge 2: File Storage
**Solution:** Use object storage (S3/MinIO) instead of local filesystem

### Challenge 3: Real-time Features
**Solution:** Use Redis adapter for Socket.IO to scale horizontally

### Challenge 4: Video Processing Performance
**Solution:**
- Dedicated worker nodes
- Horizontal scaling
- Consider cloud transcoding services (AWS MediaConvert, etc.)

### Challenge 5: Service Discovery
**Solution:** Use Consul, Eureka, or Kubernetes service discovery

### Challenge 6: Distributed Transactions
**Solution:** Use Saga pattern or eventual consistency

---

## Monitoring & Observability

### Required Tools
- **APM:** New Relic, Datadog, or OpenTelemetry
- **Logging:** ELK stack or Loki
- **Metrics:** Prometheus + Grafana
- **Tracing:** Jaeger or Zipkin
- **Health Checks:** Each service exposes `/health` endpoint

---

## Estimated Microservices Count

**Total: 9 Services + 1 API Gateway**

1. Auth Service
2. User Service
3. Video Service
4. Video Processing Service
5. Premiere Service
6. Presentation Service
7. Presentation Processing Service
8. Socket Service
9. File Storage Service
10. API Gateway (infrastructure, not a microservice)

**Alternative (Simpler): 6 Services**

If combining related services:
1. Auth Service
2. User Service
3. Video Service (metadata + processing)
4. Premiere Service
5. Presentation Service (metadata + processing)
6. Socket Service
7. File Storage Service
8. API Gateway

---

## Technology Stack Recommendations

### Each Service
- **Runtime:** Node.js (Express.js)
- **Database:** MongoDB (per service or shared)
- **Message Queue:** Redis (Bull/BullMQ) or RabbitMQ
- **Caching:** Redis

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Kubernetes or Docker Swarm
- **API Gateway:** Kong, Traefik, or Express.js proxy
- **Service Mesh:** Istio (optional, for advanced scenarios)

### Development Tools
- **Service Template:** Create base Express.js template
- **Shared Package:** Common utilities, types, middleware
- **Local Development:** Docker Compose

---

## Service Dependencies Diagram

```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ├───► Auth Service ────┐
       │                        │
       ├───► User Service ─────┤
       │                        │
       ├───► Video Service ────┤───► Video Processing Service
       │                        │         │
       ├───► Premiere Service ──┤         │
       │                        │         │
       ├───► Presentation Svc ──┤         │
       │                        │         │
       ├───► File Storage Svc ─┼─────────┘
       │                        │
       └───► Socket Service ───┘
                │
                └───► Redis (for scaling)
```

---

## Data Flow Examples

### Video Upload Flow
1. Client → API Gateway → File Storage Service (upload file)
2. File Storage Service → Video Service (create metadata)
3. Video Service → Video Processing Service (trigger processing via queue)
4. Video Processing Service → File Storage Service (store processed files)
5. Video Processing Service → Video Service (update status)
6. Video Processing Service → Socket Service (broadcast progress)

### Premiere Flow
1. Client → API Gateway → Premiere Service (create premiere)
2. Client → Socket Service (join premiere room)
3. Admin → Socket Service (start premiere)
4. Socket Service → All clients in room (synchronize playback)
5. Client → Socket Service (chat message)
6. Socket Service → All clients in room (broadcast message)

---

## Next Steps

1. **Decide on service boundaries** (9 services vs simplified 6)
2. **Choose database strategy** (shared vs per-service)
3. **Set up development environment** (Docker Compose)
4. **Create API Gateway** first
5. **Start with Auth Service** (least dependencies)
6. **Gradually extract other services**
7. **Add monitoring & logging** early
8. **Test thoroughly** at each phase

---

## Benefits of Microservices Architecture

1. **Independent Scaling:** Scale video processing separately from API services
2. **Technology Flexibility:** Use different tech stacks per service if needed
3. **Team Autonomy:** Different teams can work on different services
4. **Fault Isolation:** One service failure doesn't bring down entire system
5. **Deployment Independence:** Deploy services independently
6. **Better Resource Utilization:** Allocate resources based on service needs

---

## Risks & Mitigation

1. **Complexity:** More moving parts → Use infrastructure as code, monitoring
2. **Network Latency:** Inter-service calls → Use caching, async communication
3. **Data Consistency:** Distributed data → Use eventual consistency, Saga pattern
4. **Debugging:** Harder to trace issues → Use distributed tracing
5. **Testing:** More complex testing → Use contract testing, integration tests

---

## Cost Considerations

### Development Costs
- Additional infrastructure setup time
- Learning curve for team
- More complex deployment pipelines

### Operational Costs
- Multiple service instances (more containers/VMs)
- Additional network traffic
- Monitoring and logging tools
- Service discovery infrastructure

### Benefits
- Better resource utilization
- Independent scaling reduces waste
- Faster development cycles
- Easier to optimize individual services

---

## Success Metrics

### Performance Metrics
- API response time (should improve with independent scaling)
- Video processing throughput
- System uptime per service

### Development Metrics
- Deployment frequency (should increase)
- Time to deploy (should decrease per service)
- Bug resolution time (should improve with isolation)

### Business Metrics
- User satisfaction
- Feature delivery speed
- System reliability

---

## Conclusion

This migration plan provides a comprehensive roadmap for converting PakStream from a monolithic architecture to a microservices architecture. The plan identifies 9 core microservices plus an API Gateway, with a phased migration strategy over 12 weeks.

Key recommendations:
- Start with shared database, migrate gradually
- Begin with Auth Service (least dependencies)
- Use Docker Compose for local development
- Implement monitoring and logging early
- Test thoroughly at each phase

The microservices architecture will provide better scalability, fault tolerance, and development velocity, while requiring more infrastructure and operational complexity.

