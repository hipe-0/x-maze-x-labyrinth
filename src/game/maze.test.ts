import { describe, expect, it } from 'vitest'
import {
  ENTRY_W,
  EXIT_W,
  PW0,
  PW1,
  WALL_E,
  WALL_W,
} from './constants'
import { Maze } from './maze'

const SEEDS = [0, 1, 42, 1991, 123456, 999999]

describe('Maze', () => {
  it.each(SEEDS)('generates a solvable maze for seed %i', (seed) => {
    const maze = new Maze(seed)
    const path = maze.path()
    expect(path).not.toBeNull()
    if (!path) return
    expect(path[0]).toEqual([ENTRY_W, maze.entryZ])
    expect(path[path.length - 1]).toEqual([EXIT_W, maze.exitZ])
    expect(path.length).toBeGreaterThan(2)
  })

  it('is deterministic for the same seed', () => {
    const first = new Maze(1991)
    const second = new Maze(1991)
    expect(first.walls).toEqual(second.walls)
    expect(first.entryZ).toBe(second.entryZ)
    expect(first.exitZ).toBe(second.exitZ)
  })

  it('varies between seeds', () => {
    const first = new Maze(1991)
    const second = new Maze(1992)
    expect(JSON.stringify(first.walls)).not.toBe(JSON.stringify(second.walls))
  })

  it('opens the vestibule and the exit', () => {
    const maze = new Maze(1991)
    expect(maze.walls[ENTRY_W][maze.entryZ] & WALL_E).toBe(0)
    expect(maze.walls[PW0][maze.entryZ] & WALL_W).toBe(0)
    expect(maze.walls[PW1][maze.exitZ] & WALL_E).toBe(0)
    expect(maze.walls[EXIT_W][maze.exitZ] & WALL_W).toBe(0)
  })

  it('can rebuild from a snapshot', () => {
    const maze = new Maze(1991)
    const copy = new Maze(0, maze.cloneSnapshot())
    expect(copy.walls).toEqual(maze.walls)
    expect(copy.entryZ).toBe(maze.entryZ)
    expect(copy.exitZ).toBe(maze.exitZ)
    expect(copy.path()).toEqual(maze.path())
  })

  it('does not walk through walls', () => {
    const maze = new Maze(1991)
    expect(maze.canMove(ENTRY_W, maze.entryZ, 180)).toBe(false)
    expect(maze.canMove(ENTRY_W, maze.entryZ, 0)).toBe(true)
  })
})
