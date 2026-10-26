import {
  DIRS,
  ENTRY_W,
  EXIT_W,
  PZ0,
  PZ1,
  TH,
  TW,
  angleForDelta,
  isAngle,
  type Angle,
} from './constants'
import type { Framebuffer } from './framebuffer'
import { Maze, type MazeSnapshot } from './maze'
import { PAUSE_ITEMS, titleItems } from './menu'
import { Player } from './player'
import { draw3D, drawArrow, drawMap, drawPause, drawTitle, drawWin } from './render'
import { randomSeed } from './rng'
import { formatSeed, normalizeSeed } from './util'

export type Screen = 'TITLE' | 'PLAY' | 'PAUSE' | 'MAP' | 'WIN'
export type Action = 'up' | 'down' | 'left' | 'right' | 'select'
export type GameEvent = 'blocked' | 'win'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface GameOptions {
  storage?: StorageLike
  initialSeed?: number
  now?: () => number
  /** Start immediately from a shared seed, bypassing the title screen. */
  startSeed?: number
}

interface SavedPlayer {
  w: number
  z: number
  angle: Angle
}

interface SaveData {
  version: number
  seed: number
  maze: MazeSnapshot
  player: SavedPlayer
}

const SAVE_KEY = 'xmazex.save.v1'
const SAVE_VERSION = 1
const REPEAT_DELAY = 280
const REPEAT_INTERVAL = 110
const MENU_REPEAT_DELAY = 360
const MENU_REPEAT_INTERVAL = 140
const WIN_HOLD_MS = 2600

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isSaveData(value: unknown): value is SaveData {
  if (!isRecord(value)) return false
  if (value.version !== SAVE_VERSION) return false
  if (!Number.isInteger(value.seed)) return false
  const seed = value.seed as number
  if (seed < 0 || seed >= 1_000_000) return false

  if (!isRecord(value.maze)) return false
  const maze = value.maze
  if (!Array.isArray(maze.walls) || maze.walls.length !== TW) return false
  if (
    !maze.walls.every(
      (row) =>
        Array.isArray(row) &&
        row.length === TH &&
        row.every(
          (cell) => Number.isInteger(cell) && cell >= 0 && cell <= 15,
        ),
    )
  ) {
    return false
  }
  if (!Number.isInteger(maze.entryZ) || !Number.isInteger(maze.exitZ)) {
    return false
  }
  const entryZ = maze.entryZ as number
  const exitZ = maze.exitZ as number
  if (entryZ < PZ0 || entryZ > PZ1 || exitZ < PZ0 || exitZ > PZ1) {
    return false
  }

  if (!isRecord(value.player)) return false
  const player = value.player
  if (!Number.isInteger(player.w) || !Number.isInteger(player.z)) return false
  const playerW = player.w as number
  const playerZ = player.z as number
  if (playerW < ENTRY_W || playerW >= EXIT_W) return false
  if (playerZ < PZ0 || playerZ > PZ1) return false
  return isAngle(typeof player.angle === 'number' ? player.angle : -1)
}

function createMemoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

function defaultStorage(): StorageLike {
  try {
    if (typeof localStorage !== 'undefined') return localStorage
  } catch {
    // Accessing localStorage can throw in restricted browser contexts.
  }
  return createMemoryStorage()
}

export class Game {
  readonly storage: StorageLike
  readonly now: () => number

  seed: number
  maze: Maze
  player: Player
  screen: Screen = 'TITLE'
  titleIndex = 0
  pauseIndex = 0
  mapReturn: 'TITLE' | 'PAUSE' = 'TITLE'
  hasSave = false
  winStartedAt = 0
  private onEvent?: (event: GameEvent) => void

  private readonly active = new Set<Action>()
  private readonly nextRepeat = new Map<Action, number>()

  constructor(options: GameOptions = {}) {
    this.storage = options.storage ?? defaultStorage()
    this.now = options.now ?? (() => performance.now())

    const save = this.loadSave()
    if (save) {
      this.seed = save.seed
      this.maze = new Maze(save.seed, save.maze)
      this.player = new Player(save.player.w, save.player.z, save.player.angle)
      this.hasSave = true
      this.titleIndex = 2
    } else {
      this.seed = normalizeSeed(options.initialSeed ?? randomSeed())
      this.maze = new Maze(this.seed)
      this.player = new Player(ENTRY_W, this.maze.entryZ, 0)
      this.hasSave = false
    }

    if (options.startSeed !== undefined) {
      this.startSeed(options.startSeed)
    }
  }

