import { useRef } from 'react'
import { FB_H, FB_W } from '../game/constants'
import type { Game } from '../game/game'
import { useGameLoop } from '../hooks/useGameLoop'

export function Lcd({ game }: { game: Game }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useGameLoop(game, canvasRef)

  return (
    <div className="lcd-window">
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
