// components/whiteboard/Toolbar.tsx
'use client'

export default function Toolbar({ 
  clearCanvas, 
  isConnected 
}: { 
  clearCanvas: () => void
  isConnected: boolean
}) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center gap-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <button 
          onClick={clearCanvas}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
        >
          Clear Canvas
        </button>
      </div>
    </div>
  )
}