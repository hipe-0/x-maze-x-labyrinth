interface ArrowGlyphProps {
  direction: 'up' | 'down' | 'left' | 'right'
}

const ROTATION: Record<ArrowGlyphProps['direction'], number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
}

export function ArrowGlyph({ direction }: ArrowGlyphProps) {
  return (
    <svg
      className="key__arrow"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
    >
      <path d="M12 4.2 19 14h-4.2v5.8H9.2V14H5z" fill="currentColor" />
    </svg>
  )
}
