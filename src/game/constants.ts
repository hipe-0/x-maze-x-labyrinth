/** Fixed framebuffer size of the Casio FX-7500G LCD. */
export const FB_W = 96
export const FB_H = 64

/** The original ran at 30 fps, and the LCD ghosting is tied to its frames. */
export const FPS = 30
export const FRAME_MS = 1000 / FPS

export type RGB = readonly [number, number, number]

export const LCD_BG: RGB = [163, 173, 152]
export const LCD_INK: RGB = [24, 30, 24]

export const TW = 24
export const TH = 22
export const PW0 = 2
export const PW1 = 21
export const PZ0 = 2
export const PZ1 = 19
export const ENTRY_W = 1
export const EXIT_W = 22

export const WALL_N = 1
export const WALL_E = 2
export const WALL_S = 4
export const WALL_W = 8
export const ALL_WALLS = WALL_N | WALL_E | WALL_S | WALL_W

export type Angle = 0 | 90 | 180 | 270

/** A grid delta. x is west/east, y is north/south (north is negative). */
export type Vec = readonly [number, number]

export const DIRS: Record<Angle, Vec> = {
  0: [1, 0],
  90: [0, -1],
  180: [-1, 0],
  270: [0, 1],
}

export function wallOf([dx, dy]: Vec): number {
  if (dx === 1 && dy === 0) return WALL_E
  if (dx === 0 && dy === -1) return WALL_N
  if (dx === -1 && dy === 0) return WALL_W
  if (dx === 0 && dy === 1) return WALL_S
  return 0
}

export function oppositeWall(bit: number): number {
  if (bit === WALL_N) return WALL_S
  if (bit === WALL_S) return WALL_N
  if (bit === WALL_E) return WALL_W
  if (bit === WALL_W) return WALL_E
  return 0
}

export const LEFT_OF: Record<Angle, Vec> = {
  0: [0, -1],
  90: [-1, 0],
  180: [0, 1],
  270: [1, 0],
}

export const RIGHT_OF: Record<Angle, Vec> = {
  0: [0, 1],
  90: [1, 0],
  180: [0, -1],
  270: [-1, 0],
}

export function angleForDelta(dx: number, dy: number): Angle {
  if (dx === 1 && dy === 0) return 0
  if (dx === 0 && dy === -1) return 90
  if (dx === -1 && dy === 0) return 180
  if (dx === 0 && dy === 1) return 270
  throw new Error(`Invalid delta (${dx}, ${dy})`)
}

export function isAngle(value: number): value is Angle {
  return value === 0 || value === 90 || value === 180 || value === 270
}

/** Perspective constants recovered from the 1991 notes. */
export const VPX = 49
export const VPY = 15
export const NEAR_L = 2
export const NEAR_R = 96
export const NEAR_T = 0
export const NEAR_B = 54
export const SHRINK = 0.8
export const MAXD = 6
