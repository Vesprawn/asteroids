import { ASTEROID_LINE_WIDTH, ASTEROID_MOVES } from '../config'
import type { Bounds, DebugFlags } from '../types'
import { wrapPosition } from '../utils/geometry'

export interface AsteroidConfig {
  x: number
  y: number
  xv: number
  yv: number
  r: number
  a: number
  verticies: number
  offsets: number[]
}

export class Asteroid {
  x: number
  y: number
  xv: number
  yv: number
  r: number
  a: number
  verticies: number
  offsets: number[]
  dead = false

  constructor(config: AsteroidConfig) {
    this.x = config.x
    this.y = config.y
    this.xv = config.xv
    this.yv = config.yv
    this.r = config.r
    this.a = config.a
    this.verticies = config.verticies
    this.offsets = config.offsets
  }

  update(bounds: Bounds): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tuning flag in config
    if (!ASTEROID_MOVES) return

    const wrapped = wrapPosition({ x: this.x + this.xv, y: this.y + this.yv }, this.r, bounds)
    this.x = wrapped.x
    this.y = wrapped.y
  }

  draw(ctx: CanvasRenderingContext2D, colour: string, debug: DebugFlags): void {
    const { x, y, r, a, verticies, offsets } = this

    if (debug.showBounding) {
      ctx.strokeStyle = 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = colour
    ctx.lineWidth = ASTEROID_LINE_WIDTH

    ctx.beginPath()

    for (let i = 0; i < verticies; i += 1) {
      const offset = offsets[i] ?? 1
      const angle = a + (i * Math.PI * 2) / verticies
      const px = x + r * offset * Math.cos(angle)
      const py = y + r * offset * Math.sin(angle)

      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }

    ctx.closePath()
    ctx.stroke()
  }
}
