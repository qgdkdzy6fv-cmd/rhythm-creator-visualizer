import { useEffect, useRef } from 'react';

interface BarsVisualizerProps {
  color: string;
  isActive: boolean;
}

export function BarsVisualizer({ color, isActive }: BarsVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 64;
    const barWidth = canvas.width / barCount;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = color;

      const time = Date.now() * 0.001;

      for (let i = 0; i < barCount; i++) {
        const barHeight = (Math.sin(time + i * 0.2) * 0.5 + 0.5) * height * 0.8;
        const x = i * barWidth;
        const y = height - barHeight;

        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      requestAnimationFrame(draw);
    };

    draw();
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
