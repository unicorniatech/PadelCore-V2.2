import { ErrorHandler } from './error-handler';

interface StreamConfig {
  width: number;
  height: number;
  frameRate: number;
}

interface StreamStats {
  droppedFrames: number;
  recoveryAttempts: number;
  averageFrameRate: number;
  totalFrames: number;
}

export class VideoStreamManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private config: StreamConfig;
  private stats: StreamStats;
  private errorHandler: ErrorHandler;
  private frameCallback: ((frame: ImageData) => void) | null = null;
  private lastFrameTime: number = 0;
  private activeScene: string = 'main';
  private scenes: Map<string, MediaStream> = new Map();
  private transitionInProgress: boolean = false;
  private sceneInitPromises: Map<string, Promise<MediaStream>> = new Map();

  constructor(config: StreamConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
    this.stats = {
      droppedFrames: 0,
      recoveryAttempts: 0,
      averageFrameRate: 0,
      totalFrames: 0,
    };
    this.errorHandler = new ErrorHandler();

    // Set canvas dimensions
    this.canvas.width = config.width;
    this.canvas.height = config.height;
  }

  async initialize(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false, // Streamlabs handles audio separately
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          frameRate: { ideal: this.config.frameRate },
          // Add settings for better Streamlabs compatibility
          facingMode: 'environment',
          deviceId: await this.getPreferredCamera(),
        },
      });

      // Create video element for stream
      this.videoElement = document.createElement('video');
      // Add attributes for better Streamlabs compatibility
      this.videoElement.setAttribute('playsinline', '');
      this.videoElement.setAttribute('webkit-playsinline', '');
      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      return this.stream;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera access denied');
      }
      throw error;
    }
  }

  private async getPreferredCamera(): Promise<string | undefined> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      // Prefer external camera if available (common for Streamlabs setups)
      const externalCamera = cameras.find(camera => 
        camera.label.toLowerCase().includes('external') ||
        camera.label.toLowerCase().includes('streamlabs')
      );
      
      return externalCamera?.deviceId;
    } catch (error) {
      console.warn('Could not enumerate devices:', error);
      return undefined;
    }
  }
  async captureFrame(): Promise<ImageData> {
    if (!this.videoElement || !this.stream) {
      throw new Error('Stream not initialized');
    }

    // Check if enough time has passed since last frame
    const now = performance.now();
    const minFrameTime = 1000 / this.config.frameRate;
    
    if (now - this.lastFrameTime < minFrameTime) {
      this.stats.droppedFrames++;
      throw new Error('Frame dropped');
    }

    // Draw current frame to canvas
    this.context.drawImage(
      this.videoElement,
      0,
      0,
      this.config.width,
      this.config.height
    );

    // Update frame timing
    this.lastFrameTime = now;
    this.stats.totalFrames++;

    // Calculate average frame rate
    const frameTime = now - this.lastFrameTime;
    this.stats.averageFrameRate = 1000 / frameTime;

    // Get frame data
    return this.context.getImageData(
      0,
      0,
      this.config.width,
      this.config.height
    );
  }

  async captureFrameSequence(count: number): Promise<ImageData[]> {
    const frames: ImageData[] = [];
    for (let i = 0; i < count; i++) {
      frames.push(await this.captureFrame());
      await new Promise(resolve => setTimeout(resolve, 1000 / this.config.frameRate));
    }
    return frames;
  }

  async measureFrameRate(): Promise<number> {
    const startTime = performance.now();
    let frameCount = 0;
    
    // Measure frames over 1 second
    while (performance.now() - startTime < 1000) {
      await this.captureFrame();
      frameCount++;
    }

    const duration = (performance.now() - startTime) / 1000;
    return frameCount / duration;
  }

  async getStreamStats(): Promise<StreamStats> {
    return { ...this.stats };
  }

  async setResolution(resolution: { width: number; height: number }) {
    this.config.width = resolution.width;
    this.config.height = resolution.height;
    this.canvas.width = resolution.width;
    this.canvas.height = resolution.height;

    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      await videoTrack.applyConstraints({
        width: resolution.width,
        height: resolution.height,
      });
    }
  }

  async switchScene(sceneName: string) {
    // Prevent multiple transitions at once
    if (this.transitionInProgress) {
      console.warn('Scene transition already in progress');
      return this.stream;
    }

    try {
      this.transitionInProgress = true;

      // Check if we already have an initialization in progress
      const existingPromise = this.sceneInitPromises.get(sceneName);
      if (existingPromise) {
        return await existingPromise;
      }

      // Store current stream if it exists
      if (this.stream) {
        this.scenes.set(this.activeScene, this.stream);
      }

      // Try to get existing stream for scene
      const existingStream = this.scenes.get(sceneName);
      if (existingStream && this.isStreamActive(existingStream)) {
        this.stream = existingStream;
        if (this.videoElement) {
          await this.smoothTransition(existingStream);
        }
      } else {
        // Initialize new stream for scene
        const initPromise = this.initialize();
        this.sceneInitPromises.set(sceneName, initPromise);
        
        try {
          const newStream = await initPromise;
          if (this.videoElement) {
            await this.smoothTransition(newStream);
          }
          this.scenes.set(sceneName, newStream);
          this.stream = newStream;
        } finally {
          this.sceneInitPromises.delete(sceneName);
        }
      }

      this.activeScene = sceneName;
      return this.stream;
    } finally {
      this.transitionInProgress = false;
    }
  }

  private isStreamActive(stream: MediaStream): boolean {
    return stream.active && stream.getVideoTracks().some(track => track.readyState === 'live');
  }

  private async smoothTransition(newStream: MediaStream): Promise<void> {
    // Store current stream if it exists
    const oldStream = this.videoElement!.srcObject as MediaStream;
    
    // Prepare the new stream
    if (!this.videoElement) return;
    
    // Create temporary video element for new stream
    const tempVideo = document.createElement('video');
    tempVideo.srcObject = newStream;
    tempVideo.muted = true;
    
    try {
      // Wait for the new stream to be ready
      await tempVideo.play();
      
      // Smoothly switch to new stream
      this.videoElement.srcObject = newStream;
      await this.videoElement.play();
      
      // Clean up old stream if it exists
      if (oldStream && oldStream !== newStream) {
        oldStream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      }
    } catch (error) {
      console.error('Error during stream transition:', error);
      throw error;
    } finally {
      tempVideo.remove();
    }
  }

  getActiveScene(): string {
    return this.activeScene;
  }

  async cleanup() {
    // Stop all streams
    this.scenes.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    this.scenes.clear();

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  // Test helpers
  async simulateConnectionLoss() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stats.recoveryAttempts++;
      await this.initialize();
    }
  }

  async simulateErrors(errors: string[]) {
    errors.forEach(error => {
      this.errorHandler.handleError(error as any, `Simulated error: ${error}`);
    });
  }

  generateCorruptedFrame(): ImageData {
    const frame = this.context.createImageData(this.config.width, this.config.height);
    // Fill with random noise
    for (let i = 0; i < frame.data.length; i += 4) {
      frame.data[i] = Math.random() * 255;
      frame.data[i + 1] = Math.random() * 255;
      frame.data[i + 2] = Math.random() * 255;
      frame.data[i + 3] = 255;
    }
    return frame;
  }

  simulateFrameDrops(dropRate: number) {
    this.stats.droppedFrames += Math.floor(this.stats.totalFrames * dropRate);
  }
}