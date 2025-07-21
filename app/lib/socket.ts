import io, {Socket} from 'socket.io-client'

let socket: typeof Socket

export const connectSocket = (roomId: string) => {
  socket = io(process.env.NEXT_PUBLIC_SOCKET_SERVER!, {
    path: '/api/socket',
  })

  socket.emit('join-room', roomId)
  
  return socket
}

export const getSocket = () => {
  if (!socket) throw new Error('Socket not initialized')
  return socket
}

export const disconnectSocket = () => {
  if (socket) socket.disconnect()
}