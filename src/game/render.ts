import {
  DIRS,
  FB_W,
  LEFT_OF,
  MAXD,
  NEAR_B,
  NEAR_L,
  NEAR_R,
  NEAR_T,
  RIGHT_OF,
  SHRINK,
  TH,
  TW,
  VPX,
  VPY,
  WALL_E,
  WALL_N,
  WALL_S,
  WALL_W,
  wallOf,
  type Angle,
  type Vec,
} from './constants'
import { ARROWS } from './font'
import type { Framebuffer } from './framebuffer'
import type { Maze } from './maze'
import { PAUSE_ITEMS, PAUSE_ITEM_ENABLED, titleItems } from './menu'
import type { Player } from './player'
import { formatSeed, pyRound, textWidth } from './util'

const MENU_TEXT_X = 24
const MENU_BAR_X = 18
const MENU_BAR_W = 65
const MENU_BAR_H = 10

function drawMenu(
  fb: Framebuffer,
  items: readonly string[],
  selected: number,
  enabled: readonly boolean[],
  startY: number,
  spacing = 10,
): void {
  for (let index = 0; index < items.length; index += 1) {
    const y = startY + index * spacing
    const isEnabled = enabled[index] ?? false
    const isSelected = index === selected && isEnabled

    if (isSelected) {
      fb.fillRect(
        MENU_BAR_X,
        y - 2,
        MENU_BAR_X + MENU_BAR_W - 1,
        y - 2 + MENU_BAR_H - 1,
      )
      fb.text(MENU_TEXT_X, y, items[index], 1, 0)
    } else {
      fb.text(MENU_TEXT_X, y, items[index], 1, 1, !isEnabled)
    }
  }
}

export function drawTitle(
  fb: Framebuffer,
  seed: number,
  selected: number,
  hasSave: boolean,
): void {
  fb.textC(4, 'X MAZE X')
  fb.textC(15, 'LABYRINTH 1991')
  drawMenu(fb, titleItems(hasSave), selected, [true, true, true], 27)
  fb.textC(56, `SEED ${formatSeed(seed)}`)
}

export function drawPause(fb: Framebuffer, selected: number): void {
  fb.textC(6, 'PAUSED')
  drawMenu(fb, PAUSE_ITEMS, selected, PAUSE_ITEM_ENABLED, 22)
}

export function drawMap(
  fb: Framebuffer,
  maze: Maze,
  player: Player,
  blinkOn: boolean,
  backToTitle: boolean,
): void {
  fb.text(2, 1, 'MAP')
  const action = backToTitle ? 'EXE=PLAY' : 'EXE=BACK'
  fb.text(FB_W - 2 - textWidth(action), 1, action)

  const originX = 8
  const originY = 9

  for (let wi = 0; wi < 20; wi += 1) {
    for (let zi = 0; zi < 18; zi += 1) {
      const w = 2 + wi
      const z = 2 + zi
      const x = originX + wi * 4
      const y = originY + zi * 3
      const walls = maze.walls[w][z]

      if ((walls & WALL_N) !== 0) fb.line(x, y, x + 3, y)
      if ((walls & WALL_W) !== 0) fb.line(x, y, x, y + 2)
      if (wi === 19 && (walls & WALL_E) !== 0) fb.line(x + 3, y, x + 3, y + 2)
      if (zi === 17 && (walls & WALL_S) !== 0) fb.line(x, y + 2, x + 3, y + 2)
    }
  }

  const chevron = ['#..', '.#.', '#..']
  const chevrons: Array<[number, number]> = [
    [maze.entryZ, originX - 6],
    [maze.exitZ, originX + 81],
  ]
  for (const [z, x0] of chevrons) {
    const y0 = originY + (z - 2) * 3
    for (let row = 0; row < chevron.length; row += 1) {
      for (let column = 0; column < chevron[row].length; column += 1) {
        if (chevron[row][column] === '#') {
          fb.px(x0 + column, y0 + row)
        }
      }
    }
  }

  let markerX: number
  let markerY: number
  if (player.w < 2) {
    markerX = originX - 5
    markerY = originY + (player.z - 2) * 3 + 1
  } else if (player.w > 21) {
    markerX = originX + 82
    markerY = originY + (player.z - 2) * 3 + 1
  } else {
    markerX = originX + (player.w - 2) * 4 + 1
    markerY = originY + (player.z - 2) * 3 + 1
  }

  if (blinkOn) {
    for (let dy = 0; dy < 2; dy += 1) {
      for (let dx = 0; dx < 2; dx += 1) {
        fb.px(markerX + dx, markerY + dy)
      }
    }
  }
}

export function drawWin(fb: Framebuffer, seed: number): void {
  fb.rect(2, 2, 93, 61)
  fb.textC(20, 'YOU WIN', 2)
  fb.textC(44, '1091 STEPS')
  fb.textC(53, `SEED ${formatSeed(seed)}`)
}

export function drawArrow(fb: Framebuffer, angle: Angle): void {
  const pattern = ARROWS[angle]
  const originX = 88
  const originY = 4
  for (let row = 0; row < pattern.length; row += 1) {
    for (let column = 0; column < pattern[row].length; column += 1) {
      if (pattern[row][column] === '#') {
        fb.px(originX + column, originY + row)
      }
    }
  }
}

/**
 * Depth index of the corridor's own front wall, or MAXD when the corridor runs
 * past the farthest frame.
 */
function corridorReach(
  walls: number[][],
  playerW: number,
  playerZ: number,
  forward: Vec,
): number {
  for (let step = 0; step < MAXD; step += 1) {
    const w = playerW + forward[0] * step
    const z = playerZ + forward[1] * step
    if (w < 0 || w >= TW || z < 0 || z >= TH) break
    if ((walls[w][z] & wallOf(forward)) !== 0) return step + 1
  }
  return MAXD
}

