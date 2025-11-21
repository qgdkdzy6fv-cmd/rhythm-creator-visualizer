import { useEffect, useRef } from 'react';
import { audioEngine } from '../../lib/audioEngine';

interface WaveformVisualizerProps {
  color: string;
  isActive: boolean;
}

export function WaveformVisualizer({ color, isActive }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const data = audioEngine.getAnalyserData();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const sliceWidth = width / data.length;

      for (let i = 0; i < data.length; i++) {
        const v = data[i];
        const y = centerY + (v * centerY * 0.8);
        const x = i * sliceWidth;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [color, isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={400}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
