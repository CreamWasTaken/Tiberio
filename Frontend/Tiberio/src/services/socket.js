import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    console.log('🔌 Initializing Socket.IO connection...');
    this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server');
      this.isConnected = true;
      
      // Emit a test event to verify connection
      this.socket.emit('test-connection', {
        message: 'Frontend connected successfully',
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error);
      this.isConnected = false;
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

  joinRoom(room) {
    if (!this.socket) {
      console.log(`🔌 No socket available, connecting...`);
      this.connect();
    }
    
    if (this.socket && this.isConnected) {
      console.log(`🔌 Joining Socket.IO room: ${room}`);
      this.socket.emit('join-room', room);
      console.log(`🔌 Room join request sent for: ${room}`);
    } else {
      console.log(`❌ Cannot join room ${room}: socket not connected`);
      console.log(`🔌 Socket status:`, this.getConnectionStatus());
      // Try to wait for connection and then join
      this.waitForConnection().then(() => {
        console.log(`🔌 Connection established, now joining room: ${room}`);
        this.socket.emit('join-room', room);
        console.log(`🔌 Room join request sent for: ${room} (delayed)`);
      }).catch(error => {
        console.error(`🔌 Failed to establish connection for room ${room}:`, error);
      });
    }
  }

  leaveRoom(room) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', room);
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket) {
      console.log(`🔌 Registering listener for event: ${event}`);
      this.socket.on(event, callback);
    } else {
      console.log(`❌ Cannot register listener for ${event}: socket not available`);
    }
  }

  off(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Wait for connection to be established
  waitForConnection() {
    return new Promise((resolve, reject) => {
      // Ensure socket is connected first
      if (!this.socket) {
        this.connect();
      }
      
      if (this.isConnected) {
        resolve(this.socket);
      } else {
        // If not connected, wait for connection
        const onConnect = () => {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
          resolve(this.socket);
        };
        
        const onError = (error) => {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
          reject(error);
        };
        
        this.socket.on('connect', onConnect);
        this.socket.on('connect_error', onError);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          this.socket.off('connect', onConnect);
          this.socket.off('connect_error', onError);
          reject(new Error('Connection timeout'));
        }, 10000);
      }
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasSocket: !!this.socket
    };
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Initialize connection when service is imported
socketService.connect();

export default socketService;
