// app/api/socket/route.ts
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import type { NextApiRequest } from 'next'
import type { NextApiResponse } from 'next'
import { NextApiResponseServerIO } from '../../types'

// This should be placed in pages/api/socket.ts for Next.js API routes
export default function handler(req: NextApiRequest, res: NextApiResponse & { socket: { server: NetServer & { io?: SocketIOServer } } }) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...')
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
    })

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId)
        console.log(`Socket ${socket.id} joined room ${roomId}`)
      })

      socket.on('draw', (data: { roomId: string; drawing: any }) => {
        socket.to(data.roomId).emit('draw', data.drawing)
      })

      socket.on('clear', (roomId: string) => {
        socket.to(roomId).emit('clear')
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })

    res.socket.server.io = io
  }
  res.end()
}