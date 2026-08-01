// components/Radio/KnobElegante.tsx - VERSÃO MENOR
'use client';

import React, { useRef, useState, useEffect } from 'react';

interface KnobEleganteProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  disabled?: boolean;
}

const KnobElegante: React.FC<KnobEleganteProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
  unit = '',
  disabled = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const percentage = ((value - min) / (max - min)) * 100;
  const angle = -135 + (percentage / 100) * 270;

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const handleMouseMove = (moveEvent: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = moveEvent.clientX - centerX;
    const dy = moveEvent.clientY - centerY;
    let newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    newAngle = Math.max(-135, Math.min(135, newAngle));
    const newValue = ((newAngle + 135) / 270) * (max - min) + min;
    onChange(Math.round(Math.max(min, Math.min(max, newValue))));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchMove = (moveEvent: TouchEvent) => {
    if (!isDraggingRef.current) return;
    moveEvent.preventDefault();
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return;
    const touch = moveEvent.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    let newAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    newAngle = Math.max(-135, Math.min(135, newAngle));
    const newValue = ((newAngle + 135) / 270) * (max - min) + min;
    onChange(Math.round(Math.max(min, Math.min(max, newValue))));
  };

  const handleTouchEnd = (e: TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = false;
    setIsDragging(false);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
    document.removeEventListener('touchcancel', handleTouchEnd);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (disabled) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        flex: 1,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          width: '70px',
          height: '70px',
          userSelect: 'none',
          touchAction: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
        }}
      >
        <svg width="70" height="70" viewBox="0 0 70 70">
          <defs>
            <radialGradient id="knobGradSmall" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#6a6a6a" />
              <stop offset="35%" stopColor="#4a4a4a" />
              <stop offset="70%" stopColor="#2a2a2a" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            <radialGradient id="knobHighlightSmall" cx="35%" cy="28%" r="45%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id="knobShadowSmall" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.7"/>
            </filter>
            <filter id="innerGlowSmall">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#FFD700" floodOpacity="0.4"/>
            </filter>
          </defs>

          <circle cx="35" cy="35" r="32" fill="none" stroke="#333333" strokeWidth="5" />
          <circle cx="35" cy="35" r="32" fill="none" stroke="#444444" strokeWidth="3" />

          <circle
            cx="35"
            cy="35"
            r="24"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="5"
            strokeDasharray="113.1"
            strokeDashoffset="0"
            strokeLinecap="round"
            transform="rotate(-135 35 35)"
          />

          <circle
            cx="35"
            cy="35"
            r="24"
            fill="none"
            stroke="#FFD700"
            strokeWidth="5"
            strokeDasharray="113.1"
            strokeDashoffset={113.1 * (1 - percentage / 100)}
            strokeLinecap="round"
            transform="rotate(-135 35 35)"
            style={{
              transition: 'stroke-dashoffset 0.15s ease',
              filter: 'url(#innerGlowSmall)',
            }}
          />

          {[...Array(9)].map((_, i) => {
            const a = (i / 8) * 270 - 135;
            const rad = (a * Math.PI) / 180;
            const isMain = i % 2 === 0;
            const r1 = 28;
            const r2 = isMain ? 31 : 30;
            return (
              <line
                key={i}
                x1={35 + r1 * Math.cos(rad)}
                y1={35 + r1 * Math.sin(rad)}
                x2={35 + r2 * Math.cos(rad)}
                y2={35 + r2 * Math.sin(rad)}
                stroke={isMain ? '#FFD700' : '#555555'}
                strokeWidth={isMain ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}

          <circle cx="35" cy="35" r="21" fill="url(#knobGradSmall)" stroke="#2a2a2a" strokeWidth="1" filter="url(#knobShadowSmall)" />
          <circle cx="35" cy="35" r="21" fill="url(#knobHighlightSmall)" />

          <line
            x1="35"
            y1="35"
            x2={35 + 16 * Math.cos((angle * Math.PI) / 180)}
            y2={35 + 16 * Math.sin((angle * Math.PI) / 180)}
            stroke="#FFD700"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
          />

          <circle cx="35" cy="35" r="4" fill="#1a1a1a" />
          <circle cx="35" cy="35" r="2.5" fill="#FFD700" opacity="0.6" />
          <circle cx="35" cy="35" r="1" fill="#FFFFFF" opacity="0.4" />
        </svg>

        <div
          style={{
            position: 'absolute',
            bottom: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: '600',
            pointerEvents: 'none',
            zIndex: 1,
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            background: 'rgba(0,0,0,0.4)',
            padding: '1px 6px',
            borderRadius: '4px',
            minWidth: '30px',
          }}
        >
          {Math.round(value)}
          <span style={{ fontSize: '7px', color: '#888888', marginLeft: '1px' }}>{unit}</span>
        </div>
      </div>

      <span
        style={{
          color: '#FFD700',
          fontSize: '7px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: '600',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          opacity: disabled ? 0.5 : 0.9,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export default KnobElegante;
