export interface TrafficPoint {
  timestamp: string;
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  threats: number;
}

class TrafficStore {
  private history: TrafficPoint[] = [];
  private maxPoints = 120;
  public startTime = Date.now();

  constructor() {
    // Pre-fill with historical data
    const now = Date.now();
    for (let i = this.maxPoints; i >= 0; i--) {
      const t = new Date(now - i * 10000);
      this.history.push(this.generatePoint(t));
    }
  }

  private generatePoint(timestamp: Date): TrafficPoint {
    const base = 1024 * 1024;
    return {
      timestamp: timestamp.toISOString(),
      bytesIn: base * (Math.random() * 80 + 20),
      bytesOut: base * (Math.random() * 60 + 10),
      packetsIn: Math.floor(Math.random() * 5000 + 1000),
      packetsOut: Math.floor(Math.random() * 4000 + 800),
      threats: Math.floor(Math.random() * 5),
    };
  }

  addPoint(): TrafficPoint {
    const point = this.generatePoint(new Date());
    this.history.push(point);
    if (this.history.length > this.maxPoints) {
      this.history.shift();
    }
    return point;
  }

  getHistory(minutes: number): TrafficPoint[] {
    const since = Date.now() - minutes * 60 * 1000;
    return this.history.filter((p) => new Date(p.timestamp).getTime() >= since);
  }

  getLatest(): TrafficPoint | undefined {
    return this.history[this.history.length - 1];
  }
}

export const trafficStore = new TrafficStore();
