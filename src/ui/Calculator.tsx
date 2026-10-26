import type { Action, Game } from '../game/game'
import { ArrowGlyph } from './ArrowGlyph'
import { Key } from './Key'
import { Lcd } from './Lcd'
import { ReturnIcon } from './icons'
import './calculator.css'

interface CalculatorProps {
  game: Game
  onAction: (action: Action) => void
  onRelease: (action: Action) => void
}

interface IdleKeyProps {
  band: string
  label: string
  foot?: string
  className?: string
}

function IdleKey({ band, label, foot, className = '' }: IdleKeyProps) {
  return (
    <div className={`key key--idle ${className}`.trim()} aria-hidden="true">
      <span className="key__band">{band}</span>
      <span className="key__main">
        <span className="key__legend">{label}</span>
      </span>
      {foot ? <span className="key__foot">{foot}</span> : null}
    </div>
  )
}

export function Calculator({ game, onAction, onRelease }: CalculatorProps) {
  return (
    <div className="calculator-shell">
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
            <span className="mode-strip__badge">MODE</span>
            <span>RUN</span>
            <span>WRT</span>
            <span>PCL</span>
            <span>DEG</span>
            <span>RAD</span>
            <span>GRA</span>
          </div>

          <div className="keypad-grid">
            <IdleKey band="A-LOCK" label="SHIFT" />
            <Key
              action="up"
              ariaLabel="Up / move forward"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow"
              band={<ArrowGlyph direction="up" />}
            />
            <IdleKey band="RUN" label="MODE" />
            <IdleKey band="A" label="7" foot="M" className="key--num" />
            <IdleKey band="B" label="8" foot="N" className="key--num" />
            <IdleKey band="C" label="9" foot="O" className="key--num" />
            <IdleKey band="Mol" label="DEL" foot="ON" className="key--cap" />
            <IdleKey band="Scl" label="AC" className="key--cap" />

            <Key
              action="left"
              ariaLabel="Left / turn left"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow"
              band={<ArrowGlyph direction="left" />}
            />
            <IdleKey band="≡" label="ENG" />
            <Key
              action="right"
              ariaLabel="Right / turn right"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow"
              band={<ArrowGlyph direction="right" />}
            />
            <IdleKey band="D" label="4" foot="P" className="key--num" />
            <IdleKey band="E" label="5" foot="Q" className="key--num" />
            <IdleKey band="F" label="6" foot="R" className="key--num" />
            <IdleKey band="Or" label="×" className="key--op" />
            <IdleKey band="Rec" label="÷" className="key--op" />

            <IdleKey band="Y" label="Graph" />
            <Key
              action="down"
              ariaLabel="Down / move back"
              onAction={onAction}
              onRelease={onRelease}
              className="key--arrow"
              band={<ArrowGlyph direction="down" />}
            />
            <IdleKey band="Lbl" label="Plot" />
            <IdleKey band="Dez" label="1" foot="U" className="key--num" />
            <IdleKey band="X" label="2" foot="V" className="key--num" />
            <IdleKey band="Xn-1" label="3" foot="W" className="key--num" />
            <IdleKey band="Pol" label="+" className="key--op" />
            <IdleKey band="Rec" label="−" className="key--op" />

            <IdleKey band="R" label="Trace" />
            <IdleKey band="Q" label="Factor" />
            <IdleKey band="L" label="Line" />
            <IdleKey band="Rand" label="0" foot="Z" className="key--num" />
            <IdleKey band="Ran#" label="." foot="[" className="key--op" />
            <IdleKey band="π" label="EXP" className="key--cap" />
            <IdleKey band="j" label="Ans" foot="SPACE" className="key--cap" />
            <Key
              action="select"
              ariaLabel="Select / pause"
              onAction={onAction}
              onRelease={onRelease}
              className="key--exe"
              band={<ReturnIcon className="key__return" strokeWidth={2.1} />}
              label="EXE"
              foot="AD"
            />
          </div>

          <div className="calculator__footer" aria-hidden="true">
            <span>SCIENTIFIC CALCULATOR</span>
            <span>fx-7500G</span>
          </div>
        </div>
      </section>
    </div>
  )
}
