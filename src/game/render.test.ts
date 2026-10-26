import { describe, expect, it } from 'vitest'
import {
  ALL_WALLS,
  DIRS,
  FB_W,
  MAXD,
  NEAR_B,
  NEAR_L,
  NEAR_R,
  NEAR_T,
  SHRINK,
  TH,
  TW,
  VPX,
  VPY,
  wallOf,
  type Angle,
} from './constants'
import { Framebuffer } from './framebuffer'
import { Maze } from './maze'
import { draw3D } from './render'
import { pyRound } from './util'

const SEEDS = [0, 1, 7, 42, 1991, 123456]
const ANGLES: Angle[] = [0, 90, 180, 270]

type Link = [number, number, number, number]

/** Every cell solid, then carve the listed connections. */
function carve(links: Link[]): number[][] {
  const walls: number[][] = Array.from({ length: TW }, () =>
    Array<number>(TH).fill(ALL_WALLS),
  )
  for (const [w, z, tw, tz] of links) {
    walls[w][z] &= ~wallOf([tw - w, tz - z])
    walls[tw][tz] &= ~wallOf([w - tw, z - tz])
  }
  return walls
}

/** A straight corridor of `length` cells starting at (w, z) heading east. */
function corridor(w: number, z: number, length: number): Link[] {
  const links: Link[] = []
  for (let step = 0; step < length; step += 1) {
    links.push([w + step, z, w + step + 1, z])
  }
  return links
}

function renderFrame(walls: number[][], w: number, z: number): Framebuffer {
  const maze = new Maze(0, { walls, entryZ: z, exitZ: z })
  const fb = new Framebuffer()
  fb.clear()
  draw3D(fb, maze, w, z, 0)
  return fb
}

/** The projected frame at a depth index, mirrored from the renderer. */
function frame(depth: number): [number, number, number, number] {
  const scale = SHRINK ** depth
  return [
    pyRound(VPX + (NEAR_L - VPX) * scale),
    pyRound(VPY + (NEAR_T - VPY) * scale),
    pyRound(VPX + (NEAR_R - VPX) * scale),
    pyRound(VPY + (NEAR_B - VPY) * scale),
  ]
}

function inkAt(fb: Framebuffer, x: number, y: number): boolean {
  return fb.pixels[y * FB_W + x] !== 0
}

/** Pixels strictly inside a front-facing wall, which must stay hollow. */
function interiorInk(fb: Framebuffer, rect: [number, number, number, number]) {
  const found: Array<[number, number]> = []
  for (let y = rect[1] + 1; y < rect[3]; y += 1) {
    for (let x = rect[0] + 1; x < rect[2]; x += 1) {
      if (inkAt(fb, x, y)) found.push([x, y])
    }
  }
  return found
}

/** Depth index of the corridor's own front wall, or MAXD when it is open. */
function corridorEnd(
  walls: number[][],
  w: number,
  z: number,
  angle: Angle,
): number {
  const forward = DIRS[angle]
  for (let step = 0; step < MAXD; step += 1) {
    const cw = w + forward[0] * step
    const cz = z + forward[1] * step
    if (cw < 0 || cw >= TW || cz < 0 || cz >= TH) return MAXD
    if ((walls[cw][cz] & wallOf(forward)) !== 0) return step + 1
  }
  return MAXD
}

