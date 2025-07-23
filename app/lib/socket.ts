// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const connectSocket = (roomId: string) => {
  if (!socket) {
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    socket = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket'], // Force WebSocket only
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      query: { roomId },
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socket.emit('join', roomId);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null as any;
  }
};