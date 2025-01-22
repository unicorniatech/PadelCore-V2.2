import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VideoStreamManager } from '@/lib/video/stream-manager';
import { ComputerVisionProcessor } from '@/lib/video/cv-processor';

describe('Video Streaming Setup', () => {
  let streamManager: VideoStreamManager;
  let cvProcessor: ComputerVisionProcessor;

  beforeEach(() => {
    streamManager = new VideoStreamManager({
      width: 1280,
      height: 720,
      frameRate: 30,
    });
    cvProcessor = new ComputerVisionProcessor();
  });

  afterEach(async () => {
    await streamManager.cleanup();
  });

  it('should initialize video stream with correct settings', async () => {
    const stream = await streamManager.initialize();
    expect(stream).toBeDefined();
    expect(stream.getVideoTracks()).toHaveLength(1);
    
    const settings = stream.getVideoTracks()[0].getSettings();
    expect(settings.width).toBe(1280);
    expect(settings.height).toBe(720);
    expect(settings.frameRate).toBe(30);
  });

  it('should handle stream initialization errors gracefully', async () => {
    // Simulate no camera access
    vi.spyOn(navigator.mediaDevices, 'getUserMedia')
      .mockRejectedValue(new Error('NotAllowedError'));

    await expect(streamManager.initialize())
      .rejects.toThrow('Camera access denied');
  });

  it('should maintain stable frame rate', async () => {
    const stream = await streamManager.initialize();
    const frameRates: number[] = [];

    // Monitor frame rate for 5 seconds
    for (let i = 0; i < 5; i++) {
      const rate = await streamManager.measureFrameRate();
      frameRates.push(rate);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check frame rate stability
    const avgFrameRate = frameRates.reduce((a, b) => a + b) / frameRates.length;
    expect(avgFrameRate).toBeGreaterThan(25); // Allow some variance
    expect(avgFrameRate).toBeLessThan(35);
  });
});