describe('draw3D side faces', () => {
  it('draws a wall at distance 0.5 beside an open corridor side', () => {
    // A niche beside the player: its far wall is level with the far side of the
    // player's own cell, so it continues the wall face out to the screen edge.
    const walls = carve([...corridor(5, 5, 6), [5, 4, 5, 5]])
    const fb = renderFrame(walls, 5, 5)
    const face = frame(1)

    expect(inkAt(fb, 0, face[1])).toBe(true)
    expect(inkAt(fb, 0, face[3])).toBe(true)
    expect(inkAt(fb, face[0], face[1])).toBe(true)
  })

  it('still draws that wall from one cell back', () => {
    // Same wall seen from the cell before, so it must not pop in on arrival.
    // The opening now starts ahead of the player, so the strip is narrower.
    const walls = carve([...corridor(3, 5, 8), [5, 4, 5, 5]])
    const fb = renderFrame(walls, 4, 5)
    const face = frame(2)

    // The strip spans the opening's near edge to the face, one frame band.
    for (let x = frame(1)[0] + 1; x < face[0]; x += 1) {
      expect(inkAt(fb, x, face[1])).toBe(true)
      expect(inkAt(fb, x, face[3])).toBe(true)
    }
  })

  it('draws a face from every cell of the opening, on both sides', () => {
    // Opening spans the player's cell and the one ahead on both sides. Each of
    // those cells closes off at its own depth, so the wall steps outward:
    // screen edge -> frame 1 -> frame 2, matching the corridor's front wall.
    const walls = carve([
      [4, 5, 5, 5],
      [5, 5, 6, 5],
      [5, 5, 5, 6],
      [6, 5, 6, 6],
      [5, 4, 5, 5],
      [6, 4, 6, 5],
    ])

    const fb = renderFrame(walls, 5, 5)
    const near = frame(1)
    const far = frame(2)

    for (const y of [near[1], near[3]]) {
      expect(inkAt(fb, 0, y)).toBe(true)
      expect(inkAt(fb, FB_W - 1, y)).toBe(true)
    }
    for (const y of [far[1], far[3]]) {
      expect(inkAt(fb, near[0] + 2, y)).toBe(true)
      expect(inkAt(fb, near[2] - 2, y)).toBe(true)
    }
    expect(interiorInk(fb, far)).toEqual([])
  })

  it('draws both far side faces when the opening starts at the player', () => {
    // The irregular case: the opening begins at the player's cell, so a scan
    // driven by the opening's first cell would stop at the near face and never
    // reach the one beside the next cell.
    const walls = carve([
      [4, 5, 5, 5],
      [5, 5, 6, 5],
      [5, 4, 5, 5],
      [6, 4, 6, 5],
      [5, 5, 5, 6],
      [6, 5, 6, 6],
    ])

    const fb = renderFrame(walls, 5, 5)
    const far = frame(2)

    expect(inkAt(fb, frame(1)[0] + 2, far[1])).toBe(true)
    expect(inkAt(fb, frame(1)[2] - 2, far[1])).toBe(true)
    expect(inkAt(fb, frame(1)[0] + 2, far[3])).toBe(true)
    expect(inkAt(fb, frame(1)[2] - 2, far[3])).toBe(true)
  })


  it('leaves out a front-facing wall past the corridor end', () => {
    // Corridor ends three cells ahead. The left alcove's far wall sits one
    // cell deeper, hidden behind the corridor's own front face.
    const walls = carve([
      ...corridor(5, 5, 2),
      [5, 4, 5, 5],
      [6, 4, 6, 5],
      [5, 4, 6, 4],
      [6, 4, 7, 4],
      [7, 4, 8, 4],
    ])

    const fb = renderFrame(walls, 5, 5)
    const endWall = frame(3)

    expect(interiorInk(fb, endWall)).toEqual([])
    expect(inkAt(fb, endWall[0], endWall[1])).toBe(true)
  })

  it('keeps a front-facing wall that lines up with the corridor end', () => {
    // The alcove is as deep as the corridor end, so the two faces join into one
    // continuous wall and the side strip must still be drawn.
    const walls = carve([
      ...corridor(5, 5, 3),
      [5, 4, 5, 5],
      [6, 4, 6, 5],
      [7, 4, 7, 5],
      [8, 4, 8, 5],
      [5, 4, 6, 4],
      [6, 4, 7, 4],
      [7, 4, 8, 4],
    ])

    const fb = renderFrame(walls, 5, 5)
    const endWall = frame(4)

    expect(interiorInk(fb, endWall)).toEqual([])
    // The side strip shares the end wall's edges from the screen edge.
    expect(inkAt(fb, 0, endWall[1])).toBe(true)
    expect(inkAt(fb, 0, endWall[3])).toBe(true)
  })

  it('carries a close wide wall out to both screen edges', () => {
    // A wall one cell ahead running past the player on both sides: the two
    // side faces are coplanar with it and continue it to the screen edges.
    const walls = carve([
      [4, 5, 5, 5],
      [5, 4, 5, 5],
      [5, 5, 5, 6],
    ])

    const fb = renderFrame(walls, 5, 5)
    const endWall = frame(1)

    for (const y of [endWall[1], endWall[3]]) {
      expect(inkAt(fb, 0, y)).toBe(true)
      expect(inkAt(fb, FB_W - 1, y)).toBe(true)
    }
    expect(interiorInk(fb, endWall)).toEqual([])
  })

  it('clips a face at the far edge of its opening', () => {
    // The opening only spans the player's own cell, so the face two cells on
    // is cut off at the side wall that ends the opening instead of crossing it.
    const walls = carve([
      ...corridor(5, 5, 6),
      [5, 4, 5, 5],
      [5, 4, 6, 4],
      [6, 4, 7, 4],
    ])

    const fb = renderFrame(walls, 5, 5)
    const face = frame(3)
    const cutoff = frame(1)[0]

    expect(inkAt(fb, 0, face[1])).toBe(true)
    expect(inkAt(fb, 0, face[3])).toBe(true)
    // Nothing is drawn past the opening's far edge.
    for (let x = cutoff + 1; x < frame(2)[0]; x += 1) {
      expect(inkAt(fb, x, face[1])).toBe(false)
      expect(inkAt(fb, x, face[3])).toBe(false)
    }
  })

  it.each(SEEDS)('never nests a front face inside another for seed %i', (seed) => {
    const maze = new Maze(seed)

    for (let w = 2; w <= 21; w += 1) {
      for (let z = 2; z <= 19; z += 1) {
        for (const angle of ANGLES) {
          const end = corridorEnd(maze.walls, w, z, angle)
          if (end >= MAXD) continue

          const fb = new Framebuffer()
          fb.clear()
          draw3D(fb, maze, w, z, angle)
          expect(interiorInk(fb, frame(end))).toEqual([])
        }
      }
    }
  })
})
