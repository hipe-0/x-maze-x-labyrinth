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

/**
 * Whether the front-facing wall of a side alcove is actually in view.
 * `forwardIndex` counts cells ahead of the player: a wall in the first one sits
 * level with the player, outside the projection, and a wall past the corridor's
 * own front wall can only be drawn inside that front face. The 1991 renderer
 * drew both, which smeared stray wireframe across the walls in front.
 */
function alcoveInView(forwardIndex: number, corridorEnd: number): boolean {
  return forwardIndex > 0 && forwardIndex < corridorEnd
}

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

  // Depth index of the corridor's own front wall, or MAXD when the corridor
  // runs past the farthest frame. A side alcove deeper than this is hidden
  // behind that wall, so drawing it would put wireframe inside the wall face.
  let corridorEnd = MAXD
  for (let step = 0; step < MAXD; step += 1) {
    const w = playerW + forward[0] * step
    const z = playerZ + forward[1] * step
    if (w < 0 || w >= TW || z < 0 || z >= TH) break
    if ((maze.walls[w][z] & wallOf(forward)) !== 0) {
      corridorEnd = step + 1
      break
    }
  }

  let cw = playerW
  let cz = playerZ
  let leftBlocked = false
  let rightBlocked = false

  for (let depth = 0; depth < MAXD; depth += 1) {
    if (cw < 0 || cw >= TW || cz < 0 || cz >= TH) return

    const currentWalls = maze.walls[cw][cz]
    const current = rects[depth]
    const next = rects[depth + 1]
    const [left0, top0, right0, bottom0] = current
    const [left1, top1, right1, bottom1] = next

    if ((currentWalls & wallOf(left)) !== 0) {
      leftBlocked = true
      fb.line(left0, top0, left1, top1)
      fb.line(left0, bottom0, left1, bottom1)
      fb.line(left0, top0, left0, bottom0)
      fb.line(left1, top1, left1, bottom1)
    } else if (!leftBlocked) {
      const nw = cw + left[0]
      const nz = cz + left[1]
      for (let ahead = 0; ahead < MAXD - depth; ahead += 1) {
        const wj = nw + forward[0] * ahead
        const zj = nz + forward[1] * ahead
        if (wj < 0 || wj >= TW || zj < 0 || zj >= TH) break
        if ((maze.walls[wj][zj] & wallOf(forward)) !== 0) {
          if (!alcoveInView(depth + ahead, corridorEnd)) break
          const frame = rects[depth + 1 + ahead]
          fb.line(0, frame[1], frame[0], frame[1])
          fb.line(0, frame[3], frame[0], frame[3])
          fb.line(frame[0], frame[1], frame[0], frame[3])
          break
        }
      }
    }

    if ((currentWalls & wallOf(right)) !== 0) {
      rightBlocked = true
      fb.line(right0, top0, right1, top1)
      fb.line(right0, bottom0, right1, bottom1)
      fb.line(right0, top0, right0, bottom0)
      fb.line(right1, top1, right1, bottom1)
    } else if (!rightBlocked) {
      const nw = cw + right[0]
      const nz = cz + right[1]
      for (let ahead = 0; ahead < MAXD - depth; ahead += 1) {
        const wj = nw + forward[0] * ahead
        const zj = nz + forward[1] * ahead
        if (wj < 0 || wj >= TW || zj < 0 || zj >= TH) break
        if ((maze.walls[wj][zj] & wallOf(forward)) !== 0) {
          if (!alcoveInView(depth + ahead, corridorEnd)) break
          const frame = rects[depth + 1 + ahead]
          fb.line(frame[2], frame[1], FB_W - 1, frame[1])
          fb.line(frame[2], frame[3], FB_W - 1, frame[3])
          fb.line(frame[2], frame[1], frame[2], frame[3])
          break
        }
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
