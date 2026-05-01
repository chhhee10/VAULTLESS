/**
 * behaviouralEngine.ts
 * Derived from HackNocturne reference repo
 * Optimized for VAULTLESS V3 (Solana Web App)
 */

export interface KeystrokeEvent {
  key: string;
  holdTime: number;
  flightTime: number;
  timestamp: number;
}

export interface MouseEvent {
  velocity: number;
  angle: number;
  dt: number;
  pressure: number;
  isTouch: boolean;
}

export interface DNAVector {
  rawVector: Float32Array;
  metadata: any;
}

// ─── Math Helpers ─────────────────────────────────────────────────────────────

const mean = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

const variance = (arr: number[]) => {
  const m = mean(arr);
  return arr.length ? arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length : 0;
};

const std = (arr: number[]) => Math.sqrt(variance(arr));

const zNormalize = (arr: number[]) => {
  const m = mean(arr);
  const s = std(arr);
  if (s === 0) return arr.map(() => 0);
  return arr.map(v => (v - m) / s);
};

const pearsonCorrelation = (x: number[], y: number[]) => {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
};

const ratioSimilarity = (x: number[], y: number[]) => {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i], b = y[i];
    if (a === 0 && b === 0) sum += 1;
    else sum += Math.min(a, b) / Math.max(a, b);
  }
  return sum / n;
};

const norm = (val: number, min: number, max: number) => {
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
};

const padOrTrim = (arr: number[], len: number) => {
  if (arr.length >= len) return arr.slice(0, len);
  return [...arr, ...new Array(len - arr.length).fill(0)];
};

// ─── The Engine ───────────────────────────────────────────────────────────────

export class BehaviouralEngine {
  private keyDownTimes: Record<string, number> = {};
  private lastKeyUpTime: number | null = null;
  private keystrokeEvents: KeystrokeEvent[] = [];
  
  private mousePoints: MouseEvent[] = [];
  private lastPoint: { x: number; y: number; t: number } | null = null;
  
  constructor(private phrase: string = "Secure my account") {}

  // Keystroke Capture
  onKeyDown(key: string) {
    this.keyDownTimes[key] = performance.now();
  }

  onKeyUp(key: string) {
    const now = performance.now();
    const holdTime = this.keyDownTimes[key] ? now - this.keyDownTimes[key] : 0;
    const flightTime = this.lastKeyUpTime ? (this.keyDownTimes[key] || now) - this.lastKeyUpTime : 0;

    this.keystrokeEvents.push({
      key,
      holdTime,
      flightTime: Math.max(0, flightTime),
      timestamp: now
    });
    this.lastKeyUpTime = now;
  }

  // Mouse/Touch Capture
  addPointerPoint(x: number, y: number, pressure: number = 0, isTouch: boolean = false) {
    const now = performance.now();
    if (this.lastPoint) {
      const dx = x - this.lastPoint.x;
      const dy = y - this.lastPoint.y;
      const dt = now - this.lastPoint.t;
      if (dt < 5) return;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const velocity = dt > 0 ? Math.min(dist / dt, 5) : 0;
      const angle = Math.atan2(dy, dx);
      
      this.mousePoints.push({ velocity, angle, dt, pressure, isTouch });
      if (this.mousePoints.length > 512) this.mousePoints.shift();
    }
    this.lastPoint = { x, y, t: now };
  }

  reset() {
    this.keystrokeEvents = [];
    this.mousePoints = [];
    this.keyDownTimes = {};
    this.lastKeyUpTime = null;
    this.lastPoint = null;
  }

  extractDNA(): DNAVector | null {
    // Filter and align keystrokes
    let evts = this.keystrokeEvents.filter(e => e.key !== 'Backspace' && e.key !== 'Shift');
    if (evts.length < this.phrase.length * 0.8) return null;

    // Phrase alignment logic (Simplified for brevity)
    const expected = this.phrase.split('');
    const matched: KeystrokeEvent[] = [];
    let idx = 0;
    for (const e of evts) {
      if (idx < expected.length && e.key === expected[idx]) {
        matched.push(e);
        idx++;
      }
    }
    if (matched.length < expected.length) {
       // Fallback to slice
       evts = evts.slice(0, expected.length);
    } else {
       evts = matched;
    }

    const holdTimes = evts.map(e => e.holdTime);
    const flightTimes = evts.slice(1).map(e => e.flightTime);

    // Build the 64-feature vector (32 keystroke + 32 mouse)
    const kFeatures = [
      norm(mean(holdTimes), 0, 500),
      norm(std(holdTimes), 0, 200),
      norm(mean(flightTimes), 0, 800),
      norm(std(flightTimes), 0, 400),
      ...padOrTrim(holdTimes.map(h => norm(h, 0, 500)), 12),
      ...padOrTrim(flightTimes.map(f => norm(f, 0, 800)), 12),
      ...new Array(4).fill(0) // padding
    ];

    const mFeatures = padOrTrim(this.mousePoints.slice(-16).map(p => norm(p.velocity, 0, 5)), 16);
    const mAngleFeatures = padOrTrim(this.mousePoints.slice(-16).map(p => norm(Math.abs(p.angle), 0, Math.PI)), 16);

    const rawVector = new Float32Array([...kFeatures, ...mFeatures, ...mAngleFeatures].slice(0, 64));

    return {
      rawVector,
      metadata: {
        holdTimes,
        flightTimes,
        holdTimesZ: zNormalize(holdTimes),
        flightTimesZ: zNormalize(flightTimes),
        mousePoints: [...this.mousePoints]
      }
    };
  }

  static calculateSimilarity(live: any, enrolled: any): number {
    const hpScore = pearsonCorrelation(live.holdTimesZ, enrolled.holdTimesZ);
    const fpScore = pearsonCorrelation(live.flightTimesZ, enrolled.flightTimesZ);
    const hRatio = ratioSimilarity(live.holdTimes, enrolled.holdTimes);
    
    const score = ((hpScore + 1) / 2) * 0.4 + ((fpScore + 1) / 2) * 0.3 + hRatio * 0.3;
    return Math.max(0, Math.min(1, score));
  }
}
