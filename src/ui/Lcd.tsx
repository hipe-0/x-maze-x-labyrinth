import { useLayoutEffect, useRef, type RefObject } from 'react'
import { FB_H, FB_W } from '../game/constants'
import type { Game } from '../game/game'
import { useGameLoop } from '../hooks/useGameLoop'

/**
 * Size the LCD canvas to the largest integer device-pixel multiple of the
 * 96x64 framebuffer that fits. Fractional scaling makes some LCD pixels wider
 * than others, which reads as doubled/thin lines in the wireframe view.
 */
function usePixelPerfectScale(
  windowRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
): void {
  useLayoutEffect(() => {
    const windowEl = windowRef.current
    const canvas = canvasRef.current
    if (!windowEl || !canvas) return

    let frame = 0

    const fit = () => {
      frame = 0
      const rect = windowEl.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const scale = Math.max(
        1,
        Math.floor(
          Math.min((rect.width * dpr) / FB_W, (rect.height * dpr) / FB_H),
        ),
      )
      windowEl.style.setProperty('--lcd-cell', `${scale / dpr}px`)
      canvas.style.width = `${(FB_W * scale) / dpr}px`
      canvas.style.height = `${(FB_H * scale) / dpr}px`
    }

    const schedule = () => {
      if (frame !== 0) return
      frame = window.requestAnimationFrame(fit)
    }

    fit()
    const observer = new ResizeObserver(schedule)
    observer.observe(windowEl)
    window.addEventListener('resize', schedule)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [canvasRef, windowRef])
}

export function Lcd({ game }: { game: Game }) {
  const windowRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useGameLoop(game, canvasRef)
  usePixelPerfectScale(windowRef, canvasRef)

  return (
    <div className="lcd-window" ref={windowRef}>
      <canvas
        ref={canvasRef}
        width={FB_W}
        height={FB_H}
        className="lcd-screen"
        aria-label="X MAZE X game screen"
      />
      <div className="lcd-scanlines" aria-hidden="true" />
      <div className="lcd-glare" aria-hidden="true" />
      <div className="lcd-vignette" aria-hidden="true" />
    </div>
  )
}
