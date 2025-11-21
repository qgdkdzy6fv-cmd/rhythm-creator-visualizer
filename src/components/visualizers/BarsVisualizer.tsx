import { useEffect, useRef } from 'react';
import { audioEngine } from '../../lib/audioEngine';

interface BarsVisualizerProps {
  color: string;
  isActive: boolean;
}

export function BarsVisualizer({ color, isActive }: BarsVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const data = audioEngine.getAnalyserData();
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);

      const barCount = 64;
      const barWidth = width / barCount;
      const step = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = data[i * step] / 255;
        const barHeight = value * height;

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color + '80');

        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, isActive]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.offsetWidth;
        canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="visualizer-canvas"
      style={{ width: '100%', height: '200px' }}
    />
  );
}
