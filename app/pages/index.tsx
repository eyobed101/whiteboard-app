import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import WhiteboardCanvas from '../components/Whiteboard/Canva'
import { connectSocket, disconnectSocket } from '../lib/socket'

export default function Home() {
  const [roomId, setRoomId] = useState('default-room')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Connect to socket when component mounts
    const socket = connectSocket(roomId)
    setIsConnected(true)

    return () => {
      disconnectSocket()
      setIsConnected(false)
    }
  }, [roomId])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen"
    >
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Collaborative Whiteboard</h1>
        <div className="flex items-center space-x-4 mt-2">
          <span className={`inline-block w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Room: {roomId}</span>
        </div>
      </header>

      <main className="flex-1 relative">
        <WhiteboardCanvas />
      </main>
    </motion.div>
  )
}