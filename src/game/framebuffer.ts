import { FB_H, FB_W, LCD_BG, LCD_INK } from './constants'
import { FONT } from './font'
import { pyRound, textWidth } from './util'

export class Framebuffer {
  readonly width = FB_W
  readonly height = FB_H
  readonly pixels = new Uint8Array(FB_W * FB_H)
  readonly decay = new Uint8Array(FB_W * FB_H)

  clear(value = 0): void {
    this.pixels.fill(value)
  }

  px(x: number, y: number, value = 1): void {
    if (x >= 0 && x < FB_W && y >= 0 && y < FB_H) {
      this.pixels[y * FB_W + x] = value
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, value = 1): void {
    let x = pyRound(x0)
    let y = pyRound(y0)
    const endX = pyRound(x1)
    const endY = pyRound(y1)
    const dx = Math.abs(endX - x)
    const dy = -Math.abs(endY - y)
    const stepX = x < endX ? 1 : -1
    const stepY = y < endY ? 1 : -1
    let error = dx + dy

    for (;;) {
      this.px(x, y, value)
      if (x === endX && y === endY) break
      const doubled = 2 * error
      if (doubled >= dy) {
        error += dy
        x += stepX
      }
      if (doubled <= dx) {
        error += dx
        y += stepY
      }
    }
  }

  rect(x0: number, y0: number, x1: number, y1: number, value = 1): void {
    this.line(x0, y0, x1, y0, value)
    this.line(x0, y1, x1, y1, value)
    this.line(x0, y0, x0, y1, value)
    this.line(x1, y0, x1, y1, value)
  }

  fillRect(x0: number, y0: number, x1: number, y1: number, value = 1): void {
    const left = Math.max(0, Math.min(x0, x1))
    const right = Math.min(FB_W - 1, Math.max(x0, x1))
    const top = Math.max(0, Math.min(y0, y1))
    const bottom = Math.min(FB_H - 1, Math.max(y0, y1))
    for (let y = top; y <= bottom; y += 1) {
      for (let x = left; x <= right; x += 1) {
        this.px(x, y, value)
      }
    }
  }

  text(
    x: number,
    y: number,
    text: string,
    scale = 1,
    value = 1,
    dither = false,
  ): void {
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index]
      const glyph = FONT[char] ?? FONT['?']
      const glyphX = x + index * 6 * scale
      for (let row = 0; row < glyph.length; row += 1) {
        const line = glyph[row]
        for (let column = 0; column < line.length; column += 1) {
          if (line[column] !== '#') continue
          for (let dy = 0; dy < scale; dy += 1) {
            for (let dx = 0; dx < scale; dx += 1) {
              const px = glyphX + column * scale + dx
              const py = y + row * scale + dy
              if (dither && ((px + py) & 1) !== 0) continue
              this.px(px, py, value)
            }
          }
        }
      }
    }
  }

  textC(y: number, text: string, scale = 1, value = 1, dither = false): void {
    const x = Math.floor((FB_W - textWidth(text, scale)) / 2)
    this.text(x, y, text, scale, value, dither)
  }
}

const imageDataCache = new WeakMap<
  CanvasRenderingContext2D,
  ImageData
>()

/**
 * Turn the 1-bit framebuffer into the LCD image. The two-frame decay is the
 * subtle passive-LCD ghosting from the original.
 */
export function presentToCanvas(
  framebuffer: Framebuffer,
  context: CanvasRenderingContext2D,
  inverted: boolean,
): void {
  let image = imageDataCache.get(context)
  if (!image) {
    image = context.createImageData(FB_W, FB_H)
    imageDataCache.set(context, image)
  }

  const data = image.data
  const background = inverted ? LCD_INK : LCD_BG
  const lit = inverted ? LCD_BG : LCD_INK

  for (let index = 0; index < framebuffer.pixels.length; index += 1) {
    const x = index % FB_W
    const y = (index / FB_W) | 0
    let color: readonly [number, number, number] = background

    if (framebuffer.pixels[index] !== 0) {
      color = lit
      framebuffer.decay[index] = 2
    } else if (framebuffer.decay[index] !== 0) {
      const decay = framebuffer.decay[index]
      if (decay === 2) {
        if (((x + y) & 1) === 0) color = lit
        framebuffer.decay[index] = 1
      } else {
        if ((x & 1) === 0 && (y & 1) === 0) color = lit
        framebuffer.decay[index] = 0
      }
    }

    const offset = index * 4
    data[offset] = color[0]
    data[offset + 1] = color[1]
    data[offset + 2] = color[2]
    data[offset + 3] = 255
  }

  context.putImageData(image, 0, 0)
}
