import { Server } from "socket.io";
import { createServer } from "http";

let io: Server;

export function initSocketServer() {
  if (!io) {
    const httpServer = createServer();
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      path: "/api/socket",
      transports: ["websocket"] // Force WebSocket-only connection
    });

    // Track rooms and participants
    const rooms = new Map<string, {
      participants: Set<string>;
      canvasState: string | null;
    }>();

    io.on("connection", (socket) => {
      const roomId = socket.handshake.query.roomId as string;

      if (!roomId) {
        socket.disconnect();
        return;
      }

      // Initialize room if it doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          participants: new Set(),
          canvasState: null
        });
      }

      const room = rooms.get(roomId)!;
      room.participants.add(socket.id);
      socket.join(roomId);

      // Notify all clients in the room (including the new one)
      io.to(roomId).emit("participants-update", room.participants.size);
      console.log(`Room ${roomId} now has ${room.participants.size} participants`);

      // Send current canvas state to new participant
      if (room.canvasState) {
        socket.emit("canvas-state", room.canvasState);
      }

      // Event handlers
      socket.on("drawing-data", (data) => {
        socket.to(roomId).emit("drawing-data", data);
      });

      socket.on('request-canvas-state', () => {
        if (room.canvasState) {
          socket.emit('canvas-state', room.canvasState);
        }
      });

      socket.on("canvas-state", (state: string) => {
        room.canvasState = state;
        socket.to(roomId).emit("canvas-state", state);
      });

      socket.on("clear-canvas", () => {
        room.canvasState = null;
        io.to(roomId).emit("clear-canvas");
      });

      socket.on("disconnect", () => {
        if (rooms.has(roomId)) {
          const room = rooms.get(roomId)!;
          room.participants.delete(socket.id);
          io.to(roomId).emit("participants-update", room.participants.size);

          if (room.participants.size === 0) {
            rooms.delete(roomId);
          }
        }
      });
    });

    if (process.env.NODE_ENV === "development") {
      const PORT = 3001;
      httpServer.listen(PORT, () => {
        console.log(`Socket.IO server running on port ${PORT}`);
      });
    }
  }

  return io;
}

export const socketServer = initSocketServer();