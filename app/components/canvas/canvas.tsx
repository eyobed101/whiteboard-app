'use client'
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import styles from './canvas.module.css';

interface Point {
  x: number;
  y: number;
}

interface DrawingData {
  prev: Point;
  curr: Point;
  color: string;
  lineWidth: number;
  tool: 'pen' | 'eraser' | 'highlighter';
}

interface SocketData {
  image?: string;
  drawing?: DrawingData;
  clear?: boolean;
  participants?: number;
}

interface CanvasProps {
  roomId: string;
  onColorChange?: (color: string) => void;
  onParticipantsChange?: (count: number) => void;

  className?: string;
}

const Canvas: React.FC<CanvasProps> = ({
  roomId,
  onColorChange,
  onParticipantsChange,

  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lineWidth, setLineWidth] = useState(5);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | 'highlighter'>('pen');
  const [isConnected, setIsConnected] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const socketRef = useRef<Socket | null>(null);
  const isDrawingRef = useRef(false);
  const prevPointRef = useRef<Point>({ x: 0, y: 0 });
  const undoStackRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);
  const [color, setColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('canvas-color') || '#4a6bff';
    }
    return '#4a6bff';
  });

  // Initialize socket connection
  useEffect(() => {
    if (!roomId) return;

    // Initialize socket connection
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "localhost:3001",
      {
        path: "/api/socket",
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: { roomId }
      }
    );

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    // Participant count updates
    socket.on("participants-update", (count: number) => {
      console.log("Participants count updated:", count);
      setParticipants(count);
      if (onParticipantsChange) {
        onParticipantsChange(count);
      }
    });


    socket.on("canvas-state", (state: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (state) {
        const img = new Image();
        img.onload = () => {
          // Clear and redraw only if we have a valid image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Save this as our initial undo state
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          undoStackRef.current = [imageData];
        };
        img.src = state;
      } else {
        // If no state, clear the canvas but keep the undo stack
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    // Real-time drawing updates
    socket.on("drawing-data", (data) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      drawOnCanvas(ctx, data);
    });

    // Clear canvas event
    socket.on("clear-canvas", () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, onParticipantsChange]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Request the current canvas state from server when mounting
    if (socketRef.current?.connected) {
      socketRef.current.emit('request-canvas-state');
    }

    // Load any locally saved state (optional)
    const localState = localStorage.getItem('canvas-state');
    if (localState) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = localState;
    }
  }, [roomId]);

  // Helper function to draw on canvas
  const drawOnCanvas = (ctx: CanvasRenderingContext2D, data: any) => {
    const { prev, curr, color, lineWidth, tool } = data;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else if (tool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,1)' : color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.closePath();

    // Reset to default
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  // When your local canvas changes, emit to others
  const handleCanvasUpdate = (imageData: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("canvas-state", imageData);
    }
  };

  // When drawing locally, emit to others
  const handleDrawing = (drawingData: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("drawing-data", drawingData);
    }
  };

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [color, lineWidth]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(imageData);
    // Limit undo stack to prevent memory issues
    if (undoStackRef.current.length > 20) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
  };

  const undo = () => {
    if (undoStackRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state to redo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStackRef.current.push(currentState);

    // Restore previous state
    const lastState = undoStackRef.current.pop();
    if (!lastState) return;

    ctx.putImageData(lastState, 0, 0);

    // Broadcast to other users
    if (socketRef.current) {
      const dataUrl = canvas.toDataURL('image/png');
      socketRef.current.emit('data', { image: dataUrl });
    }
  };

  const redo = () => {
    if (redoStackRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save current state to undo stack
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStackRef.current.push(currentState);

    // Restore next state
    const nextState = redoStackRef.current.pop();
    if (!nextState) return;

    ctx.putImageData(nextState, 0, 0);

    // Broadcast to other users
    if (socketRef.current) {
      const dataUrl = canvas.toDataURL('image/png');
      socketRef.current.emit('data', { image: dataUrl });
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (typeof window !== 'undefined') {
      localStorage.setItem('canvas-color', newColor);
    }
    if (onColorChange) onColorChange(newColor);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCoordinates(e);
    if (!point) return;

    isDrawingRef.current = true;
    prevPointRef.current = point;
    saveCanvasState();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const point = getCoordinates(e);
    if (!point) return;

    // Set drawing style based on tool
    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Draw locally
    ctx.beginPath();
    ctx.moveTo(prevPointRef.current.x, prevPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = activeTool === 'eraser' ? 'rgba(0,0,0,1)' : color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.closePath();

    // Use handleDrawing instead of direct emit
    const drawingData: DrawingData = {
      prev: prevPointRef.current,
      curr: point,
      color,
      lineWidth,
      tool: activeTool
    };
    handleDrawing(drawingData);

    prevPointRef.current = point;

    // Reset to default
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  const endDrawing = () => {
    isDrawingRef.current = false;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCanvasState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (socketRef.current) {
      socketRef.current.emit('data', { clear: true });
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !socketRef.current) return;

    const dataUrl = canvas.toDataURL('image/png');
    socketRef.current.emit('data', { image: dataUrl });

    // Create download link
    const link = document.createElement('a');
    link.download = `drawing-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();
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
    <div className={`${styles.container}`}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <div className={styles.toolSection}>
            <h3 className={styles.toolSectionTitle}>Tools</h3>
            <div className={styles.toolButtons}>
              <button
                onClick={() => setActiveTool('pen')}
                className={`${styles.toolButton} ${activeTool === 'pen' ? styles.activeTool : ''}`}
                aria-label="Pen tool"
                onMouseEnter={() => setShowTooltip('Pen')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTool('eraser')}
                className={`${styles.toolButton} ${activeTool === 'eraser' ? styles.activeTool : ''}`}
                aria-label="Eraser tool"
                onMouseEnter={() => setShowTooltip('Eraser')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 0 1-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0M4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-4.95-4.95-4.95 4.95z" />
                </svg>
              </button>
              <button
                onClick={() => setActiveTool('highlighter')}
                className={`${styles.toolButton} ${activeTool === 'highlighter' ? styles.activeTool : ''}`}
                aria-label="Highlighter tool"
                onMouseEnter={() => setShowTooltip('Highlighter')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M15 14h1.5v1.5H15z" opacity=".3" />
                  <path d="M3 3v18h18V3H3zm9 7h-1.5V7.5H9V10H7.5v1.5H9V15h1.5v-3.5H12V15h1.5v-3.5h3V10h-3V7.5H12V10zm3 6.5h-1.5V14H15v3.5z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.toolSection}>
            <h3 className={styles.toolSectionTitle}>Color</h3>
            <div className={styles.colorControls}>
           
              <input
                type="color"
                value={color}
                onChange={(e) => handleColorChange(e.target.value)}
                className={styles.colorPicker}
                aria-label="Select drawing color"
              />
              <div
                className={styles.colorPreview}
                style={{ backgroundColor: color }}
                onMouseEnter={() => setShowTooltip(`Color: ${color}`)}
                onMouseLeave={() => setShowTooltip(null)}
              />
            </div>
          </div>

          <div className={styles.toolSection}>
            <h3 className={styles.toolSectionTitle}>Size</h3>
            <div className={styles.sizeControls}>
              <button
                onClick={() => setLineWidth(prev => Math.max(1, prev - 1))}
                className={styles.sizeButton}
                aria-label="Decrease brush size"
                onMouseEnter={() => setShowTooltip('Decrease brush size')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 13H5v-2h14v2z" />
                </svg>
              </button>
              <div
                className={styles.sizeIndicator}
                onMouseEnter={() => setShowTooltip(`Brush size: ${lineWidth}px`)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <div
                  className={styles.sizeIndicatorDot}
                  style={{
                    width: `${lineWidth}px`,
                    height: `${lineWidth}px`,
                    backgroundColor: color
                  }}
                />
              </div>
              <button
                onClick={() => setLineWidth(prev => Math.min(30, prev + 1))}
                className={styles.sizeButton}
                aria-label="Increase brush size"
                onMouseEnter={() => setShowTooltip('Increase brush size')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.toolGroup}>
          <div className={styles.toolSection}>
            <h3 className={styles.toolSectionTitle}>Actions</h3>
            <div className={styles.actionButtons}>
              <button
                onClick={undo}
                className={styles.actionButton}
                disabled={undoStackRef.current.length === 0}
                aria-label="Undo"
                onMouseEnter={() => setShowTooltip('Undo last action')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
                </svg>
              </button>
              <button
                onClick={redo}
                className={styles.actionButton}
                disabled={redoStackRef.current.length === 0}
                aria-label="Redo"
                onMouseEnter={() => setShowTooltip('Redo last action')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
                </svg>
              </button>
              <button
                onClick={handleClear}
                className={styles.actionButton}
                aria-label="Clear canvas"
                onMouseEnter={() => setShowTooltip('Clear canvas')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12z" />
                </svg>
              </button>
              <button
                onClick={handleSave}
                className={styles.actionButton}
                aria-label="Save canvas"
                onMouseEnter={() => setShowTooltip('Save drawing')}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path d="M15 9H5V5h10m-3 14a3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3m5-16H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4z" />
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.connectionStatus}>
            <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`} />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div className={styles.tooltip}>
          {showTooltip}
        </div>
      )}

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
    </div>
  );
};

export default Canvas;