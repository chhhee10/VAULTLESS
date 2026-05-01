/**
 * behaviouralEngine.ts
 * Owner: Chetan
 *
 * Captures keystroke and mouse micro-dynamics and produces a
 * normalised Float32Array[64] Gesture DNA vector.
 *
 * Vector layout (matches VAULTLESS_CONTEXT.md spec):
 *   [0-19]   hold times per key, normalised 0-1, padded to 20
 *   [20-39]  flight times per key, normalised 0-1, padded to 20
 *   [40-49]  z-score hold times, first 10 values
 *   [50-59]  z-score flight times, first 10 values
 *   [60]     total typing duration normalised (/ 30000)
 *   [61]     rhythm variance normalised (/ 10000)
 *   [62]     gyroscope magnitude average (0 on desktop)
 *   [63]     accelerometer magnitude average (0 on desktop)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KeyEvent {
  key: string
  downAt: number  // performance.now() timestamp
  upAt: number    // performance.now() timestamp
}

export interface MouseEvent_ {
  x: number
  y: number
  t: number
}

export interface KeystrokeDNA {
  holdTimes: number[]       // raw ms durations per keydown
  flightTimes: number[]     // ms between keyup[i] and keydown[i+1]
  holdTimesZ: number[]      // z-score normalised hold times
  flightTimesZ: number[]    // z-score normalised flight times
  totalDuration: number     // ms from first keydown to last keyup
  rhythmVariance: number    // variance of inter-key intervals
  mouseScore: number | null // optional mouse dynamics score 0-1
  rawVector: Float32Array   // the final 64-dim vector
}

// ─── Constants ───────────────────────────────────────────────────────────────

const VECTOR_SIZE = 64
const HOLD_SLOTS = 20
const FLIGHT_SLOTS = 20
const Z_HOLD_SLOTS = 10
const Z_FLIGHT_SLOTS = 10

// Max expected hold time for normalisation (ms)
const MAX_HOLD_MS = 500
// Max expected flight time for normalisation (ms)
const MAX_FLIGHT_MS = 800

// ─── Maths helpers ───────────────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function stddev(arr: number[], mu?: number): number {
  if (arr.length < 2) return 0
  const m = mu ?? mean(arr)
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length
  return Math.sqrt(variance)
}

function zScore(arr: number[]): number[] {
  const m = mean(arr)
  const s = stddev(arr, m)
  if (s === 0) return arr.map(() => 0)
  return arr.map(v => (v - m) / s)
}

function normalise(value: number, max: number): number {
  return Math.min(Math.max(value / max, 0), 1)
}

function variance(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length
}

function padOrTrim(arr: number[], length: number): number[] {
  const result = arr.slice(0, length)
  while (result.length < length) result.push(0)
  return result
}

// ─── Core: build vector from KeyEvents ───────────────────────────────────────

export function buildVector(events: KeyEvent[]): KeystrokeDNA {
  if (events.length === 0) {
    return {
      holdTimes: [],
      flightTimes: [],
      holdTimesZ: [],
      flightTimesZ: [],
      totalDuration: 0,
      rhythmVariance: 0,
      mouseScore: null,
      rawVector: new Float32Array(VECTOR_SIZE),
    }
  }

  // Hold times: how long each key was held
  const holdTimes = events.map(e => e.upAt - e.downAt)

  // Flight times: gap between consecutive keystrokes
  const flightTimes: number[] = []
  for (let i = 1; i < events.length; i++) {
    const gap = events[i].downAt - events[i - 1].upAt
    flightTimes.push(Math.max(gap, 0)) // clamp negatives (fast typists)
  }

  // Z-scores
  const holdTimesZ = zScore(holdTimes)
  const flightTimesZ = zScore(flightTimes)

  // Total duration
  const totalDuration =
    events[events.length - 1].upAt - events[0].downAt

  // Rhythm variance: variance of inter-key intervals (downAt diffs)
  const intervals: number[] = []
  for (let i = 1; i < events.length; i++) {
    intervals.push(events[i].downAt - events[i - 1].downAt)
  }
  const rhythmVariance = variance(intervals)

  // ── Assemble Float32Array[64] ──
  const vec = new Float32Array(VECTOR_SIZE)

  // [0-19] normalised hold times
  const normHold = padOrTrim(
    holdTimes.map(h => normalise(h, MAX_HOLD_MS)),
    HOLD_SLOTS
  )
  normHold.forEach((v, i) => { vec[i] = v })

  // [20-39] normalised flight times
  const normFlight = padOrTrim(
    flightTimes.map(f => normalise(f, MAX_FLIGHT_MS)),
    FLIGHT_SLOTS
  )
  normFlight.forEach((v, i) => { vec[20 + i] = v })

  // [40-49] z-score hold times (first 10)
  const zHoldPadded = padOrTrim(holdTimesZ, Z_HOLD_SLOTS)
  // Clamp z-scores to [-3, 3] then normalise to [0,1]
  zHoldPadded.forEach((v, i) => {
    vec[40 + i] = Math.min(Math.max((v + 3) / 6, 0), 1)
  })

  // [50-59] z-score flight times (first 10)
  const zFlightPadded = padOrTrim(flightTimesZ, Z_FLIGHT_SLOTS)
  zFlightPadded.forEach((v, i) => {
    vec[50 + i] = Math.min(Math.max((v + 3) / 6, 0), 1)
  })

  // [60] total typing duration normalised
  vec[60] = normalise(totalDuration, 30000)

  // [61] rhythm variance normalised
  vec[61] = normalise(rhythmVariance, 10000)

  // [62] gyroscope magnitude (0 on desktop, filled by mobile handler)
  vec[62] = 0

  // [63] accelerometer magnitude (0 on desktop, filled by mobile handler)
  vec[63] = 0

  return {
    holdTimes,
    flightTimes,
    holdTimesZ,
    flightTimesZ,
    totalDuration,
    rhythmVariance,
    mouseScore: null,
    rawVector: vec,
  }
}

// ─── Average multiple samples into one stable vector ─────────────────────────

export function averageSamples(dnas: KeystrokeDNA[]): Float32Array {
  if (dnas.length === 0) return new Float32Array(VECTOR_SIZE)

  const result = new Float32Array(VECTOR_SIZE)
  for (const dna of dnas) {
    for (let i = 0; i < VECTOR_SIZE; i++) {
      result[i] += dna.rawVector[i]
    }
  }
  for (let i = 0; i < VECTOR_SIZE; i++) {
    result[i] /= dnas.length
  }
  return result
}

// Alias used in integration points
export function buildCombinedVector(dnas: KeystrokeDNA[]): Float32Array {
  return averageSamples(dnas)
}

// ─── Mouse dynamics ───────────────────────────────────────────────────────────

export interface MouseDNA {
  avgSpeed: number    // px/ms average
  maxSpeed: number    // px/ms peak
  score: number       // 0-1 similarity placeholder (computed at enroll time)
}

export function captureMouse(events: MouseEvent_[]): MouseDNA {
  if (events.length < 2) return { avgSpeed: 0, maxSpeed: 0, score: 0 }

  const speeds: number[] = []
  for (let i = 1; i < events.length; i++) {
    const dt = events[i].t - events[i - 1].t
    if (dt <= 0) continue
    const dx = events[i].x - events[i - 1].x
    const dy = events[i].y - events[i - 1].y
    speeds.push(Math.sqrt(dx * dx + dy * dy) / dt)
  }

  const avgSpeed = mean(speeds)
  const maxSpeed = Math.max(...speeds, 0)

  return {
    avgSpeed,
    maxSpeed,
    score: 0, // filled in by scoring in authFlow
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Pearson correlation between two arrays of equal length.
 * Returns 0 if either std dev is 0.
 */