/** Forward index of the last cell of the opening that starts at `from`. */
function openRunEnd(
  walls: number[][],
  cw: number,
  cz: number,
  side: Vec,
  forward: Vec,
  from: number,
): number {
  let last = from
  for (let index = from + 1; index < MAXD; index += 1) {
    const w = cw + forward[0] * (index - from)
    const z = cz + forward[1] * (index - from)
    if (w < 0 || w >= TW || z < 0 || z >= TH) break
    if ((walls[w][z] & wallOf(side)) !== 0) break
    last = index
  }
  return last
}

/**
 * Draw the front-facing wall at the back of a side opening, if one is in view.
 *
 * Faces follow one rule: a face is drawn unless it sits past the corridor's own
 * front wall, where it would be painted inside that wall. Side faces are found
 * by walking the column beside the opening, and the strip is drawn from the
 * near edge of the opening, so it never crosses the side walls in front of it.
 */
function drawSideFace(
  fb: Framebuffer,
  rects: ReadonlyArray<readonly [number, number, number, number]>,
  walls: number[][],
  cw: number,
  cz: number,
  side: Vec,
  forward: Vec,
  from: number,
  corridorEnd: number,
  onLeft: boolean,
): void {
  const lastOpen = openRunEnd(walls, cw, cz, side, forward, from)
  const sw = cw + side[0]
  const sz = cz + side[1]
  // The far edge of the opening. Anything past it is behind the side wall that
  // ends the opening, so a deeper face is cut off at this line.
  const cutoff = rects[lastOpen + 1]
  const cutoffX = onLeft ? cutoff[0] : cutoff[2]

  for (let ahead = 0; from + ahead < MAXD; ahead += 1) {
    const wj = sw + forward[0] * ahead
    const zj = sz + forward[1] * ahead
    if (wj < 0 || wj >= TW || zj < 0 || zj >= TH) return
    if ((walls[wj][zj] & wallOf(forward)) === 0) continue

    const faceDepth = from + ahead + 1
    if (faceDepth > corridorEnd) return

    const face = rects[faceDepth]
    const corner = onLeft ? face[0] : face[2]
    const edge = onLeft
      ? Math.min(corner, cutoffX)
      : Math.max(corner, cutoffX)
    const start =
      from === 0
        ? onLeft
          ? 0
          : FB_W - 1
        : onLeft
          ? rects[from][0]
          : rects[from][2]

    fb.line(start, face[1], edge, face[1])
    fb.line(start, face[3], edge, face[3])
    // Only a face that ends inside the opening shows its own vertical corner;
    // a cut-off one is closed by the side wall at the opening's far edge.
    if (edge === corner) fb.line(corner, face[1], corner, face[3])
    return
  }
}

export function draw3D(
  fb: Framebuffer,
  maze: Maze,
  playerW: number,
  playerZ: number,
  angle: Angle,
): void {
  const rects: Array<[number, number, number, number]> = []
  for (let depth = 0; depth <= MAXD; depth += 1) {
    const scale = SHRINK ** depth
    rects.push([
      pyRound(VPX + (NEAR_L - VPX) * scale),
      pyRound(VPY + (NEAR_T - VPY) * scale),
      pyRound(VPX + (NEAR_R - VPX) * scale),
      pyRound(VPY + (NEAR_B - VPY) * scale),
    ])
  }

  const forward = DIRS[angle]
  const left = LEFT_OF[angle]
  const right = RIGHT_OF[angle]
  const corridorEnd = corridorReach(maze.walls, playerW, playerZ, forward)

  let cw = playerW
  let cz = playerZ
  let leftOpenFrom: number | null = null
  let rightOpenFrom: number | null = null

  for (let depth = 0; depth < MAXD; depth += 1) {
    if (cw < 0 || cw >= TW || cz < 0 || cz >= TH) return

    const currentWalls = maze.walls[cw][cz]
    const current = rects[depth]
    const next = rects[depth + 1]
    const [left0, top0, right0, bottom0] = current
    const [left1, top1, right1, bottom1] = next

    if ((currentWalls & wallOf(left)) !== 0) {
      leftOpenFrom = null
      fb.line(left0, top0, left1, top1)
      fb.line(left0, bottom0, left1, bottom1)
      fb.line(left0, top0, left0, bottom0)
      fb.line(left1, top1, left1, bottom1)
    } else {
      if (leftOpenFrom === null) leftOpenFrom = depth
      if (leftOpenFrom === depth) {
        drawSideFace(
          fb,
          rects,
          maze.walls,
          cw,
          cz,
          left,
          forward,
          depth,
          corridorEnd,
          true,
        )
      }
    }

    if ((currentWalls & wallOf(right)) !== 0) {
      rightOpenFrom = null
      fb.line(right0, top0, right1, top1)
      fb.line(right0, bottom0, right1, bottom1)
      fb.line(right0, top0, right0, bottom0)
      fb.line(right1, top1, right1, bottom1)
    } else {
      if (rightOpenFrom === null) rightOpenFrom = depth
      if (rightOpenFrom === depth) {
        drawSideFace(
          fb,
          rects,
          maze.walls,
          cw,
          cz,
          right,
          forward,
          depth,
          corridorEnd,
          false,
        )
      }
    }

    if ((currentWalls & wallOf(forward)) !== 0) {
      fb.rect(left1, top1, right1, bottom1)
      return
    }

    cw += forward[0]
    cz += forward[1]
  }
}
