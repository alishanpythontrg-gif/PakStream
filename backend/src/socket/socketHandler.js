const { Server } = require('socket.io');
const Premiere = require('../models/Premiere');

class SocketHandler {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://yourdomain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.premiereRooms = new Map(); // Store premiere room data
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join premiere room
      socket.on('join-premiere', async (premiereId) => {
        try {
          const premiere = await Premiere.findById(premiereId).populate('video');
          if (!premiere) {
            socket.emit('error', { message: 'Premiere not found' });
            return;
          }

          // Join the premiere room
          socket.join(`premiere-${premiereId}`);
          
          // Get or create room data
          if (!this.premiereRooms.has(premiereId)) {
            this.premiereRooms.set(premiereId, {
              viewers: new Set(),
              isLive: false,
              currentTime: 0,
              isPlaying: false,
              chat: []
            });
          }

          const roomData = this.premiereRooms.get(premiereId);
          roomData.viewers.add(socket.id);

          // Update premiere viewer count
          await Premiere.findByIdAndUpdate(premiereId, {
            $inc: { totalViewers: 1 }
          });

          // Send room data to the user
          socket.emit('premiere-joined', {
            premiere,
            viewerCount: roomData.viewers.size,
            currentTime: roomData.currentTime,
            isPlaying: roomData.isPlaying,
            chat: roomData.chat.slice(-50) // Last 50 messages
          });

          // Notify other viewers
          socket.to(`premiere-${premiereId}`).emit('viewer-joined', {
            viewerCount: roomData.viewers.size
          });

          console.log(`User ${socket.id} joined premiere ${premiereId}`);
        } catch (error) {
          console.error('Error joining premiere:', error);
          socket.emit('error', { message: 'Failed to join premiere' });
        }
      });

      // Leave premiere room
      socket.on('leave-premiere', async (premiereId) => {
        socket.leave(`premiere-${premiereId}`);
        
        if (this.premiereRooms.has(premiereId)) {
          const roomData = this.premiereRooms.get(premiereId);
          roomData.viewers.delete(socket.id);

          // Update premiere viewer count
          await Premiere.findByIdAndUpdate(premiereId, {
            $inc: { totalViewers: -1 }
          });

          // Notify other viewers
          socket.to(`premiere-${premiereId}`).emit('viewer-left', {
            viewerCount: roomData.viewers.size
          });

          // Clean up empty rooms
          if (roomData.viewers.size === 0) {
            this.premiereRooms.delete(premiereId);
          }
        }

        console.log(`User ${socket.id} left premiere ${premiereId}`);
      });

      // Admin controls
      socket.on('admin-start-premiere', async (premiereId) => {
        try {
          const premiere = await Premiere.findByIdAndUpdate(
            premiereId,
            { 
              status: 'live',
              startTime: new Date(),
              isActive: true
            },
            { new: true }
          ).populate('video');

          if (!premiere) {
            socket.emit('error', { message: 'Premiere not found' });
            return;
          }

          // Update room data
          if (this.premiereRooms.has(premiereId)) {
            const roomData = this.premiereRooms.get(premiereId);
            roomData.isLive = true;
            roomData.isPlaying = true;
            roomData.currentTime = 0;
          }

          // Notify all viewers
          this.io.to(`premiere-${premiereId}`).emit('premiere-started', {
            premiere,
            currentTime: 0,
            isPlaying: true
          });

          console.log(`Premiere ${premiereId} started by admin`);
        } catch (error) {
          console.error('Error starting premiere:', error);
          socket.emit('error', { message: 'Failed to start premiere' });
        }
      });

      socket.on('admin-end-premiere', async (premiereId) => {
        try {
          const premiere = await Premiere.findByIdAndUpdate(
            premiereId,
            { 
              status: 'ended',
              endTime: new Date(),
              isActive: false
            },
            { new: true }
          ).populate('video');

          if (!premiere) {
            socket.emit('error', { message: 'Premiere not found' });
            return;
          }

          // Update room data
          if (this.premiereRooms.has(premiereId)) {
            const roomData = this.premiereRooms.get(premiereId);
            roomData.isLive = false;
            roomData.isPlaying = false;
          }

          // Notify all viewers
          this.io.to(`premiere-${premiereId}`).emit('premiere-ended', {
            premiere
          });

          console.log(`Premiere ${premiereId} ended by admin`);
        } catch (error) {
          console.error('Error ending premiere:', error);
          socket.emit('error', { message: 'Failed to end premiere' });
        }
      });

      // Video playback controls
      socket.on('play-video', (premiereId) => {
        if (this.premiereRooms.has(premiereId)) {
          const roomData = this.premiereRooms.get(premiereId);
          roomData.isPlaying = true;
          
          socket.to(`premiere-${premiereId}`).emit('video-play');
        }
      });

      socket.on('pause-video', (premiereId) => {
        if (this.premiereRooms.has(premiereId)) {
          const roomData = this.premiereRooms.get(premiereId);
          roomData.isPlaying = false;
          
          socket.to(`premiere-${premiereId}`).emit('video-pause');
        }
      });

      socket.on('seek-video', (premiereId, time) => {
        if (this.premiereRooms.has(premiereId)) {
          const roomData = this.premiereRooms.get(premiereId);
          roomData.currentTime = time;
          
          socket.to(`premiere-${premiereId}`).emit('video-seek', { time });
        }
      });

      // Chat functionality
      socket.on('send-message', (premiereId, message) => {
        if (this.premiereRooms.has(premiereId)) {
          const roomData = this.premiereRooms.get(premiereId);
          const chatMessage = {
            id: Date.now(),
            user: socket.userName || 'Anonymous',
            message,
            timestamp: new Date()
          };
          
          roomData.chat.push(chatMessage);
          
          // Keep only last 100 messages
          if (roomData.chat.length > 100) {
            roomData.chat = roomData.chat.slice(-100);
          }
          
          this.io.to(`premiere-${premiereId}`).emit('new-message', chatMessage);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from all premiere rooms
        for (const [premiereId, roomData] of this.premiereRooms.entries()) {
          if (roomData.viewers.has(socket.id)) {
            roomData.viewers.delete(socket.id);
            
            // Update premiere viewer count
            Premiere.findByIdAndUpdate(premiereId, {
              $inc: { totalViewers: -1 }
            }).catch(console.error);
            
            // Notify other viewers
            socket.to(`premiere-${premiereId}`).emit('viewer-left', {
              viewerCount: roomData.viewers.size
            });
            
            // Clean up empty rooms
            if (roomData.viewers.size === 0) {
              this.premiereRooms.delete(premiereId);
            }
          }
        }
      });
    });
  }

  // Method to get room data
  getRoomData(premiereId) {
    return this.premiereRooms.get(premiereId);
  }

  // Method to broadcast to all users
  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }

  // Method to broadcast to specific premiere
  broadcastToPremiere(premiereId, event, data) {
    this.io.to(`premiere-${premiereId}`).emit(event, data);
  }
}

module.exports = SocketHandler;
