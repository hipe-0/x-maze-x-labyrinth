import type { Action, Game } from '../game/game'
import { ArrowGlyph } from './ArrowGlyph'
import { Key } from './Key'
import { Lcd } from './Lcd'
import './calculator.css'

interface CalculatorProps {
  game: Game
  onAction: (action: Action) => void
  onRelease: (action: Action) => void
}

function FadedKey({
  label,
  accent = false,
}: {
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={`key key--faded ${accent ? 'key--accent' : ''}`.trim()}
      aria-hidden="true"
    >
      <span className="key__legend">{label}</span>
    </div>
  )
}

export function Calculator({ game, onAction, onRelease }: CalculatorProps) {
  return (
    <section className="calculator" aria-label="Casio FX-7500G tribute">
      <div className="calculator__display">
        <div className="brand-row">
          <div className="brand-row__left">
            <span className="brand-casio">CASIO</span>
            <span className="brand-model">fx-7500G</span>
          </div>
          <span className="brand-graphics">GRAPHICS</span>
        </div>

        <div className="lcd-bezel">
          <Lcd game={game} />
          <div className="lcd-bezel__label" aria-hidden="true">
            <span>DOT MATRIX</span>
            <span>96 × 64</span>
          </div>
        </div>

        <div className="display-caption" aria-hidden="true">
          <span>X MAZE X · LABYRINTH 1991</span>
          <span className="display-caption__led" />
        </div>
      </div>

      <div className="hinge" aria-hidden="true">
        <span />
      </div>

      <div className="calculator__keypad">
        <div className="mode-strip" aria-hidden="true">
          <span>MODE</span>
          <span>RUN</span>
          <span>WRITE</span>
          <span>PCL</span>
          <span>DEG</span>
          <span>GRA</span>
        </div>

        <div className="keypad-row keypad-row--top" aria-hidden="true">
          <FadedKey label="SHIFT" />
          <FadedKey label="ALPHA" />
          <FadedKey label="MODE" />
          <FadedKey label="DEL" />
          <FadedKey label="AC" accent />
        </div>

        <div className="gamepad">
          <div className="dpad">
            <Key
              action="up"
              ariaLabel="Up / move forward"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow key--up"
            >
              <ArrowGlyph direction="up" />
            </Key>
            <Key
              action="left"
              ariaLabel="Left / turn left"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow key--left"
            >
              <ArrowGlyph direction="left" />
            </Key>
            <div className="dpad__center" aria-hidden="true">
              <span>X</span>
            </div>
            <Key
              action="right"
              ariaLabel="Right / turn right"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow key--right"
            >
              <ArrowGlyph direction="right" />
            </Key>
            <Key
              action="down"
              ariaLabel="Down / move back"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow key--down"
            >
              <ArrowGlyph direction="down" />
            </Key>
          </div>

          <Key
            action="select"
            label="EXE"
            sublabel="SELECT"
            ariaLabel="Select / pause"
            onAction={onAction}
            onRelease={onRelease}
            className="key--exe"
          />
        </div>

        <div className="keypad-row keypad-row--bottom" aria-hidden="true">
          <FadedKey label="7" />
          <FadedKey label="8" />
          <FadedKey label="9" />
          <FadedKey label="×" />
          <FadedKey label="÷" />
        </div>

        <div className="calculator__footer" aria-hidden="true">
          <span>SCIENTIFIC CALCULATOR</span>
          <span>fx-7500G</span>
        </div>
      </div>
    </section>
  )
}
