import {
  ASTEROID_COLLISIONS,
  ASTEROID_FRAGMENT_GRACE,
  ASTEROID_JAG,
  ASTEROID_MAX_SPEED_FACTOR,
  ASTEROID_NUM,
  ASTEROID_NUM_ADD,
  ASTEROID_POINTS_LARGE,
  ASTEROID_POINTS_MEDIUM,
  ASTEROID_POINTS_SMALL,
  ASTEROID_RADIUS_LARGE,
  ASTEROID_RADIUS_MEDIUM,
  ASTEROID_RESTITUTION,
  ASTEROID_SIZE,
  ASTEROID_SPEED,
  ASTEROID_VERTICIES,
  FPS,
} from './config'
import { Asteroid } from './entities/asteroid'
import type { Ship } from './entities/ship'
import { circlesOverlap, clampSpeed, resolveCollision, separateBodies } from './physics/collision'
import { randomSpin } from './physics/rotation'
import { canShatter, FRAGMENT_COUNT, fragmentRadius, shatterChance } from './physics/shatter'
import type { Bounds, DebugFlags } from './types'
import { distanceBetweenPoints } from './utils/geometry'

/** Attempts to find a free spawn position before giving up and accepting an overlap. */
const MAX_SPAWN_ATTEMPTS = 100

const pointsFor = (r: number): number => {
  if (r === ASTEROID_RADIUS_LARGE) return ASTEROID_POINTS_LARGE
  if (r === ASTEROID_RADIUS_MEDIUM) return ASTEROID_POINTS_MEDIUM
  return ASTEROID_POINTS_SMALL
}

export interface AsteroidFactoryConfig {
  bounds: Bounds
  /** Called with the points earned whenever the player destroys an asteroid. */
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

      // Keep new asteroids away from the ship's spawn point (as before), and avoid spawning on top of
      // another asteroid where possible
      let attempts = 0
      do {
        x = Math.floor(this.random() * this.bounds.w)
        y = Math.floor(this.random() * this.bounds.h)
        attempts += 1
      } while (
        distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r ||
        (attempts < MAX_SPAWN_ATTEMPTS && this.overlapsExisting(x, y, ASTEROID_RADIUS_LARGE))
      )

      this.addAsteroid(x, y, ASTEROID_RADIUS_LARGE)
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
    this.checkPlayerCollisions(ship)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tuning flag in config
    if (ASTEROID_COLLISIONS) {
      this.checkAsteroidCollisions()
    }

    this.asteroids = this.asteroids.filter((asteroid) => !asteroid.dead)

    if (this.asteroids.length === 0) {
      this.onCleared()
    }
  }

  private checkPlayerCollisions(ship: Ship): void {
    this.asteroids.forEach((asteroid) => {
      ship.lasers.forEach((laser) => {
        if (
          !laser.dead &&
          !asteroid.dead &&
          distanceBetweenPoints(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.r
        ) {
          this.destroyAsteroid(asteroid)
          laser.dead = true
        }
      })

      if (!asteroid.dead && !ship.isExploding() && ship.blinkNumber === 0 && !ship.dead) {
        if (distanceBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) <= ship.r + asteroid.r) {
          this.destroyAsteroid(asteroid)
          ship.explode()
        }
      }
    })
  }

  /** Bounces overlapping asteroids off each other and rolls for each to shatter. */
  private checkAsteroidCollisions(): void {
    // Snapshot: fragments created this frame are not checked until the next frame
    const asteroids = this.asteroids

    for (let i = 0; i < asteroids.length; i += 1) {
      for (let j = i + 1; j < asteroids.length; j += 1) {
        const a = asteroids[i]
        const b = asteroids[j]

        if (a.dead || b.dead) continue
        // Fresh fragments pass through other asteroids until their grace period ends
        if (a.isInGrace() || b.isInGrace()) continue
        if (!circlesOverlap(a, b)) continue

        separateBodies(a, b)
        const closingSpeed = resolveCollision(a, b, ASTEROID_RESTITUTION)
        if (closingSpeed <= 0) continue

        clampSpeed(a, this.maxSpeed())
        clampSpeed(b, this.maxSpeed())

        const chance = shatterChance(closingSpeed * FPS)
        ;[a, b].forEach((asteroid) => {
          if (canShatter(asteroid.r) && this.random() < chance) {
            this.shatter(asteroid)
          }
        })
      }
    }
  }

  /** Player destroyed an asteroid (laser or ship impact): shatter it and award points. */
  private destroyAsteroid(asteroid: Asteroid): void {
    this.shatter(asteroid)
    this.onScore(pointsFor(asteroid.r))
  }

  /**
   * Removes an asteroid and, if it is big enough, replaces it with fragments of the next size down.
   * The shatter chain is defined once in `fragmentRadius` and shared by every cause of shattering.
   */
  private shatter(asteroid: Asteroid): void {
    asteroid.dead = true

    const r = fragmentRadius(asteroid.r)
    if (r === undefined) return

    const graceFrames = Math.ceil(ASTEROID_FRAGMENT_GRACE * FPS)

    for (let i = 0; i < FRAGMENT_COUNT; i += 1) {
      this.addAsteroid(asteroid.x, asteroid.y, r, graceFrames)
    }
  }

  /** Speed cap (pixels per frame) applied after bounces; 0 means uncapped. */
  private maxSpeed(): number {
    const maxAxisSpeed = (ASTEROID_SPEED * this.levelMultiplier) / FPS
    return ASTEROID_MAX_SPEED_FACTOR * Math.SQRT2 * maxAxisSpeed
  }

  private overlapsExisting(x: number, y: number, r: number): boolean {
    return this.asteroids.some(
      (asteroid) => distanceBetweenPoints(x, y, asteroid.x, asteroid.y) < r + asteroid.r,
    )
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

  private addAsteroid(x: number, y: number, r: number, graceFrames = 0): void {
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
        graceFrames,
      }),
    ]
  }
}