function pearsonCorr(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  const ma = mean(a.slice(0, n))
  const mb = mean(b.slice(0, n))
  const sa = stddev(a.slice(0, n), ma)
  const sb = stddev(b.slice(0, n), mb)
  if (sa === 0 || sb === 0) return 0
  let cov = 0
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb)
  }
  return cov / (n * sa * sb)
}

/**
 * Ratio similarity between two arrays.
 * For each element computes min/max ratio, returns mean.
 */
function ratioSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return 0
  let sum = 0
  let count = 0
  for (let i = 0; i < n; i++) {
    const hi = Math.max(a[i], b[i])
    const lo = Math.min(a[i], b[i])
    if (hi === 0) { sum += 1; count++; continue }
    sum += lo / hi
    count++
  }
  return count === 0 ? 0 : sum / count
}

export interface ScoreResult {
  score: number                                         // 0.0 to 1.0
  classification: 'authenticated' | 'duress' | 'rejected'
  breakdown: {
    holdShape: number
    holdMag: number
    flightShape: number
    duration: number
    mouseBlend: number
  }
  isStress: boolean
}

/**
 * scoreAuth computes biometric similarity between enrolled and live vectors.
 *
 * Weights:
 *   holdShape  (Pearson on holdTimesZ)    0.40
 *   holdMag    (ratio on holdTimes)       0.25
 *   flightShape (Pearson on flightTimesZ) 0.25
 *   duration   (min/max of duration)      0.10
 */
