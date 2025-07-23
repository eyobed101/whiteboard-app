import { io, Socket } from 'socket.io-client';

let socket: Socket;

export const connectSocket = (roomId: string = 'default-room') => {
  if (!socket) {
    socket = io({
      path: '/api/socket',
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socket.emit('join', roomId);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null as any;
  }
};