interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class PerformanceService {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 1000;

  static trackMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now()
    });

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Report to monitoring service if available
    if (process.env.NODE_ENV === 'production') {
      this.reportMetric(name, value);
    }
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    return fn().finally(() => {
      const duration = performance.now() - startTime;
      this.trackMetric(`${name}_duration`, duration);
    });
  }

  static getMetrics(name?: string): PerformanceMetric[] {
    return name 
      ? this.metrics.filter(m => m.name === name)
      : this.metrics;
  }

  static getAverageMetric(name: string, lastN?: number): number {
    const relevantMetrics = this.metrics
      .filter(m => m.name === name)
      .slice(-(lastN || this.metrics.length));

    if (relevantMetrics.length === 0) return 0;

    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  private static async reportMetric(name: string, value: number) {
    try {
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          value,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to report metric:', error);
    }
  }

  static clearMetrics() {
    this.metrics = [];
  }
}

export default PerformanceService; 