import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VideoStreamManager } from '@/lib/video/stream-manager';
import { ComputerVisionProcessor } from '@/lib/video/cv-processor';
import { PerformanceMonitor } from '@/lib/video/performance';
import { Camera, Maximize2, Minimize2, Settings } from 'lucide-react';

interface LiveVideoProps {
  width?: number;
  height?: number;
  frameRate?: number;
  onBallPosition?: (position: { x: number; y: number }) => void;
  scene?: string;
}

export const LiveVideo = forwardRef<any, LiveVideoProps>(({
  width = 1280,
  height = 720,
  frameRate = 30,
  onBallPosition,
  scene = 'main',
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamManager, setStreamManager] = useState<VideoStreamManager | null>(null);
  const [cvProcessor] = useState(() => new ComputerVisionProcessor());
  const [perfMonitor] = useState(() => new PerformanceMonitor());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stats, setStats] = useState({
    fps: 0,
    droppedFrames: 0,
    processingTime: 0,
    streamSource: 'Streamlabs',
  });

  useImperativeHandle(ref, () => ({
    streamManager,
  }));

  useEffect(() => {
    const initStream = async () => {
      const manager = new VideoStreamManager({ width, height, frameRate });
      setStreamManager(manager);
      
      try {
        const stream = await manager.initialize();
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Set video properties for better Streamlabs compatibility
          videoRef.current.setAttribute('playsinline', '');
          videoRef.current.setAttribute('webkit-playsinline', '');
        }
        startProcessing(manager);
      } catch (error) {
        console.error('Failed to initialize stream:', error);
      }
    };

    initStream();

    return () => {
      streamManager?.cleanup();
    };
  }, [width, height, frameRate]);

  useEffect(() => {
    if (streamManager && scene) {
      const switchScene = async () => {
        try {
          setIsTransitioning(true);
          await streamManager.switchScene(scene);
        } catch (error) {
          console.error('Error switching scene:', error);
        } finally {
          setIsTransitioning(false);
        }
      };
      
      switchScene();
    }
  }, [scene, streamManager]);

  const startProcessing = async (manager: VideoStreamManager) => {
    if (!canvasRef.current || isProcessing) return;

    let errorCount = 0;
    const MAX_ERRORS = 5;
    const ERROR_RESET_INTERVAL = 5000; // 5 seconds
    let animationFrameId: number;
    
    setIsProcessing(true);
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // Reset error count periodically
    const errorResetInterval = setInterval(() => {
      errorCount = 0;
    }, ERROR_RESET_INTERVAL);

    const processFrame = async () => {
      if (!manager || !context) return;

      try {
        perfMonitor.start('frame');
        const frame = await manager.captureFrame();

        const result = await cvProcessor.processFrame(frame);
        
        // Draw frame
        const imageData = new ImageData(
          frame.data,
          frame.width,
          frame.height
        );
        context.putImageData(imageData, 0, 0);

        // Draw ball position if detected
        if (result.ballPosition) {
          const ballRadius = 5; // Smaller ball radius
          const velocityScale = 25; // Reduced velocity vector scale

          context.beginPath();
          context.arc(
            result.ballPosition.x,
            result.ballPosition.y,
            ballRadius,
            0,
            2 * Math.PI
          );
          context.strokeStyle = '#00a859';
          context.lineWidth = 2;
          context.stroke();

          // Draw velocity vector
          if (result.ballVelocity) {
            const speed = Math.sqrt(
              result.ballVelocity.x * result.ballVelocity.x +
              result.ballVelocity.y * result.ballVelocity.y
            );
            
            if (speed > 0.1) { // Only draw if moving significantly
              const endX = result.ballPosition.x + result.ballVelocity.x * velocityScale;
              const endY = result.ballPosition.y + result.ballVelocity.y * velocityScale;
              
              // Ensure velocity vector stays in bounds
              const boundedEndX = Math.max(ballRadius, Math.min(width - ballRadius, endX));
              const boundedEndY = Math.max(ballRadius, Math.min(height - ballRadius, endY));
              
              context.beginPath();
              context.moveTo(result.ballPosition.x, result.ballPosition.y);
              context.lineTo(boundedEndX, boundedEndY);
              context.strokeStyle = '#00a859';
              context.lineWidth = 1;
              context.stroke();
            }
          }

          onBallPosition?.(result.ballPosition);
        }

        const processingTime = perfMonitor.end('frame');
        
        // Update stats every second
        if (Date.now() % 1000 < 50) {
          const streamStats = await manager.getStreamStats();
          setStats({
            fps: Math.round(streamStats.averageFrameRate),
            droppedFrames: streamStats.droppedFrames,
            processingTime: Math.round(processingTime),
          });
        }

      } catch (error) {
        if (error.message === 'Frame dropped') {
          // Ignore expected frame drops
          console.debug('Frame dropped');
        } else if (error.message === 'Video not ready' || error.message === 'Stream inactive') {
          // Wait for stream to stabilize
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          // Handle unexpected errors
          errorCount++;
          
          if (errorCount >= MAX_ERRORS) {
            console.error('Too many errors, stopping processing');
            clearInterval(errorResetInterval);
            cancelAnimationFrame(animationFrameId);
            setIsProcessing(false);
            return;
          }
          console.error('Frame processing error:', error);
        }
      }

      // Request next frame
      animationFrameId = requestAnimationFrame(processFrame);
    };

    processFrame();

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearInterval(errorResetInterval);
      setIsProcessing(false);
    };
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      const container = videoRef.current?.closest('.video-container');
      if (container) {
        container.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <Card className="relative overflow-hidden video-container min-h-[50vh]">
      <video
        ref={videoRef}
        className="hidden"
        autoPlay
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`w-full h-full object-contain bg-muted transition-opacity duration-300 ${
          isTransitioning ? 'opacity-50' : 'opacity-100'
        } ${isFullscreen ? 'min-h-screen' : ''}`}
      />
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <div className="bg-black/50 text-white text-sm px-3 py-1 rounded-full flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {stats.streamSource}
        </div>
        <div className="bg-black/50 text-white text-sm px-3 py-1 rounded-full">
          {stats.fps} FPS
        </div>
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleFullscreen}
          className="bg-black/50 hover:bg-black/70"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Debug stats */}
      <div className="absolute bottom-4 left-4 text-xs text-white space-y-1">
        <div className="bg-black/50 px-2 py-1 rounded">
          Dropped Frames: {stats.droppedFrames}
        </div>
        <div className="bg-black/50 px-2 py-1 rounded">
          Processing: {stats.processingTime}ms
        </div>
      </div>
    </Card>
  );
});

LiveVideo.displayName = 'LiveVideo';