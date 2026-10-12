import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  isDeleting?: boolean;
  className?: string;
}

export const SwipeableRow: React.FC<Props> = ({ children, onDelete, isDeleting, className = '' }) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const currentXRef = useRef<number>(0);
  const ACTION_WIDTH = 80;
  const THRESHOLD = -40;

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    if (diff < 0) {
      const val = diff < -ACTION_WIDTH * 1.5 ? -ACTION_WIDTH * 1.5 + (diff + ACTION_WIDTH * 1.5) * 0.2 : diff;
      setTranslateX(val);
      currentXRef.current = val;
    } else {
      setTranslateX(0);
      currentXRef.current = 0;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    startXRef.current = null;
    if (currentXRef.current < THRESHOLD) {
      setTranslateX(-ACTION_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  // Mouse handlers for desktop testing
  const handleMouseDown = (e: React.MouseEvent) => {
    startXRef.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || startXRef.current === null) return;
    const currentX = e.clientX;
    const diff = currentX - startXRef.current;
    
    if (diff < 0) {
      const val = diff < -ACTION_WIDTH * 1.5 ? -ACTION_WIDTH * 1.5 + (diff + ACTION_WIDTH * 1.5) * 0.2 : diff;
      setTranslateX(val);
      currentXRef.current = val;
    } else {
      setTranslateX(0);
      currentXRef.current = 0;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startXRef.current = null;
    if (currentXRef.current < THRESHOLD) {
      setTranslateX(-ACTION_WIDTH);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  return (
    <div className={`relative overflow-hidden w-full group ${className}`}>
      {/* Background action (Delete) */}
      <div className="absolute top-0 bottom-0 right-0 w-[80px] bg-red-500 flex items-center justify-center z-0">
        <button 
          onClick={() => {
            setTranslateX(0);
            onDelete();
          }}
          disabled={isDeleting}
          className="w-full h-full flex flex-col items-center justify-center text-white active:bg-red-600 disabled:opacity-50 transition-colors"
        >
          <Trash2 size={20} />
          <span className="text-[10px] font-bold mt-1">Eliminar</span>
        </button>
      </div>

      {/* Foreground content */}
      <div
        className="relative bg-[var(--bg-card)] w-full h-full z-10 flex cursor-grab active:cursor-grabbing"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
    </div>
  );
};
