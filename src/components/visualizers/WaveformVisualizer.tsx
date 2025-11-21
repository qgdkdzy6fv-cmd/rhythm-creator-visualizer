import { useEffect, useRef } from 'react';

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

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const centerY = height / 2;
      const amplitude = height / 4;
      const frequency = 0.02;
      const time = Date.now() * 0.001;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin((x * frequency) + time) * amplitude;
        if (x === 0) {
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
