// app/(main)/whiteboard/page.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useSocket } from '../../../components/providers/socket-provider'
import Toolbar from '../../../components/whiteboard/Toolbar'

export default function WhiteboardPage() {
  const { socket, isConnected } = useSocket()
  const [drawings, setDrawings] = useState<THREE.Vector3[][]>([])
  const [currentDrawing, setCurrentDrawing] = useState<THREE.Vector3[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const roomId = 'default-room' // Or get from URL params

  useEffect(() => {
    if (socket) {
      socket.emit('join-room', roomId)
      
      socket.on('draw', (newDrawing: THREE.Vector3[]) => {
        setDrawings(prev => [...prev, newDrawing])
      })

      socket.on('clear', () => {
        setDrawings([])
      })

      return () => {
        socket.off('draw')
        socket.off('clear')
      }
    }
  }, [socket, roomId])

  const handlePointerDown = (e: THREE.Event) => {
    if (!e.point) return
    setIsDrawing(true)
    setCurrentDrawing([new THREE.Vector3(e.point.x, e.point.y, 0)])
  }

  const handlePointerMove = (e: THREE.Event) => {
    if (!isDrawing || !e.point) return
    setCurrentDrawing(prev => [...prev, new THREE.Vector3(e.point.x, e.point.y, 0)])
  }

  const handlePointerUp = () => {
    if (isDrawing && currentDrawing.length > 1) {
      setDrawings(prev => [...prev, currentDrawing])
      if (socket) {
        socket.emit('draw', { roomId, drawing: currentDrawing })
      }
    }
    setIsDrawing(false)
    setCurrentDrawing([])
  }

  const clearCanvas = () => {
    setDrawings([])
    if (socket) {
      socket.emit('clear', { roomId })
    }
  }

  return (
    <div className="relative h-screen w-full">
      <Toolbar 
        clearCanvas={clearCanvas} 
        isConnected={isConnected}
      />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 25 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <ambientLight intensity={0.5} />
        <gridHelper args={[10, 10]} />
        
        {drawings.map((points, i) => (
          <Line key={i} points={points} color="black" lineWidth={2} />
        ))}
        
        {currentDrawing.length > 0 && (
          <Line points={currentDrawing} color="red" lineWidth={2} />
        )}
      </Canvas>
    </div>
  )
}