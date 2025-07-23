import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { Server as HTTPSServer } from 'https';

type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: HTTPServer & {
      io?: SocketIOServer;
    };
  };
};

const socketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server');
    
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Store canvas states per room
    const roomStates: Record<string, string> = {};

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);
      let currentRoom = 'default-room';

      // Join a room
      socket.on('join', (room: string) => {
        socket.leave(currentRoom);
        currentRoom = room;
        socket.join(room);
        
        // Send current state to new user
        if (roomStates[room]) {
          socket.emit('image-data', roomStates[room]);
        }
      });

      // Handle image data
      socket.on('image-data', (data: string) => {
        // Store the latest image for the room
        roomStates[currentRoom] = data;
        
        // Broadcast to all clients in the same room except sender
        socket.to(currentRoom).emit('image-data', data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO already initialized');
  }
  
  res.end();
};

export default socketHandler;