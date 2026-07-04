/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Eye, ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  height?: string;
  title?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ 
  beforeImage, 
  afterImage, 
  height = "h-[450px]", 
  title 
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // percentage (0-100)
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  return (
    <div className="flex flex-col space-y-2">
      {title && (
        <h4 className="text-sm font-semibold text-[#1e1e1a] tracking-wide mb-1 font-sans">{title}</h4>
      )}
      <div 
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className={`relative ${height} w-full overflow-hidden rounded-xl shadow-lg border border-[#d4af37]/15 select-none cursor-ew-resize bg-[#232321]`}
      >
        {/* AFTER IMAGE (Background) */}
        <img 
          src={afterImage} 
          alt="بعد التنفيذ" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 bg-[#1c1c1c]/80 backdrop-blur-sm px-3 py-1 rounded text-xs font-semibold text-[#d4af37] border border-[#d4af37]/30">
          بـعـد
        </div>

        {/* BEFORE IMAGE (Foreground, clipped) */}
        <div 
          className="absolute inset-y-0 right-0 overflow-hidden pointer-events-none"
          style={{ width: `${100 - sliderPosition}%` }}
        >
          <img 
            src={beforeImage} 
            alt="قبل التنفيذ" 
            className="absolute inset-y-0 right-0 h-full object-cover max-w-none"
            style={{ width: containerRef.current?.getBoundingClientRect().width || '100vw' }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1 rounded text-xs font-semibold text-gray-300 border border-gray-700">
            قـبـل
          </div>
        </div>

        {/* SLIDER SEPARATOR BAR */}
        <div 
          className="absolute inset-y-0 w-[3px] bg-gradient-to-b from-[#d4af37] via-[#f3e5ab] to-[#d4af37] cursor-ew-resize flex items-center justify-center pointer-events-none shadow-[0_0_10px_rgba(212,175,55,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
          {/* DRAGGING HANDLE */}
          <div className="absolute w-10 h-10 rounded-full bg-[#1e1e1a] border-2 border-[#d4af37] flex items-center justify-center text-[#d4af37] shadow-xl hover:scale-105 transition-transform pointer-events-auto">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
