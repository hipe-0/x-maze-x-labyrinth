import { describe, expect, it } from 'vitest'
import { DIRS, type Angle } from './constants'
import { ARROWS } from './font'

const ANGLES: Angle[] = [0, 90, 180, 270]

/** Filled pixels of a glyph as [x, y] pairs in screen space. */
function pixels(pattern: readonly string[]): Array<[number, number]> {
  const points: Array<[number, number]> = []
  for (let y = 0; y < pattern.length; y += 1) {
    for (let x = 0; x < pattern[y].length; x += 1) {
      if (pattern[y][x] === '#') points.push([x, y])
    }
  }
  return points
}

/**
 * How far a pixel sits along the screen heading, so the tip of the triangle is
 * the largest depth and the flat base is the smallest.
 */
function depthOf([x, y]: [number, number], [dx, dy]: readonly [number, number]) {
  return x * dx + y * dy
}

describe('ARROWS', () => {
  it.each(ANGLES)('angle %i points along its heading', (angle) => {
    const depths = pixels(ARROWS[angle]).map((point) =>
      depthOf(point, DIRS[angle]),
    )

    const tip = Math.max(...depths)
    const base = Math.min(...depths)

    // A single pixel marks the tip, while the base spans the full arrow.
    expect(depths.filter((depth) => depth === tip)).toHaveLength(1)
    expect(depths.filter((depth) => depth === base).length).toBeGreaterThan(1)

    // Slices grow steadily from the tip back to the base: no skew or smearing.
    const widths: number[] = []
    for (let depth = tip; depth >= base; depth -= 1) {
      widths.push(depths.filter((value) => value === depth).length)
    }
    expect(widths).toEqual([...widths].sort((a, b) => a - b))
  })

  it('gives every heading a distinct arrow', () => {
    const seen = ANGLES.map((angle) => ARROWS[angle].join('\n'))
    expect(new Set(seen).size).toBe(ANGLES.length)
  })
})
