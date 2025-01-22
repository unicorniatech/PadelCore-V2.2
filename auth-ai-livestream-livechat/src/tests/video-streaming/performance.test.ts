import { describe, it, expect, beforeEach } from 'vitest';
import { VideoStreamManager } from '@/lib/video/stream-manager';
import { ComputerVisionProcessor } from '@/lib/video/cv-processor';
import { PerformanceMonitor } from '@/lib/video/performance';

describe('Performance Testing', () => {
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

  it('should maintain memory usage within limits', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize;
    
    // Process 100 frames
    for (let i = 0; i < 100; i++) {
      const frame = await streamManager.captureFrame();
      await cvProcessor.processFrame(frame);
    }

    const finalMemory = performance.memory?.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB limit
  });

  it('should optimize CPU usage', async () => {
    perfMonitor.start('cpu_usage');
    
    // Run intensive processing
    for (let i = 0; i < 30; i++) {
      const frame = await streamManager.captureFrame();
      await cvProcessor.processFrame(frame);
    }
    
    const cpuTime = perfMonitor.end('cpu_usage');
    const avgTimePerFrame = cpuTime / 30;
    
    expect(avgTimePerFrame).toBeLessThan(20); // 20ms per frame target
  });

  it('should handle resolution changes efficiently', async () => {
    const resolutions = [
      { width: 640, height: 480 },
      { width: 1280, height: 720 },
      { width: 1920, height: 1080 }
    ];

    for (const resolution of resolutions) {
      await streamManager.setResolution(resolution);
      const frame = await streamManager.captureFrame();
      
      perfMonitor.start('resolution_change');
      await cvProcessor.processFrame(frame);
      const processingTime = perfMonitor.end('resolution_change');
      
      // Higher resolutions should still maintain performance
      expect(processingTime).toBeLessThan(50);
    }
  });
});