  seedLabel(): string {
    return formatSeed(this.seed)
  }

  setEventListener(listener?: (event: GameEvent) => void): void {
    this.onEvent = listener
  }

  /** Start the exact maze requested by a share link. */
  startSeed(seed: number): void {
    this.seed = normalizeSeed(seed)
    this.maze = new Maze(this.seed)
    this.player = new Player(ENTRY_W, this.maze.entryZ, 0)
    this.hasSave = true
    this.screen = 'PLAY'
    this.clearInput()
    this.save()
  }

  startNewMaze(): void {
    this.startSeed(randomSeed())
  }

  startPlay(): void {
    if (this.player.w >= EXIT_W) {
      this.player = new Player(ENTRY_W, this.maze.entryZ, 0)
    }
    this.hasSave = true
    this.save()
    this.screen = 'PLAY'
    this.clearInput()
  }

  continueGame(): void {
    if (!this.hasSave) return
    this.screen = 'PLAY'
    this.clearInput()
  }

  pause(): void {
    if (this.screen !== 'PLAY') return
    this.screen = 'PAUSE'
    this.pauseIndex = 0
    this.save()
    this.clearInput()
  }

  resume(): void {
    if (this.screen !== 'PAUSE') return
    this.screen = 'PLAY'
    this.clearInput()
  }

  showMap(returnTo: 'TITLE' | 'PAUSE'): void {
    this.mapReturn = returnTo
    this.screen = 'MAP'
    this.clearInput()
  }

  returnToTitle(): void {
    if (this.hasSave) this.save()
    this.screen = 'TITLE'
    this.titleIndex = this.hasSave ? 2 : 0
    this.clearInput()
  }

  back(): void {
    if (this.screen === 'PLAY') {
      this.pause()
    } else if (this.screen === 'PAUSE') {
      this.resume()
    } else if (this.screen === 'MAP') {
      if (this.mapReturn === 'TITLE') {
        this.returnToTitle()
      } else {
        this.screen = 'PAUSE'
        this.pauseIndex = 0
        this.clearInput()
      }
    } else if (this.screen === 'WIN') {
      this.returnToTitle()
    }
  }

  keyDown(action: Action): void {
    if (this.active.has(action)) return
    this.active.add(action)

    const now = this.now()
    const delay =
      this.screen === 'TITLE' || this.screen === 'PAUSE'
        ? MENU_REPEAT_DELAY
        : REPEAT_DELAY
    this.nextRepeat.set(action, now + delay)
    this.handleAction(action)
  }

  keyUp(action: Action): void {
    this.active.delete(action)
    this.nextRepeat.delete(action)
  }

  clearInput(): void {
    this.active.clear()
    this.nextRepeat.clear()
  }

  update(now: number): void {
    if (this.screen === 'WIN' && now - this.winStartedAt > WIN_HOLD_MS) {
      this.returnToTitle()
    }

    for (const action of Array.from(this.active)) {
      if (action === 'select') continue
      const next = this.nextRepeat.get(action)
      if (next === undefined || now < next) continue

      if (this.screen === 'PLAY') {
        this.handlePlayAction(action)
      } else if (this.screen === 'TITLE' || this.screen === 'PAUSE') {
        if (action === 'up') this.moveMenu(-1)
        else if (action === 'down') this.moveMenu(1)
      }

      if (!this.active.has(action)) continue
      const interval =
        this.screen === 'TITLE' || this.screen === 'PAUSE'
          ? MENU_REPEAT_INTERVAL
          : REPEAT_INTERVAL
      this.nextRepeat.set(action, now + interval)
    }
  }

  render(framebuffer: Framebuffer, now: number): void {
    framebuffer.clear()

    if (this.screen === 'TITLE') {
      drawTitle(framebuffer, this.seed, this.titleIndex, this.hasSave)
    } else if (this.screen === 'PLAY') {
      draw3D(
        framebuffer,
        this.maze,
        this.player.w,
        this.player.z,
        this.player.angle,
      )
      drawArrow(framebuffer, this.player.angle)
    } else if (this.screen === 'PAUSE') {
      drawPause(framebuffer, this.pauseIndex)
    } else if (this.screen === 'MAP') {
      drawMap(
        framebuffer,
        this.maze,
        this.player,
        Math.floor(now / 400) % 2 === 0,
        this.mapReturn === 'TITLE',
      )
    } else if (this.screen === 'WIN') {
      drawWin(framebuffer, this.seed)
    }
  }

