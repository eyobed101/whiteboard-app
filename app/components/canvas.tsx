import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import styles from './Canvas.module.css';

// Type definitions
interface Point {
  x: number;
  y: number;
}

interface DrawingData {
  prev: Point;
  curr: Point;
  color: string;
  lineWidth: number;
}

interface SocketData {
  image?: string;
  drawing?: DrawingData;
  clear?: boolean;
}

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#00FF00');
  const [lineWidth, setLineWidth] = useState(5);
  const socketRef = useRef<Socket | null>(null);
  const isDrawingRef = useRef(false);
  const prevPointRef = useRef<Point>({ x: 0, y: 0 });
  
  // Initialize socket connection
  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:5000' 
      : '/';
    
    socketRef.current = io(socketUrl);
    
    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    socketRef.current.on('data', (data: SocketData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (data.image) {
        // Handle full image updates
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = data.image;
      } 
      else if (data.drawing) {
        // Handle incremental drawing
        const { prev, curr, color, lineWidth } = data.drawing;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.closePath();
      }
      else if (data.clear) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60; // Account for toolbar
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initial drawing settings
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color, lineWidth]);
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCoordinates(e);
    if (!point) return;
    
    isDrawingRef.current = true;
    prevPointRef.current = point;
  };
  
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const point = getCoordinates(e);
    if (!point) return;
    
    // Draw locally
    ctx.beginPath();
    ctx.moveTo(prevPointRef.current.x, prevPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();
    
    // Send drawing data to server
    if (socketRef.current) {
      const drawingData: DrawingData = {
        prev: prevPointRef.current,
        curr: point,
        color,
        lineWidth
      };
      
      socketRef.current.emit('data', { drawing: drawingData });
    }
    
    // Update previous point
    prevPointRef.current = point;
  };
  
  const endDrawing = () => {
    isDrawingRef.current = false;
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (socketRef.current) {
      socketRef.current.emit('data', { clear: true });
    }
  };
  
  const saveCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !socketRef.current) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    socketRef.current.emit('data', { image: dataUrl });
  };
  
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={styles.colorPicker}
            aria-label="Select drawing color"
          />
          <div className={styles.colorPreview} style={{ backgroundColor: color }} />
        </div>
        
        <div className={styles.toolGroup}>
          <button 
            onClick={() => setLineWidth(prev => Math.max(1, prev - 1))} 
            className={styles.toolButton}
            aria-label="Decrease brush size"
          >
            -
          </button>
          <div className={styles.sizeIndicator}>{lineWidth}px</div>
          <button 
            onClick={() => setLineWidth(prev => Math.min(30, prev + 1))} 
            className={styles.toolButton}
            aria-label="Increase brush size"
          >
            +
          </button>
        </div>
        
        <div className={styles.toolGroup}>
          <button 
            onClick={clearCanvas} 
            className={styles.actionButton}
            aria-label="Clear canvas"
          >
            Clear
          </button>
          <button 
            onClick={saveCanvas} 
            className={styles.actionButton}
            aria-label="Save canvas"
          >
            Save
          </button>
        </div>
      </div>
      
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      
      <div className={styles.instructions}>
        <p>Draw with your mouse or touch. Changes appear in real-time for all users.</p>
      </div>
    </div>
  );
};

export default Canvas;