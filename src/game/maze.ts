import {
  ALL_WALLS,
  DIRS,
  ENTRY_W,
  EXIT_W,
  PW0,
  PW1,
  PZ0,
  PZ1,
  TH,
  TW,
  oppositeWall,
  wallOf,
  type Angle,
} from './constants'
import { choice, mulberry32, randInt, type Rng } from './rng'

export interface MazeSnapshot {
  walls: number[][]
  entryZ: number
  exitZ: number
}

function cellKey(w: number, z: number): number {
  return w * TH + z
}

export class Maze {
  readonly walls: number[][]
  readonly entryZ: number
  readonly exitZ: number

  constructor(seed: number, snapshot?: MazeSnapshot) {
    if (snapshot) {
      this.walls = snapshot.walls.map((row) => row.slice())
      this.entryZ = snapshot.entryZ
      this.exitZ = snapshot.exitZ
      return
    }

    const rng = mulberry32(seed)
    this.walls = Array.from({ length: TW }, () => Array<number>(TH).fill(ALL_WALLS))
    this.entryZ = randInt(rng, PZ0, PZ1)
    this.exitZ = randInt(rng, PZ0, PZ1)
    this.carve(rng)
    this.open(ENTRY_W, this.entryZ, PW0, this.entryZ)
    this.open(PW1, this.exitZ, EXIT_W, this.exitZ)
  }

  cloneSnapshot(): MazeSnapshot {
    return {
      walls: this.walls.map((row) => row.slice()),
      entryZ: this.entryZ,
      exitZ: this.exitZ,
    }
  }

  canMove(w: number, z: number, angle: Angle): boolean {
    if (w < 0 || w >= TW || z < 0 || z >= TH) return false
    const [dw, dz] = DIRS[angle]
    if ((this.walls[w][z] & wallOf([dw, dz])) !== 0) return false
    const nw = w + dw
    const nz = z + dz
    return nw >= 0 && nw < TW && nz >= 0 && nz < TH
  }

  /** BFS route from the west vestibule to the east exit. Used by tests. */
  path(): Array<[number, number]> | null {
    const start = cellKey(ENTRY_W, this.entryZ)
    const goal = cellKey(EXIT_W, this.exitZ)
    const previous = new Map<number, number>()
    const queue: number[] = [start]
    previous.set(start, -1)

    for (let head = 0; head < queue.length; head += 1) {
      const current = queue[head]
      if (current === goal) break
      const w = Math.floor(current / TH)
      const z = current % TH
      for (const angle of [0, 90, 180, 270] as Angle[]) {
        if (!this.canMove(w, z, angle)) continue
        const [dw, dz] = DIRS[angle]
        const next = cellKey(w + dw, z + dz)
        if (previous.has(next)) continue
        previous.set(next, current)
        queue.push(next)
      }
    }

    if (!previous.has(goal)) return null

    const route: Array<[number, number]> = []
    let current = goal
    while (current !== -1) {
      route.push([Math.floor(current / TH), current % TH])
      current = previous.get(current) ?? -1
    }
    return route.reverse()
  }

  private carve(rng: Rng): void {
    const start: [number, number] = [PW0, randInt(rng, PZ0, PZ1)]
    const seen = new Set<number>([cellKey(start[0], start[1])])
    const stack: Array<[number, number]> = [start]

    while (stack.length > 0) {
      const [w, z] = stack[stack.length - 1]
      const options: Array<[number, number]> = []

      for (const [dw, dz] of Object.values(DIRS)) {
        const tw = w + dw
        const tz = z + dz
        if (tw < PW0 || tw > PW1 || tz < PZ0 || tz > PZ1) continue
        if (seen.has(cellKey(tw, tz))) continue
        options.push([tw, tz])
      }

      if (options.length === 0) {
        stack.pop()
        continue
      }

      const [tw, tz] = choice(rng, options)
      this.open(w, z, tw, tz)
      seen.add(cellKey(tw, tz))
      stack.push([tw, tz])
    }
  }

  private open(w: number, z: number, tw: number, tz: number): void {
    if (w < 0 || w >= TW || z < 0 || z >= TH) return
    if (tw < 0 || tw >= TW || tz < 0 || tz >= TH) return
    const bit = wallOf([tw - w, tz - z])
    if (bit === 0) return
    this.walls[w][z] &= ~bit
    this.walls[tw][tz] &= ~oppositeWall(bit)
  }
}
