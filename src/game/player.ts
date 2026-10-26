import type { Angle } from './constants'

export class Player {
  w: number
  z: number
  angle: Angle

  constructor(w: number, z: number, angle: Angle = 0) {
    this.w = w
    this.z = z
    this.angle = angle
  }

  turn(delta: number): void {
    this.angle = (((this.angle + delta) % 360) + 360) % 360 as Angle
  }

  clone(): Player {
    return new Player(this.w, this.z, this.angle)
  }
}
