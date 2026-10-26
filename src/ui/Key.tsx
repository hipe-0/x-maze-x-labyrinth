import {
  useCallback,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react'
import type { Action } from '../game/game'

interface KeyProps {
  action: Action
  label?: string
  ariaLabel: string
  onAction: (action: Action) => void
  onRelease: (action: Action) => void
  className?: string
  band?: ReactNode
  foot?: string
  children?: ReactNode
}

export function Key({
  action,
  label,
  ariaLabel,
  onAction,
  onRelease,
  className = '',
  band,
  foot,
  children,
}: KeyProps) {
  const [pressed, setPressed] = useState(false)

  const press = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      event.preventDefault()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is an enhancement; the button still works without it.
      }
      setPressed(true)
      onAction(action)
    },
    [action, onAction],
  )

  const release = useCallback(() => {
    setPressed(false)
    onRelease(action)
  }, [action, onRelease])

  return (
    <button
      type="button"
      tabIndex={-1}
      data-action={action}
      className={`key key--active ${pressed ? 'is-pressed' : ''} ${className}`.trim()}
      aria-label={ariaLabel}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => {
        setPressed(false)
        onRelease(action)
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      {band ? <span className="key__band">{band}</span> : null}
      <span className="key__main">
        {children}
        {label ? <span className="key__legend">{label}</span> : null}
      </span>
      {foot ? <span className="key__foot">{foot}</span> : null}
    </button>
  )
}
