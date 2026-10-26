/**
 * Python's built-in round() uses round-half-to-even. Using it here keeps the
 * reconstructed wireframe projection faithful to the original 1991 notes.
 */
export function pyRound(value: number): number {
  const lower = Math.floor(value)
  const diff = value - lower
  if (diff > 0.5) return lower + 1
  if (diff < 0.5) return lower
  return lower % 2 === 0 ? lower : lower + 1
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function formatSeed(seed: number): string {
  return String(normalizeSeed(seed)).padStart(6, '0')
}

export function normalizeSeed(value: number): number {
  if (!Number.isFinite(value)) return 0
  const n = Math.trunc(value) % 1_000_000
  return n < 0 ? n + 1_000_000 : n
}

export function textWidth(text: string, scale = 1): number {
  return text.length === 0 ? 0 : (text.length * 6 - 1) * scale
}
