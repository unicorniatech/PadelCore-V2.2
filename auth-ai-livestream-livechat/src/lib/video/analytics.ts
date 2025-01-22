interface BallPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface HeatmapData {
  x: number;
  y: number;
  intensity: number;
}

interface AnalyticsResult {
  heatmap: HeatmapData[];
  velocityStats: {
    average: number;
    max: number;
    min: number;
  };
  positionStats: {
    leftSide: number;
    rightSide: number;
    frontCourt: number;
    backCourt: number;
  };
}

export class BallTrackingAnalytics {
  private positions: BallPosition[] = [];
  private readonly maxPositions = 1000; // Keep last 1000 positions
  private readonly heatmapResolution = 10; // 10x10 grid for finer detail

  addPosition(x: number, y: number) {
    this.positions.push({
      x,
      y,
      timestamp: Date.now(),
    });

    // Keep array size limited
    if (this.positions.length > this.maxPositions) {
      this.positions.shift();
    }
  }

  generateHeatmap(): HeatmapData[] {
    const heatmap: HeatmapData[] = [];
    const gridSize = {
      x: Math.floor(1280 / this.heatmapResolution),
      y: Math.floor(720 / this.heatmapResolution),
    };

    // Initialize grid
    for (let x = 0; x < gridSize.x; x++) {
      for (let y = 0; y < gridSize.y; y++) {
        heatmap.push({ x, y, intensity: 0 });
      }
    }

    // Add positions to heatmap
    this.positions.forEach(pos => {
      const gridX = Math.floor(pos.x / this.heatmapResolution);
      const gridY = Math.floor(pos.y / this.heatmapResolution);
      // Ensure position is within bounds
      if (gridX < 0 || gridX >= gridSize.x || gridY < 0 || gridY >= gridSize.y) {
        return;
      }
      
      const index = gridY * gridSize.x + gridX;
      
      if (index >= 0 && index < heatmap.length) {
        heatmap[index].intensity++;
      }
    });

    // Normalize intensities
    const maxIntensity = Math.max(...heatmap.map(h => h.intensity));
    return heatmap.map(h => ({
      ...h,
      intensity: h.intensity / maxIntensity,
    }));
  }

  calculateVelocityStats() {
    const velocities: number[] = [];
    
    for (let i = 1; i < this.positions.length; i++) {
      const prev = this.positions[i - 1];
      const curr = this.positions[i];
      
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const dt = curr.timestamp - prev.timestamp;
      
      const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
      velocities.push(velocity);
    }

    return {
      average: velocities.reduce((a, b) => a + b, 0) / velocities.length,
      max: Math.max(...velocities),
      min: Math.min(...velocities),
    };
  }

  calculatePositionStats() {
    const total = this.positions.length;
    if (total === 0) return null;

    const stats = {
      leftSide: 0,
      rightSide: 0,
      frontCourt: 0,
      backCourt: 0,
    };

    this.positions.forEach(pos => {
      // Horizontal split
      if (pos.x < 640) stats.leftSide++;
      else stats.rightSide++;

      // Vertical split
      if (pos.y < 360) stats.frontCourt++;
      else stats.backCourt++;
    });

    return {
      leftSide: stats.leftSide / total,
      rightSide: stats.rightSide / total,
      frontCourt: stats.frontCourt / total,
      backCourt: stats.backCourt / total,
    };
  }

  getAnalytics(): AnalyticsResult {
    return {
      heatmap: this.generateHeatmap(),
      velocityStats: this.calculateVelocityStats(),
      positionStats: this.calculatePositionStats() || {
        leftSide: 0,
        rightSide: 0,
        frontCourt: 0,
        backCourt: 0,
      },
    };
  }

  reset() {
    this.positions = [];
  }
}