import { useEffect, type RefObject } from 'react'
import { FRAME_MS } from '../game/constants'
import { Framebuffer, presentToCanvas } from '../game/framebuffer'
import type { Game } from '../game/game'

/**
 * Drive the fixed 30 fps game loop and paint the 96x64 framebuffer onto the
 * LCD canvas. React never re-renders per frame.
 */
export function useGameLoop(
  game: Game,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): void {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const framebuffer = new Framebuffer()
    let animationFrame = 0
    let last = performance.now()
    let carry = 0

    const paint = (now: number) => {
      game.update(now)
      game.render(framebuffer, now)
      presentToCanvas(framebuffer, context, game.isInverted(now))
    }

    paint(performance.now())

    const tick = (now: number) => {
      carry += now - last
      last = now
      if (carry > 250) carry = 0
      if (carry >= FRAME_MS) {
        carry %= FRAME_MS
        paint(now)
      }
      animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [game, canvasRef])
}
