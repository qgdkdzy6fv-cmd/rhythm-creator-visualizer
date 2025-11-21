import { useEffect, useRef } from 'react';

interface CircularVisualizerProps {
  color: string;
  isActive: boolean;
}

export function CircularVisualizer({ color, isActive }: CircularVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;
    let animationId: number;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      const time = Date.now() * 0.001;
      const points = 128;

      ctx.beginPath();

      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const radiusVariation = Math.sin(time * 2 + angle * 8) * 0.3 + 1;
        const radius = maxRadius * radiusVariation * 0.7;

        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.closePath();
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
