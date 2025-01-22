import { describe, it, expect, beforeEach } from 'vitest';
import { VideoStreamManager } from '@/lib/video/stream-manager';
import { ComputerVisionProcessor } from '@/lib/video/cv-processor';
import { PerformanceMonitor } from '@/lib/video/performance';

describe('Computer Vision Integration', () => {
  let streamManager: VideoStreamManager;
  let cvProcessor: ComputerVisionProcessor;
  let perfMonitor: PerformanceMonitor;

  beforeEach(() => {
    streamManager = new VideoStreamManager({
      width: 1280,
      height: 720,
      frameRate: 30,
    });
    cvProcessor = new ComputerVisionProcessor();
    perfMonitor = new PerformanceMonitor();
  });

  it('should process frames within performance budget', async () => {
    const stream = await streamManager.initialize();
    const frame = await streamManager.captureFrame();
    
    perfMonitor.start('frame_processing');
    const result = await cvProcessor.processFrame(frame);
    const processingTime = perfMonitor.end('frame_processing');

    expect(processingTime).toBeLessThan(33); // 30fps budget
    expect(result).toBeDefined();
  });

  it('should detect and track ball movement', async () => {
    const stream = await streamManager.initialize();
    const frames = await streamManager.captureFrameSequence(10);
    
    for (const frame of frames) {
      const result = await cvProcessor.processFrame(frame);
      expect(result.ballPosition).toBeDefined();
      expect(result.ballVelocity).toBeDefined();
    }
  });

  it('should handle frame drops gracefully', async () => {
    const stream = await streamManager.initialize();
    
    // Simulate frame drops
    streamManager.simulateFrameDrops(0.2); // 20% drop rate
    
    const stats = await streamManager.getStreamStats();
    expect(stats.droppedFrames).toBeGreaterThan(0);
    expect(stats.recoveryAttempts).toBeGreaterThan(0);
  });
});