import {
  ASTEROID_JAG,
  ASTEROID_NUM,
  ASTEROID_NUM_ADD,
  ASTEROID_POINTS_LARGE,
  ASTEROID_POINTS_MEDIUM,
  ASTEROID_POINTS_SMALL,
  ASTEROID_RADIUS_LARGE,
  ASTEROID_RADIUS_MEDIUM,
  ASTEROID_RADIUS_SMALL,
  ASTEROID_SIZE,
  ASTEROID_SPEED,
  ASTEROID_VERTICIES,
  FPS,
} from './config'
import { Asteroid } from './entities/asteroid'
import type { Ship } from './entities/ship'
import { randomSpin } from './physics/rotation'
import type { Bounds, DebugFlags } from './types'
import { distanceBetweenPoints } from './utils/geometry'

export interface AsteroidFactoryConfig {
  bounds: Bounds
  /** Called with the points earned whenever an asteroid is destroyed. */
  onScore: (points: number) => void
  /** Called when every asteroid in the belt has been destroyed. */
  onCleared: () => void
  /** Random number source in [0, 1); injectable for deterministic tests. Defaults to Math.random. */
  random?: () => number
}

export class AsteroidFactory {
  bounds: Bounds
  asteroids: Asteroid[] = []
  private levelMultiplier = 1
  private readonly onScore: (points: number) => void
  private readonly onCleared: () => void
  private readonly random: () => number

  constructor(config: AsteroidFactoryConfig) {
    this.bounds = config.bounds
    this.onScore = config.onScore
    this.onCleared = config.onCleared
    this.random = config.random ?? Math.random
  }

  createAsteroidBelt(ship: Ship, level: number): void {
    this.levelMultiplier = 1 + 0.1 * level
    this.asteroids = []

    for (let i = 0; i < ASTEROID_NUM + level * ASTEROID_NUM_ADD; i += 1) {
      let x: number
      let y: number

      // Keep new asteroids away from the ship's spawn point
      do {
        x = Math.floor(this.random() * this.bounds.w)
        y = Math.floor(this.random() * this.bounds.h)
      } while (distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r)

      this.newAsteroid(x, y, ASTEROID_RADIUS_LARGE)
    }
  }

  update(ship: Ship): void {
    this.checkCollisions(ship)
    this.asteroids.forEach((asteroid) => {
      asteroid.update(this.bounds)
    })
  }

  draw(ctx: CanvasRenderingContext2D, colour: string, debug: DebugFlags): void {
    this.asteroids.forEach((asteroid) => {
      asteroid.draw(ctx, colour, debug)
    })
  }

  private checkCollisions(ship: Ship): void {
    this.asteroids.forEach((asteroid) => {
      ship.lasers.forEach((laser) => {
        if (
          !laser.dead &&
          distanceBetweenPoints(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.r
        ) {
          this.destroyAsteroid(asteroid)
          laser.dead = true
        }
      })

      if (!ship.isExploding() && ship.blinkNumber === 0 && !ship.dead) {
        if (distanceBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) <= ship.r + asteroid.r) {
          this.destroyAsteroid(asteroid)
          ship.explode()
        }
      }
    })

    this.asteroids = this.asteroids.filter((asteroid) => !asteroid.dead)

    if (this.asteroids.length === 0) {
      this.onCleared()
    }
  }

  private destroyAsteroid(asteroid: Asteroid): void {
    asteroid.dead = true

    if (asteroid.r === ASTEROID_RADIUS_LARGE) {
      this.newAsteroid(asteroid.x, asteroid.y, ASTEROID_RADIUS_MEDIUM)
      this.newAsteroid(asteroid.x, asteroid.y, ASTEROID_RADIUS_MEDIUM)
      this.onScore(ASTEROID_POINTS_LARGE)
      return
    }

    if (asteroid.r === ASTEROID_RADIUS_MEDIUM) {
      this.newAsteroid(asteroid.x, asteroid.y, ASTEROID_RADIUS_SMALL)
      this.newAsteroid(asteroid.x, asteroid.y, ASTEROID_RADIUS_SMALL)
      this.onScore(ASTEROID_POINTS_MEDIUM)
      return
    }

    this.onScore(ASTEROID_POINTS_SMALL)
  }

  private randomVelocity(): number {
    return (
      ((this.random() * ASTEROID_SPEED * this.levelMultiplier) / FPS) *
      (this.random() < 0.5 ? 1 : -1)
    )
  }

  private createJagOffsets(vertices: number): number[] {
    return Array.from(
      { length: vertices },
      () => this.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG,
    )
  }

  private newAsteroid(x: number, y: number, r: number): void {
    const verticies = Math.floor(this.random() * (ASTEROID_VERTICIES + 1) + ASTEROID_VERTICIES / 2)

    this.asteroids = [
      ...this.asteroids,
      new Asteroid({
        x,
        y,
        verticies,
        xv: this.randomVelocity(),
        yv: this.randomVelocity(),
        r,
        a: this.random() * Math.PI * 2,
        spin: randomSpin(r, this.random),
        offsets: this.createJagOffsets(verticies),
      }),
    ]
  }
}
