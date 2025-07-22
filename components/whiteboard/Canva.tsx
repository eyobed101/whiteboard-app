'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useSocket } from '../providers/socket-provider'

type Tool = 'text' | 'pen' | 'highlight' | 'shape' | 'eraser'
type TextElement = {
  id: string
  content: string
  position: [number, number, number]
  color: string
  size: number
}
type DrawingElement = {
  id: string
  type: 'pen' | 'highlight' | 'shape'
  points: THREE.Vector3[]
  color: string
  thickness: number
}

export default function DocumentEditor({ roomId }: { roomId: string }) {
  const { socket } = useSocket()
  const [textElements, setTextElements] = useState<TextElement[]>([])
  const [drawings, setDrawings] = useState<DrawingElement[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null)
  const [activeTool, setActiveTool] = useState<Tool>('text')
  const [color, setColor] = useState('#000000')
  const [fontSize, setFontSize] = useState(0.5)
  const [lineWidth, setLineWidth] = useState(0.1)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  // Handle document editing
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (activeTool !== 'text' || !canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 10 - 5
    const y = -(e.clientY - rect.top) / rect.height * 10 + 5
    
    const newText: TextElement = {
      id: Math.random().toString(36).substring(7),
      content: currentText || 'Type here',
      position: [x, y, 0],
      color,
      size: fontSize
    }
    
    setTextElements(prev => [...prev, newText])
    if (socket) socket.emit('add-text', { roomId, text: newText })
    setCurrentText('')
  }

  // Handle drawing tools
  const handlePointerDown = (e: THREE.Event) => {
    if (activeTool === 'text') return
    
    setIsDrawing(true)
    setCurrentDrawing({
      id: Math.random().toString(36).substring(7),
      type: activeTool === 'pen' ? 'pen' : 
            activeTool === 'highlight' ? 'highlight' : 'shape',
      points: [new THREE.Vector3(e.point.x, e.point.y, 0)],
      color,
      thickness: lineWidth
    })
  }

  const handlePointerMove = (e: THREE.Event) => {
    if (!isDrawing || !currentDrawing) return
    
    setCurrentDrawing(prev => ({
      ...prev!,
      points: [...prev!.points, new THREE.Vector3(e.point.x, e.point.y, 0)]
    }))
  }

  const handlePointerUp = () => {
    if (isDrawing && currentDrawing) {
      setDrawings(prev => [...prev, currentDrawing])
      if (socket) socket.emit('add-drawing', { roomId, drawing: currentDrawing })
    }
    setIsDrawing(false)
    setCurrentDrawing(null)
  }

  // Socket handlers
  useEffect(() => {
    if (!socket) return

    socket.on('add-text', (newText: TextElement) => {
      setTextElements(prev => [...prev, newText])
    })

    socket.on('add-drawing', (newDrawing: DrawingElement) => {
      setDrawings(prev => [...prev, newDrawing])
    })

    return () => {
      socket.off('add-text')
      socket.off('add-drawing')
    }
  }, [socket])

  return (
    <div ref={canvasRef} className="relative h-full w-full bg-white">
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 bg-gray-100 p-2 flex gap-4 z-10">
        <select 
          value={activeTool}
          onChange={(e) => setActiveTool(e.target.value as Tool)}
          className="p-2 border rounded"
        >
          <option value="text">Text</option>
          <option value="pen">Pen</option>
          <option value="highlight">Highlighter</option>
          <option value="shape">Shape</option>
          <option value="eraser">Eraser</option>
        </select>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-10 h-10"
        />

        {activeTool === 'text' ? (
          <>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="w-32"
            />
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              placeholder="Type text..."
              className="p-2 border rounded flex-1"
            />
          </>
        ) : (
          <input
            type="range"
            min="0.05"
            max="0.5"
            step="0.05"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseFloat(e.target.value))}
            className="w-32"
          />
        )}
      </div>

      {/* Document Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 25 }}
        onClick={handleCanvasClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="bg-white"
      >
        <ambientLight intensity={0.5} />
        
        {/* Render text elements */}
        {textElements.map((text) => (
          <TextElement key={text.id} text={text} />
        ))}
        
        {/* Render drawings */}
        {drawings.map((drawing) => (
          <DrawingElement key={drawing.id} drawing={drawing} />
        ))}
        
        {/* Current drawing in progress */}
        {currentDrawing && (
          <DrawingElement drawing={currentDrawing} />
        )}
      </Canvas>
    </div>
  )
}

function TextElement({ text }: { text: TextElement }) {
  return (
    <Text
      position={text.position}
      color={text.color}
      fontSize={text.size}
      anchorX="center"
      anchorY="middle"
    >
      {text.content}
    </Text>
  )
}

function DrawingElement({ drawing }: { drawing: DrawingElement }) {
  const points = drawing.points.map(p => [p.x, p.y, p.z]).flat()
  
  return (
    <line>
      <bufferGeometry attach="geometry" attributes={{
        position: new THREE.BufferAttribute(new Float32Array(points), 3)
      }} />
      <lineBasicMaterial 
        attach="material" 
        color={drawing.color} 
        linewidth={drawing.thickness}
        transparent={drawing.type === 'highlight'}
        opacity={drawing.type === 'highlight' ? 0.5 : 1}
      />
    </line>
  )
}