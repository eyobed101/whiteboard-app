"use client";

import { useState, useRef } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

type LinePoints = THREE.Vector3[]

export default function WhiteboardCanvas() {
  const [lines, setLines] = useState<LinePoints[]>([])
  const [currentLine, setCurrentLine] = useState<LinePoints>([])
  const [isDrawing, setIsDrawing] = useState(false)

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    setIsDrawing(true)
    setCurrentLine([e.point.clone()])
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDrawing) return
    setCurrentLine(prev => [...prev, e.point.clone()])
  }

  const handlePointerUp = () => {
    if (isDrawing && currentLine.length > 1) {
      setLines(prev => [...prev, currentLine])
    }
    setIsDrawing(false)
    setCurrentLine([])
  }

  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 25 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <gridHelper args={[10, 10]} />

      {/* Catch pointer events here */}
      <group
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Render existing lines */}
        {lines.map((line, i) => (
          <Line key={`line-${i}`} points={line} />
        ))}

        {/* Render current line */}
        {currentLine.length > 0 && (
          <Line points={currentLine} color="hotpink" />
        )}
      </group>
    </Canvas>
  )
}

function Line({ points, color = 'black' }: { points: LinePoints; color?: string }) {
  const lineRef = useRef<THREE.Line>(null)

  useFrame(() => {
    if (lineRef.current) {
      lineRef.current.geometry.setFromPoints(points)
    }
  })

  return (
    <line ref={lineRef as any}>
      <bufferGeometry />
      <lineBasicMaterial color={color} linewidth={2} />
    </line>
  )
}
