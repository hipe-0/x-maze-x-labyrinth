import { useCallback, useEffect, useState } from 'react'
import { Game, type Action } from './game/game'
import { useSound } from './hooks/useSound'
import { vibrate } from './lib/feedback'
import { AboutModal } from './ui/AboutModal'
import { Calculator } from './ui/Calculator'
import {
  CollapseIcon,
  ExpandIcon,
  InfoIcon,
  ShareIcon,
  SoundOffIcon,
  SoundOnIcon,
} from './ui/icons'

function readMuted(): boolean {
  try {
    return localStorage.getItem('xmazex.muted') === '1'
  } catch {
    return false
  }
}

function readUrlSeed(): number | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('seed')
    if (raw === null || !/^\d+$/.test(raw)) return null
    return Number(raw)
  } catch {
    return null
  }
}

function actionForKey(key: string): Action | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return 'up'
    case 'ArrowDown':
    case 's':
    case 'S':
      return 'down'
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'left'
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'right'
    case 'Enter':
    case ' ':
    case 'j':
    case 'J':
      return 'select'
    default:
      return null
  }
}

export default function App() {
  const [game] = useState<Game>(() => {
    const sharedSeed = readUrlSeed()
    return new Game({ startSeed: sharedSeed ?? undefined })
  })

  const [muted, setMuted] = useState(readMuted)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(() =>
    Boolean(document.fullscreenElement),
  )
  const [fullscreenSupported] = useState(
    () => typeof document.documentElement.requestFullscreen === 'function',
  )
  const sound = useSound(muted)

  useEffect(() => {
    if (import.meta.env.DEV) {
      ;(window as unknown as { __xmazex?: Game }).__xmazex = game
    }
  }, [game])

  useEffect(() => {
    game.setEventListener((event) => {
      if (event === 'win') {
        sound.playWin()
        vibrate([16, 36, 24])
      } else if (event === 'blocked') {
        sound.playBlocked()
        vibrate(5)
      }
    })
    return () => {
      game.setEventListener(undefined)
    }
  }, [game, sound])

  const handleAction = useCallback(
    (action: Action) => {
      sound.playClick()
      vibrate(6)
      game.keyDown(action)
    },
    [game, sound],
  )

  const handleRelease = useCallback(
    (action: Action) => {
      game.keyUp(action)
    },
    [game],
  )

  useEffect(() => {
    if (aboutOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        game.clearInput()
        game.back()
        return
      }

      const target = event.target
      if (target instanceof HTMLElement) {
        const button = target.closest('button')
        if (button && !button.dataset.action) return
        if (target.closest('a, input, textarea, select')) return
      }

      const action = actionForKey(event.key)
      if (!action) return
      event.preventDefault()
      if (event.repeat) return
      handleAction(action)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const action = actionForKey(event.key)
      if (action) handleRelease(action)
    }

    const onBlur = () => game.clearInput()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [aboutOpen, game, handleAction, handleRelease])

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    const save = () => game.save()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') game.save()
    }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [game])

  const toggleMute = () => {
    setMuted((previous) => {
      const next = !previous
      try {
        localStorage.setItem('xmazex.muted', next ? '1' : '0')
      } catch {
        // Ignore storage failures.
      }
      return next
    })
  }

  const share = async () => {
    const url = new URL(window.location.href)
    url.search = ''
    url.searchParams.set('seed', game.seedLabel())
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url.toString())
      setToast('Seed link copied')
    } catch {
      setToast(`SEED ${game.seedLabel()}`)
    }
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      // Fullscreen is a progressive enhancement.
    }
  }

  const openAbout = () => {
    game.clearInput()
    setAboutOpen(true)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__eyebrow">CASIO FX-7500G · 1991</span>
          <span className="topbar__title">
            X MAZE X
            <span className="topbar__status">
              <span className="status-dot" />
              ONLINE
            </span>
          </span>
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="icon-button"
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={muted}
            onClick={toggleMute}
          >
            {muted ? <SoundOffIcon /> : <SoundOnIcon />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Copy a link to this maze seed"
            onClick={() => void share()}
          >
            <ShareIcon />
          </button>
          {fullscreenSupported ? (
            <button
              type="button"
              className="icon-button"
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
            </button>
          ) : null}
          <button
            type="button"
            className="icon-button"
            aria-label="About X MAZE X"
            onClick={openAbout}
          >
            <InfoIcon />
          </button>
        </div>
      </header>

      <main className="stage">
        <Calculator
          game={game}
          onAction={handleAction}
          onRelease={handleRelease}
        />
      </main>

      <footer className="site-footer">
        <span className="site-footer__hint">
          ↑↓ MOVE · ←→ TURN · EXE PAUSE
        </span>
        <span className="site-footer__credit">
          Fan tribute to the 1991 Casio FX-7500G. Not affiliated with Casio.
        </span>
      </footer>

      {toast ? (
        <div className="toast" role="status">
          {toast}
        </div>
      ) : null}

      {aboutOpen ? (
        <AboutModal onClose={() => setAboutOpen(false)} />
      ) : null}
    </div>
  )
}
