import { describe, expect, it, vi } from 'vitest'
import { angleForDelta } from './constants'
import { Game, type StorageLike } from './game'

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

function createGame(storage = createMemoryStorage()): Game {
  return new Game({
    storage,
    initialSeed: 1991,
    now: () => 0,
  })
}

function tap(game: Game, action: 'up' | 'down' | 'left' | 'right' | 'select') {
  game.keyDown(action)
  game.keyUp(action)
}

function walkPathToExit(game: Game): void {
  const path = game.maze.path()
  if (!path) throw new Error('Maze is not solvable')
  for (let index = 1; index < path.length; index += 1) {
    const [w, z] = path[index - 1]
    const [nextW, nextZ] = path[index]
    game.player.w = w
    game.player.z = z
    game.player.angle = angleForDelta(nextW - w, nextZ - z)
    tap(game, 'up')
    if (game.screen === 'WIN') break
  }
}

describe('Game', () => {
  it('starts with a deterministic maze and a title screen', () => {
    const game = createGame()
    expect(game.screen).toBe('TITLE')
    expect(game.seed).toBe(1991)
    expect(game.hasSave).toBe(false)
    expect(game.titleIndex).toBe(0)
  })

  it('starts a shared seed directly in play and saves it', () => {
    const game = createGame()
    game.startSeed(1991)
    expect(game.screen).toBe('PLAY')
    expect(game.seed).toBe(1991)
    expect(game.hasSave).toBe(true)
    expect(game.player.w).toBe(1)
    expect(game.player.angle).toBe(0)
  })

  it('moves forward and back through the vestibule', () => {
    const game = createGame()
    game.startSeed(1991)
    const startW = game.player.w
    const startZ = game.player.z

    tap(game, 'up')
    expect(game.player.w).toBe(2)
    expect(game.player.z).toBe(startZ)

    tap(game, 'down')
    expect(game.player.w).toBe(startW)
    expect(game.player.z).toBe(startZ)
  })

  it('turns in 90 degree steps', () => {
    const game = createGame()
    game.startSeed(1991)
    tap(game, 'left')
    expect(game.player.angle).toBe(90)
    tap(game, 'left')
    expect(game.player.angle).toBe(180)
    tap(game, 'right')
    expect(game.player.angle).toBe(90)
  })

  it('reports blocked moves without moving the player', () => {
    const game = createGame()
    game.startSeed(1991)
    const onEvent = vi.fn()
    game.setEventListener(onEvent)
    const { w, z } = game.player

    game.player.angle = 180
    tap(game, 'up')

    expect(game.player.w).toBe(w)
    expect(game.player.z).toBe(z)
    expect(onEvent).toHaveBeenCalledWith('blocked')
  })

  it('reaches the exit and wins', () => {
    const game = createGame()
    game.startSeed(1991)
    const onEvent = vi.fn()
    game.setEventListener(onEvent)

    walkPathToExit(game)

    expect(game.screen).toBe('WIN')
    expect(game.player.w).toBe(22)
    expect(game.hasSave).toBe(false)
    expect(onEvent).toHaveBeenCalledWith('win')
  })

  it('pauses and resumes with select', () => {
    const game = createGame()
    game.startSeed(1991)

    tap(game, 'select')
    expect(game.screen).toBe('PAUSE')
    expect(game.pauseIndex).toBe(0)

    tap(game, 'select')
    expect(game.screen).toBe('PLAY')
  })

  it('opens the map from pause and returns to pause', () => {
    const game = createGame()
    game.startSeed(1991)
    tap(game, 'select')
    tap(game, 'down')
    expect(game.pauseIndex).toBe(1)
    tap(game, 'select')
    expect(game.screen).toBe('MAP')
    expect(game.mapReturn).toBe('PAUSE')
    tap(game, 'select')
    expect(game.screen).toBe('PAUSE')
  })

  it('navigates the title menu and wraps', () => {
    const game = createGame()
    expect(game.titleIndex).toBe(0)
    tap(game, 'up')
    expect(game.titleIndex).toBe(2)
    tap(game, 'up')
    expect(game.titleIndex).toBe(1)
    tap(game, 'down')
    expect(game.titleIndex).toBe(2)
  })

  it('restores a saved game and selects continue', () => {
    const storage = createMemoryStorage()
    const game = createGame(storage)
    game.startSeed(1991)
    tap(game, 'up')
    const savedW = game.player.w
    const savedZ = game.player.z

    const restored = new Game({ storage, now: () => 0 })
    expect(restored.screen).toBe('TITLE')
    expect(restored.hasSave).toBe(true)
    expect(restored.titleIndex).toBe(2)
    expect(restored.seed).toBe(1991)
    expect(restored.player.w).toBe(savedW)
    expect(restored.player.z).toBe(savedZ)
  })

  it('clears the save after winning', () => {
    const storage = createMemoryStorage()
    const game = createGame(storage)
    game.startSeed(1991)
    walkPathToExit(game)
    expect(game.screen).toBe('WIN')

    const afterWin = new Game({ storage, now: () => 0 })
    expect(afterWin.hasSave).toBe(false)
    expect(afterWin.titleIndex).toBe(0)
  })
})