  isInverted(now: number): boolean {
    if (this.screen !== 'WIN') return false
    const elapsed = now - this.winStartedAt
    return elapsed >= 0 && elapsed < 720 && Math.floor(elapsed / 180) % 2 === 0
  }

  save(): void {
    if (!this.hasSave) return
    const data: SaveData = {
      version: SAVE_VERSION,
      seed: this.seed,
      maze: this.maze.cloneSnapshot(),
      player: {
        w: this.player.w,
        z: this.player.z,
        angle: this.player.angle,
      },
    }
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(data))
    } catch {
      // A full or disabled localStorage should never break the game.
    }
  }

  clearSave(): void {
    this.hasSave = false
    try {
      this.storage.removeItem(SAVE_KEY)
    } catch {
      // Ignore storage failures.
    }
  }

  private loadSave(): SaveData | null {
    try {
      const raw = this.storage.getItem(SAVE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      if (!isSaveData(parsed)) {
        try {
          this.storage.removeItem(SAVE_KEY)
        } catch {
          // Ignore storage failures.
        }
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  private handleAction(action: Action): void {
    if (action === 'select') {
      this.confirm()
      return
    }

    if (this.screen === 'TITLE' || this.screen === 'PAUSE') {
      if (action === 'up') this.moveMenu(-1)
      else if (action === 'down') this.moveMenu(1)
      return
    }

    if (this.screen === 'PLAY') {
      this.handlePlayAction(action)
    }
  }

  private handlePlayAction(action: Action): void {
    if (action === 'up') {
      this.tryMove(1)
    } else if (action === 'down') {
      this.tryMove(-1)
    } else if (action === 'left') {
      this.player.turn(90)
      this.save()
    } else if (action === 'right') {
      this.player.turn(-90)
      this.save()
    }
  }

  private tryMove(distance: 1 | -1): void {
    const forward = DIRS[this.player.angle]
    const dx = forward[0] * distance
    const dz = forward[1] * distance
    const targetAngle = angleForDelta(dx, dz)

    if (!this.maze.canMove(this.player.w, this.player.z, targetAngle)) {
      this.onEvent?.('blocked')
      return
    }

    this.player.w += dx
    this.player.z += dz

    if (this.player.w >= EXIT_W) {
      this.screen = 'WIN'
      this.winStartedAt = this.now()
      this.clearSave()
      this.clearInput()
      this.onEvent?.('win')
      return
    }

    this.save()
  }

  private confirm(): void {
    if (this.screen === 'PLAY') {
      this.pause()
      return
    }

    if (this.screen === 'TITLE') {
      if (this.titleIndex === 0) this.startNewMaze()
      else if (this.titleIndex === 1) this.showMap('TITLE')
      else if (this.titleIndex === 2) {
        if (this.hasSave) this.continueGame()
        else this.startPlay()
      }
      return
    }

    if (this.screen === 'PAUSE') {
      if (this.pauseIndex === 0) this.resume()
      else if (this.pauseIndex === 1) this.showMap('PAUSE')
      else if (this.pauseIndex === 2) this.startNewMaze()
      else if (this.pauseIndex === 3) this.returnToTitle()
      return
    }

    if (this.screen === 'MAP') {
      if (this.mapReturn === 'TITLE') {
        this.startPlay()
      } else {
        this.screen = 'PAUSE'
        this.pauseIndex = 0
        this.clearInput()
      }
      return
    }

    if (this.screen === 'WIN') {
      this.returnToTitle()
    }
  }

  private menuEnabled(): readonly boolean[] {
    if (this.screen === 'TITLE') return [true, true, true]
    if (this.screen === 'PAUSE') return [true, true, true, true]
    return []
  }

  private currentMenuIndex(): number {
    return this.screen === 'TITLE' ? this.titleIndex : this.pauseIndex
  }

  private setMenuIndex(index: number): void {
    if (this.screen === 'TITLE') this.titleIndex = index
    else if (this.screen === 'PAUSE') this.pauseIndex = index
  }

  private moveMenu(delta: number): void {
    const items =
      this.screen === 'TITLE'
        ? titleItems(this.hasSave)
        : this.screen === 'PAUSE'
          ? PAUSE_ITEMS
          : null
    if (!items) return

    const enabled = this.menuEnabled()
    let index = this.currentMenuIndex()
    for (let step = 0; step < items.length; step += 1) {
      index = (index + delta + items.length) % items.length
      if (enabled[index]) {
        this.setMenuIndex(index)
        return
      }
    }
  }
}
