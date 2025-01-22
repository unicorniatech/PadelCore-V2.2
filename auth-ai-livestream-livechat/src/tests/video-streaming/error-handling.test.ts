import { describe, it, expect, beforeEach } from 'vitest';
import { VideoStreamManager } from '@/lib/video/stream-manager';
import { ComputerVisionProcessor } from '@/lib/video/cv-processor';
import { ErrorHandler } from '@/lib/video/error-handler';

describe('Error Handling', () => {
  let streamManager: VideoStreamManager;
  let cvProcessor: ComputerVisionProcessor;
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    streamManager = new VideoStreamManager({
      width: 1280,
      height: 720,
      frameRate: 30,
    });
    cvProcessor = new ComputerVisionProcessor();
    errorHandler = new ErrorHandler();
  });

  it('should recover from connection loss', async () => {
    const stream = await streamManager.initialize();
    
    // Simulate connection loss
    await streamManager.simulateConnectionLoss();
    
    const recoveryAttempts = await errorHandler.getRecoveryAttempts();
    const finalStream = await streamManager.getStream();
    
    expect(recoveryAttempts).toBeGreaterThan(0);
    expect(finalStream.active).toBe(true);
  });

  it('should handle invalid frames', async () => {
    const stream = await streamManager.initialize();
    
    // Process corrupted frame
    const corruptedFrame = await streamManager.generateCorruptedFrame();
    const result = await cvProcessor.processFrame(corruptedFrame);
    
    expect(result.error).toBeDefined();
    expect(result.fallbackData).toBeDefined();
  });

  it('should log errors appropriately', async () => {
    const errorLogs = [];
    errorHandler.onError((error) => errorLogs.push(error));
    
    // Trigger various error conditions
    await streamManager.simulateErrors([
      'CONNECTION_LOST',
      'FRAME_CORRUPT',
      'PROCESSING_TIMEOUT'
    ]);
    
    expect(errorLogs).toHaveLength(3);
    expect(errorLogs[0].type).toBe('CONNECTION_LOST');
    expect(errorLogs[0].timestamp).toBeDefined();
  });
});