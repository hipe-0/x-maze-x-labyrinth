import { useEffect, useRef } from 'react'
import { CloseIcon } from './icons'

export function AboutModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onPointerDown={onClose}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <span className="modal__eyebrow">A 1991 CASIO FX-7500G TRIBUTE</span>
            <h2 id="about-title" className="modal__title">
              X MAZE X
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-button modal__close"
            aria-label="Close about panel"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <p className="modal__lead">
          A 3D labyrinth that began in 1991 on a Casio FX-7500G graphic
          calculator.
        </p>

        <p>
          The original hand-written Casio BASIC program was <strong>1091 steps</strong>{' '}
          long. Its 3D display code was lost; this browser version reconstructs
          the wireframe corridors from the surviving notes. Everything is still
          drawn on an emulated <strong>96 × 64</strong> monochrome LCD, in the
          calculator&apos;s green-gray palette, with a little passive-LCD
          ghosting.
        </p>

        <div className="modal__rule" />

        <h3 className="modal__subtitle">Controls</h3>
        <ul className="controls-list">
          <li>
            <span className="controls-list__keys">↑ ↓</span>
            <span>Move forward / back</span>
          </li>
          <li>
            <span className="controls-list__keys">← →</span>
            <span>Turn 90° left / right</span>
          </li>
          <li>
            <span className="controls-list__keys">EXE</span>
            <span>Select in menus · pause during play</span>
          </li>
          <li>
            <span className="controls-list__keys">ESC</span>
            <span>Back / pause</span>
          </li>
          <li>
            <span className="controls-list__keys">WASD</span>
            <span>Keyboard alternative on desktop</span>
          </li>
        </ul>

        <p className="modal__hint">
          Only the white dotted arrow keys and EXE are active. The rest of the
          scientific keypad is a visual tribute for now.
        </p>

        <p className="modal__note">
          The win screen keeps <strong>1091 STEPS</strong> as an homage to the
          original program size. It is not a move counter.
        </p>

        <div className="modal__footer">
          <span className="modal__legal">
            Fan project. Not affiliated with Casio.
          </span>
          <button type="button" className="modal__done" onClick={onClose}>
            Back to the maze
          </button>
        </div>
      </div>
    </div>
  )
}
