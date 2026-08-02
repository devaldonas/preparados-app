// components/Radio/AudioSpectrum.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface AudioSpectrumProps {
  isActive: boolean;
  color?: string;
}

const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ 
  isActive, 
  color = '#FFD700' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);

  // Função para desenhar barras arredondadas manualmente
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 24;
    const barWidth = width / barCount - 2;
    const radius = 2;

    // Inicializa as barras
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.2 + 0.05);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (isActive) {
        // Barras se movem como ondas de áudio
        barsRef.current = barsRef.current.map((bar, i) => {
          const wave = Math.sin(Date.now() / 200 + i * 0.4) * 0.3 + 0.5;
          const target = Math.max(0.05, Math.min(0.9, wave * 0.8 + 0.1));
          return bar + (target - bar) * 0.15;
        });
      } else {
        // Quando inativo, barras baixas com pequena variação
        barsRef.current = barsRef.current.map((bar) => {
          const target = 0.05 + Math.random() * 0.02;
          return bar + (target - bar) * 0.03;
        });
      }

      // Desenha as barras
      barsRef.current.forEach((heightPercent, i) => {
        const x = i * (barWidth + 2) + 1;
        const barHeight = Math.max(2, heightPercent * height * 0.85);
        const y = height - barHeight - 2;

        const gradient = ctx.createLinearGradient(x, y, x, height - 2);
        if (isActive) {
          const alpha = Math.min(1, heightPercent * 1.5);
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, `${color}30`);
        } else {
          gradient.addColorStop(0, '#444444');
          gradient.addColorStop(1, '#222222');
        }

        ctx.fillStyle = gradient;
        
        // Desenha barra arredondada manualmente
        drawRoundedRect(ctx, x, y, barWidth, barHeight, Math.min(radius, barWidth / 2));

        if (isActive && heightPercent > 0.3) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, color]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={28}
      style={{
        width: '100%',
        height: '28px',
        borderRadius: '4px',
        display: 'block',
      }}
    />
  );
};

export default AudioSpectrum;