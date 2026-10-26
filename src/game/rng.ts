export type Rng = () => number

/** Small, fast, deterministic PRNG. The same seed always rebuilds the maze. */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randInt(rng: Rng, min: number, maxInclusive: number): number {
  return min + Math.floor(rng() * (maxInclusive - min + 1))
}

export function choice<T>(rng: Rng, values: readonly T[]): T {
  return values[Math.floor(rng() * values.length)] as T
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}
