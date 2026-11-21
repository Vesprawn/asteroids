import { LASER_COLOUR, LASER_DISTANCE, SHIP_SIZE } from '../config'
import type { Bounds } from '../types'

export interface LaserConfig {
  x: number
  y: number
  xv: number
  yv: number
}

export class Laser {
  x: number
  y: number
  xv: number
  yv: number
  distance = 0
  dead = false

  constructor(config: LaserConfig) {
    this.x = config.x
    this.y = config.y
    this.xv = config.xv
    this.yv = config.yv
  }

  update(bounds: Bounds): void {
    if (this.distance > LASER_DISTANCE * bounds.w) {
      this.dead = true
    }

    this.x += this.xv
    this.y += this.yv

    this.distance += Math.sqrt(Math.pow(this.xv, 2) + Math.pow(this.yv, 2))
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, y } = this
    ctx.strokeStyle = LASER_COLOUR
    ctx.fillStyle = LASER_COLOUR
    ctx.beginPath()
    ctx.arc(x, y, SHIP_SIZE / 15, 0, Math.PI * 2, false)
    ctx.stroke()
    ctx.fill()
  }
}