export function scoreAuth(enrolled: KeystrokeDNA, live: KeystrokeDNA, mouseScore?: number | null): ScoreResult {
  // Extract components from raw vector indices
  const enrollHoldZ = Array.from(enrolled.rawVector.slice(40, 50))
  const liveHoldZ   = Array.from(live.rawVector.slice(40, 50))
  const enrollFlightZ = Array.from(enrolled.rawVector.slice(50, 60))
  const liveFlightZ   = Array.from(live.rawVector.slice(50, 60))

  // Map back to absolute values for ratio comparison
  const enrollHold = enrolled.holdTimes
  const liveHold   = live.holdTimes

  const holdShape  = (pearsonCorr(enrollHoldZ, liveHoldZ) + 1) / 2     // [-1,1] → [0,1]
  const holdMag    = ratioSimilarity(enrollHold, liveHold)
  const flightShape = (pearsonCorr(enrollFlightZ, liveFlightZ) + 1) / 2
  const durSim      = Math.min(enrolled.totalDuration, live.totalDuration) /
                      Math.max(enrolled.totalDuration, live.totalDuration || 1)

  let score =
    holdShape  * 0.40 +
    holdMag    * 0.25 +
    flightShape * 0.25 +
    durSim     * 0.10

  // Mouse blend if present
  const mouseBlend = mouseScore != null
    ? score * 0.85 + mouseScore * 0.15
    : score
  score = mouseBlend

  // Stress detection: live variance > enrolled variance * 2.5
  const isStress = live.rhythmVariance > enrolled.rhythmVariance * 2.5

  // Classification
  let classification: 'authenticated' | 'duress' | 'rejected'
  if (score >= 0.70) {
    classification = 'authenticated'
  } else if (score >= 0.60 && isStress) {
    classification = 'duress'
  } else {
    classification = 'rejected'
  }

  return {
    score,
    classification,
    breakdown: { holdShape, holdMag, flightShape, duration: durSim, mouseBlend: score },
    isStress,
  }
}

// ─── KeystrokeCapturer: stateful capture class for UI integration ─────────────

export class KeystrokeCapturer {
  private events: KeyEvent[] = []
  private activeKeys: Map<string, number> = new Map()
  private mouseEvents: MouseEvent_[] = []
  private phrase: string

  constructor(phrase: string) {
    this.phrase = phrase
  }

  /**
   * Call this in onKeyDown handler.
   */
  onKeyDown(key: string, timestamp?: number): void {
    const t = timestamp ?? performance.now()
    // Only record if key not already down (avoid key-repeat events)
    if (!this.activeKeys.has(key)) {
      this.activeKeys.set(key, t)
    }
  }

  /**
   * Call this in onKeyUp handler.
   */
  onKeyUp(key: string, timestamp?: number): void {
    const t = timestamp ?? performance.now()
    const downAt = this.activeKeys.get(key)
    if (downAt !== undefined) {
      this.events.push({ key, downAt, upAt: t })
      this.activeKeys.delete(key)
    }
  }

  /**
   * Call this in onMouseMove handler.
   */
  onMouseMove(x: number, y: number, timestamp?: number): void {
    const t = timestamp ?? performance.now()
    this.mouseEvents.push({ x, y, t })
  }

  /**
   * Returns the computed DNA or null if no events recorded.
   */
  capture(): KeystrokeDNA | null {
    if (this.events.length === 0) return null
    const dna = buildVector(this.events)
    const mouse = captureMouse(this.mouseEvents)
    dna.mouseScore = mouse.avgSpeed > 0 ? Math.min(mouse.avgSpeed / 5, 1) : null
    // Inject mouse score into vector slot 62 (repurpose gyro as mouse speed)
    if (dna.mouseScore !== null) {
      dna.rawVector[62] = dna.mouseScore
    }
    return dna
  }

  /**
   * Reset for next sample.
   */
  reset(): void {
    this.events = []
    this.activeKeys = new Map()
    this.mouseEvents = []
  }

  /**
   * How many key events have been captured so far.
   */
  get eventCount(): number {
    return this.events.length
  }

  get targetPhrase(): string {
    return this.phrase
  }
}
