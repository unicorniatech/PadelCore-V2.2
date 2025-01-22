import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { BallTrackingAnalytics } from '@/lib/video/analytics';

interface AnalyticsOverlayProps {
  width: number;
  height: number;
  analytics: BallTrackingAnalytics;
}

export function AnalyticsOverlay({
  width,
  height,
  analytics,
}: AnalyticsOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;
    
    const cellSize = 10; // Smaller cells for more precise heatmap
    const padding = 10; // Match CV processor padding

    const drawHeatmap = () => {
      const heatmapData = analytics.generateHeatmap();
      
      context.clearRect(0, 0, width, height);
      
      // Only draw heatmap within padded bounds
      heatmapData.filter(point => {
        const x = point.x * cellSize;
        const y = point.y * cellSize;
        
        // Skip if outside padded bounds
        if (x < padding || x > width - padding - cellSize ||
            y < padding || y > height - padding - cellSize) {
          return;
        }
        
        const alpha = point.intensity * 0.3; // Reduced opacity for better visibility
        context.fillStyle = `rgba(0, 168, 89, ${alpha})`;
        context.fillRect(x, y, cellSize, cellSize);
      });

      requestAnimationFrame(drawHeatmap);
    };

    drawHeatmap();
  }, [analytics, width, height]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />
      
      <div className="absolute bottom-4 right-4 space-y-2">
        <Card className="p-2 text-xs bg-black/50 text-white">
          <div>Velocidad Promedio: {analytics.calculateVelocityStats().average.toFixed(2)} px/ms</div>
          <div>Velocidad Máxima: {analytics.calculateVelocityStats().max.toFixed(2)} px/ms</div>
        </Card>
        
        <Card className="p-2 text-xs bg-black/50 text-white">
          <div>Lado Izquierdo: {(analytics.calculatePositionStats()?.leftSide || 0 * 100).toFixed(1)}%</div>
          <div>Lado Derecho: {(analytics.calculatePositionStats()?.rightSide || 0 * 100).toFixed(1)}%</div>
        </Card>
      </div>
    </div>
  );
}