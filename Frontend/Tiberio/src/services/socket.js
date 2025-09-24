import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.joinedRooms = new Set();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      
      // Emit a test event to verify connection
      this.socket.emit('test-connection', {
        message: 'Frontend connected successfully',
        timestamp: new Date().toISOString()
      });
    });

    this.socket.on('disconnect', () => {
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

  async joinRoom(room) {
    try {
      const socket = await this.waitForConnection();
      socket.emit('join-room', room);
      this.joinedRooms.add(room);
    } catch (error) {
      console.error(`🔌 Failed to join room ${room}:`, error);
    }
  }

  leaveRoom(room) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-room', room);
      this.joinedRooms.delete(room);
    }
  }

  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    
    if (this.socket) {
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

  // Leave all patient-specific rooms
  leaveAllPatientRooms() {
    const patientRooms = Array.from(this.joinedRooms).filter(room => room.startsWith('patient-'));
    patientRooms.forEach(room => {
      this.leaveRoom(room);
    });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasSocket: !!this.socket,
      joinedRooms: Array.from(this.joinedRooms)
    };
  }
}

// Create a singleton instance
const socketService = new SocketService();

// Initialize connection when service is imported
socketService.connect();

export default socketService;
