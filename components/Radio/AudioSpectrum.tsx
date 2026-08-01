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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 32;
    const barWidth = width / barCount - 2;

    // Inicializa as barras
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.3 + 0.1);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Atualiza as barras com animação suave
      if (isActive) {
        // Quando ativo, as barras se movem aleatoriamente
        barsRef.current = barsRef.current.map((bar) => {
          const change = (Math.random() - 0.5) * 0.15;
          return Math.max(0.05, Math.min(0.95, bar + change));
        });
      } else {
        // Quando inativo, as barras ficam baixas e estáveis
        barsRef.current = barsRef.current.map((bar) => {
          const target = 0.05 + Math.random() * 0.05;
          return bar + (target - bar) * 0.02;
        });
      }

      // Desenha as barras
      barsRef.current.forEach((heightPercent, i) => {
        const x = i * (barWidth + 2) + 1;
        const barHeight = heightPercent * height * 0.9;
        const y = height - barHeight - 4;

        // Gradiente da barra
        const gradient = ctx.createLinearGradient(
          x, y,
          x, height - 4
        );
        if (isActive) {
          gradient.addColorStop(0, color);
          gradient.addColorStop(0.5, color);
          gradient.addColorStop(1, `${color}40`);
        } else {
          gradient.addColorStop(0, '#444444');
          gradient.addColorStop(1, '#222222');
        }

        ctx.fillStyle = gradient;

        // Barra com bordas arredondadas
        const radius = 2;
        const rectX = x;
        const rectY = y;
        const rectWidth = barWidth;
        const rectHeight = barHeight;

        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight);
        ctx.lineTo(rectX, rectY + rectHeight);
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.closePath();
        ctx.fill();

        // Brilho extra nas barras ativas
        if (isActive && heightPercent > 0.5) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
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
      height={32}
      style={{
        width: '100%',
        height: '32px',
        borderRadius: '4px',
        display: 'block',
      }}
    />
  );
};

export default AudioSpectrum;
