import {
  FPS,
  FRICTION,
  LASER_COOLDOWN_MS,
  LASER_SPEED,
  SHIP_BLINK_DURATION,
  SHIP_EXPLODE_DURATION,
  SHIP_INVUL_DURATION,
  SHIP_LINE_WIDTH,
  SHIP_SIZE,
  SHIP_THRUST,
  SHIP_THRUST_COLOUR,
} from '../config'
import type { Bounds, DebugFlags } from '../types'
import { wrapPosition } from '../utils/geometry'
import { Laser } from './laser'

export interface ShipConfig {
  x: number
  y: number
  r: number
  a: number
  colour?: string
  size?: number
  rot?: number
  thrustAcceleration?: number
  bounds?: Bounds
}

export class Ship {
  x: number
  y: number
  r: number
  a: number
  colour: string
  size: number
  rot: number
  isThrusting = false
  explodeTime = 0
  blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
  blinkNumber = Math.ceil(SHIP_INVUL_DURATION / SHIP_BLINK_DURATION)
  bounds: Bounds
  lasers: Laser[] = []
  thrustAcceleration: number
  canShoot = true
  shooting = false
  dead = false
  thrustMag = { x: 0, y: 0 }

  constructor(config: ShipConfig) {
    this.x = config.x
    this.y = config.y
    this.r = config.r
    this.a = config.a
    this.colour = config.colour ?? 'white'
    this.size = config.size ?? SHIP_SIZE
    this.rot = config.rot ?? 0
    this.bounds = config.bounds ?? { x: 0, y: 0, w: 0, h: 0 }
    this.thrustAcceleration = config.thrustAcceleration ?? SHIP_THRUST
  }

  fireLaser(): void {
    const { x, y, r, a } = this

    if (this.canShoot) {
      this.lasers = [
        ...this.lasers,
        new Laser({
          x: x + (4 / 3) * r * Math.cos(a),
          y: y - (4 / 3) * r * Math.sin(a),
          xv: (LASER_SPEED * Math.cos(a)) / FPS,
          yv: (-LASER_SPEED * Math.sin(a)) / FPS,
        }),
      ]
    }
  }

  explode(): void {
    this.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS)
  }

  thrust(): void {
    this.isThrusting = true
  }

  cutThrust(): void {
    this.isThrusting = false
  }

  rotate(rot: number): void {
    this.rot = rot
  }

  updateLasers(bounds: Bounds): void {
    this.lasers.forEach((laser) => {
      laser.update(bounds)
    })
    this.lasers = this.lasers.filter((laser) => !laser.dead)
  }

  update(): void {
    const { a, rot, isThrusting, thrustAcceleration, blinkNumber } = this

    this.updateLasers(this.bounds)

    if (this.isExploding() || this.dead) {
      return
    }

    if (this.shooting && this.canShoot) {
      this.fireLaser()
      this.canShoot = false
      setTimeout(() => {
        this.canShoot = true
      }, LASER_COOLDOWN_MS)
    }

    if (isThrusting) {
      this.thrustMag.x += (thrustAcceleration * Math.cos(a)) / FPS
      this.thrustMag.y -= (thrustAcceleration * Math.sin(a)) / FPS
    } else {
      this.thrustMag.x -= (FRICTION * this.thrustMag.x) / FPS
      this.thrustMag.y -= (FRICTION * this.thrustMag.y) / FPS
    }

    this.x += this.thrustMag.x
    this.y += this.thrustMag.y

    const wrapped = wrapPosition(this, this.r, this.bounds)
    this.x = wrapped.x
    this.y = wrapped.y
    this.a += rot

    if (blinkNumber > 0) {
      this.blinkTime -= 1

      if (this.blinkTime === 0) {
        this.blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
        this.blinkNumber -= 1
      }
    }
  }

  isBlinkOn(): boolean {
    return this.blinkNumber % 2 === 0
  }

  isExploding(): boolean {
    return this.explodeTime > 0
  }

  draw(ctx: CanvasRenderingContext2D, debug: DebugFlags): void {
    if (this.isThrusting && !this.isExploding() && !this.dead) {
      this.drawThruster(ctx)
    }

    if (!this.isExploding()) {
      this.drawShip(ctx, debug)
    } else {
      this.drawExplosion(ctx)
    }

    this.drawLasers(ctx)
  }

  private drawLasers(ctx: CanvasRenderingContext2D): void {
    this.lasers.forEach((laser) => {
      laser.draw(ctx)
    })
  }

  private drawShip(ctx: CanvasRenderingContext2D, debug: DebugFlags): void {
    if (!this.isBlinkOn() || this.dead) return

    const { x, y, r, a } = this

    if (debug.showBounding) {
      ctx.strokeStyle = this.isExploding() ? 'red' : 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = this.colour
    ctx.lineWidth = SHIP_LINE_WIDTH

    ctx.beginPath()
    ctx.moveTo(x + (4 / 3) * r * Math.cos(a), y - (4 / 3) * r * Math.sin(a))
    ctx.lineTo(
      x - r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
      y + r * ((2 / 3) * Math.sin(a) - Math.cos(a)),
    )

    // comment out to make a triangle only
    ctx.lineTo(x, y)

    ctx.lineTo(
      x - r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
      y + r * ((2 / 3) * Math.sin(a) + Math.cos(a)),
    )
    ctx.closePath()
    ctx.stroke()

    if (debug.showShipCentre) {
      ctx.fillStyle = 'red'
      ctx.fillRect(x - 1, y - 1, 2, 2)
    }
  }

  private drawThruster(ctx: CanvasRenderingContext2D): void {
    if (!this.isBlinkOn()) return

    const { x, y, r, a } = this

    ctx.strokeStyle = SHIP_THRUST_COLOUR
    ctx.lineWidth = SHIP_LINE_WIDTH

    ctx.beginPath()
    ctx.moveTo(
      x - r * ((2 / 3) * Math.cos(a) + 0.5 * Math.sin(a)),
      y + r * ((2 / 3) * Math.sin(a) - 0.5 * Math.cos(a)),
    )

    ctx.lineTo(x - r * ((5 / 3) * Math.cos(a)), y + r * ((5 / 3) * Math.sin(a)))
    ctx.lineTo(
      x - r * ((2 / 3) * Math.cos(a) - 0.5 * Math.sin(a)),
      y + r * ((2 / 3) * Math.sin(a) + 0.5 * Math.cos(a)),
    )

    // comment out if triangle only
    ctx.lineTo(x, y)

    ctx.closePath()
    ctx.stroke()
  }

  private drawExplosion(ctx: CanvasRenderingContext2D): void {
    const { x, y, r } = this
    const rings: [colour: string, scale: number][] = [
      ['red', 1.5],
      ['orange', 1],
      ['yellow', 0.5],
      ['white', 0.25],
    ]

    rings.forEach(([colour, scale]) => {
      ctx.strokeStyle = colour
      ctx.beginPath()
      ctx.arc(x, y, r * scale, 0, Math.PI * 2, false)
      ctx.stroke()
    })
  }
}
