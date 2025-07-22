import { Server as NetServer } from 'http'
import { NextApiRequest } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { NextApiResponseServerIO } from '../../types'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('New Socket.io server...')
    const httpServer: NetServer = res.socket.server as any
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
    })

    io.on('connection', (socket) => {
      console.log('Client connected')

      socket.on('join-room', (roomId: string) => {
        socket.join(roomId)
        console.log(`User joined room ${roomId}`)
      })

      socket.on('draw', (data: { roomId: string; points: any[] }) => {
        socket.to(data.roomId).emit('draw', data.points)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected')
      })
    })

    res.socket.server.io = io
  }
  res.end()
}