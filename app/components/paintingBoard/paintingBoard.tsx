import React, { useState } from 'react';
import Canvas from '../canvas/canvas';
import styles from './paintingBoard.module.css';

interface PaintingBoardProps {
  roomId?: string;
  onColorChange?: (color: string) => void;
  onClear?: () => void;
  className?: string;
}

const PaintingBoard: React.FC<PaintingBoardProps> = ({ 
  roomId = 'default-room',
  onColorChange,
  onClear,
  className = ''
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const elem = document.querySelector(`.${styles.boardContainer}`);
      if (elem?.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleColorChange = (color: string) => {
    if (onColorChange) {
      onColorChange(color);
    }
  };

  return (
    <div className={`${styles.wrapper} ${className}`} data-fullscreen={isFullscreen}>
      <div className={styles.backgroundPattern}></div>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Collaborative Art Board</h1>
        <div className={styles.controls}>
          <button 
            className={styles.infoButton}
            onClick={() => setShowRoomInfo(!showRoomInfo)}
            aria-label="Show room information"
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </button>
          <button 
            className={styles.fullscreenButton}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              {isFullscreen ? (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              )}
            </svg>
          </button>
        </div>
      </div>

      {showRoomInfo && (
        <div className={styles.roomInfoPanel}>
          <h3>Room Information</h3>
          <p>Share this room ID with collaborators:</p>
          <div className={styles.roomId}>{roomId}</div>
          <button 
            className={styles.copyButton}
            onClick={() => navigator.clipboard.writeText(roomId)}
          >
            Copy Room ID
          </button>
        </div>
      )}

      <div className={styles.boardContainer} data-fullscreen={isFullscreen}>
        <Canvas 
          roomId={roomId}
          onColorChange={handleColorChange}
          onClear={onClear}
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.connectionHint}>
          <span>Tip: Share the room ID to collaborate in real-time</span>
        </div>
        <div className={styles.watermark}>
          Collaborative Art Board © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default PaintingBoard;