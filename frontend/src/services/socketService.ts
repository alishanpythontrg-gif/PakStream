import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    if (!this.socket) {
      this.connect();
    }
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Generic event listeners
  on(event: string, callback: (...args: any[]) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.off(event, callback);
    }
  }

  // Premiere-related methods
  joinPremiere(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('join-premiere', premiereId);
    }
  }

  leavePremiere(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('leave-premiere', premiereId);
    }
  }

  // Admin controls
  startPremiere(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('admin-start-premiere', premiereId);
    }
  }

  endPremiere(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('admin-end-premiere', premiereId);
    }
  }

  // Video controls
  playVideo(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('play-video', premiereId);
    }
  }

  pauseVideo(premiereId: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('pause-video', premiereId);
    }
  }

  seekVideo(premiereId: string, time: number) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('seek-video', premiereId, time);
    }
  }

  // Chat methods
  sendMessage(premiereId: string, message: string) {
    const socket = this.getSocket();
    if (socket) {
      socket.emit('send-message', premiereId, message);
    }
  }

  // Event listeners
  onPremiereJoined(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('premiere-joined', callback);
    }
  }

  onViewerJoined(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('viewer-joined', callback);
    }
  }

  onViewerLeft(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('viewer-left', callback);
    }
  }

  onPremiereStarted(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('premiere-started', callback);
    }
  }

  onPremiereEnded(callback: (data: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('premiere-ended', callback);
    }
  }

  onVideoPlay(callback: () => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('video-play', callback);
    }
  }

  onVideoPause(callback: () => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('video-pause', callback);
    }
  }

  onVideoSeek(callback: (data: { time: number }) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('video-seek', callback);
    }
  }

  onNewMessage(callback: (message: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('new-message', callback);
    }
  }

  onError(callback: (error: any) => void) {
    const socket = this.getSocket();
    if (socket) {
      socket.on('error', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove specific listener
  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Utility methods
  getTimeUntilEnd(endTime: string): number {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return Math.max(0, end - now);
  }

  getTimeUntilStart(startTime: string): number {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    return Math.max(0, start - now);
  }
}

export default new SocketService();
