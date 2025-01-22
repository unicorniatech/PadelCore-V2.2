export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  start(metricName: string) {
    this.startTimes.set(metricName, performance.now());
  }

  end(metricName: string): number {
    const startTime = this.startTimes.get(metricName);
    if (!startTime) {
      throw new Error(`No start time found for metric: ${metricName}`);
    }

    const duration = performance.now() - startTime;
    this.metrics.set(metricName, duration);
    return duration;
  }

  getMetric(metricName: string): number | undefined {
    return this.metrics.get(metricName);
  }

  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
    this.startTimes.clear();
  }

  async measureMemoryUsage(): Promise<number> {
    if ('memory' in performance) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }
}