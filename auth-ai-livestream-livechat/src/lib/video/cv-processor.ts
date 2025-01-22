interface ProcessingResult {
  ballPosition?: { x: number; y: number };
  ballVelocity?: { x: number; y: number };
  error?: string;
  fallbackData?: any;
}

export class ComputerVisionProcessor {
  private lastPosition: { x: number; y: number } | null = null;
  private frameCount: number = 0;
  private readonly pixelsToMeters = 0.02; // 1 pixel ≈ 2cm
  private readonly padding = 10; // Reduced padding to keep ball closer to edges

  async processFrame(imageData: ImageData): Promise<ProcessingResult> {
    try {
      // Validate input
      if (!this.validateImageData(imageData)) {
        throw new Error('Invalid or corrupted image data');
      }

      this.frameCount++;
      
      // Detect ball position
      const position = await this.detectBall(imageData);
      
      // Calculate velocity
      const velocity = this.calculateVelocity(position);

      // Store current position for next frame
      this.lastPosition = position;

      return {
        ballPosition: position,
        ballVelocity: velocity,
      };
    } catch (error) {
      return {
        error: error.message,
        fallbackData: this.lastPosition ? {
          frameCount: this.frameCount,
          lastKnownPosition: this.lastPosition,
        } : null,
      };
    }
  }

  private validateImageData(imageData: ImageData): boolean {
    return (
      imageData &&
      imageData.data &&
      imageData.data.length > 0 &&
      imageData.width > 0 &&
      imageData.height > 0 &&
      imageData.data.length === imageData.width * imageData.height * 4
    );
  }

  private async detectBall(imageData: ImageData): Promise<{ x: number; y: number }> {
    const { data, width, height } = imageData;
    let maxIntensity = 0;
    let ballX = 0;
    let ballY = 0;

    // Simple color detection (looking for bright pixels)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const intensity = data[i] + data[i + 1] + data[i + 2];
        
        // Only consider pixels within padded bounds
        if (intensity > maxIntensity && 
            x >= this.padding && x <= width - this.padding &&
            y >= this.padding && y <= height - this.padding) {
          maxIntensity = intensity;
          ballX = x;
          ballY = y;
        }
      }
    }

    // Add minimal noise for natural movement
    const noiseAmount = 2;
    ballX += Math.random() * noiseAmount * 2 - noiseAmount;
    ballY += Math.random() * noiseAmount * 2 - noiseAmount;

    // Ensure ball stays within padded bounds
    return {
      x: Math.max(this.padding, Math.min(width - this.padding, ballX)),
      y: Math.max(this.padding, Math.min(height - this.padding, ballY)),
    };
  }

  private calculateVelocity(currentPosition: { x: number; y: number }) {
    if (!this.lastPosition) {
      return { x: 0, y: 0 };
    }

    // Calculate displacement in pixels
    const dx = currentPosition.x - this.lastPosition.x;
    const dy = currentPosition.y - this.lastPosition.y;
    
    // Convert to meters using pixelsToMeters ratio
    return {
      x: dx * this.pixelsToMeters,
      y: dy * this.pixelsToMeters,
    };
  }

  reset() {
    this.lastPosition = null;
    this.frameCount = 0;
  }
}