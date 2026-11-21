import { AsteroidFactory } from './asteroid-factory'
import {
  ASTEROID_COLOURS,
  DEBUG,
  FPS,
  LEVELS_PER_COLOUR,
  SHIP_LIVES,
  SHIP_SIZE,
  SHIP_THRUST,
  TEXT_FADE_TIME,
} from './config'
import { Ship } from './entities/ship'
import { drawLives, drawMessage, drawScore } from './hud'
import { Score } from './score'
import type { Bounds } from './types'

const getLevelColour = (level: number): string => {
  const i = Math.floor(level / LEVELS_PER_COLOUR) % ASTEROID_COLOURS.length
  return ASTEROID_COLOURS[i] ?? 'white'
}

export class Game {
  ship: Ship
  private readonly asteroids: AsteroidFactory
  private readonly score = new Score()
  private level = 0
  private lives = SHIP_LIVES
  private text = ''
  private textAlpha = 0
  private paused = false
  private timer: number | undefined

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
    private readonly shipColour: string,
  ) {
    this.ship = this.newShip()
    this.asteroids = new AsteroidFactory({
      bounds: this.bounds(),
      onScore: (points) => {
        this.score.add(points)
      },
      onCleared: () => {
        this.level += 1
        this.newLevel()
      },
    })
  }

  start(): void {
    this.newGame()
    this.timer = window.setInterval(() => {
      this.update()
    }, 1000 / FPS)
  }

  stop(): void {
    window.clearInterval(this.timer)
  }

  togglePause(): void {
    this.paused = !this.paused
  }

  /** Call after the canvas has been resized. */
  resize(): void {
    this.ship.bounds = this.bounds()
    this.asteroids.bounds = this.bounds()
  }

  private bounds(): Bounds {
    return { x: 0, y: 0, w: this.canvas.width, h: this.canvas.height }
  }

  private newShip(): Ship {
    return new Ship({
      x: Math.floor(this.canvas.width / 2),
      y: Math.floor(this.canvas.height / 2),
      r: SHIP_SIZE / 2,
      a: (90 / 180) * Math.PI,
      colour: this.shipColour,
      size: SHIP_SIZE,
      thrustAcceleration: SHIP_THRUST,
      bounds: this.bounds(),
    })
  }

  private newGame(): void {
    this.score.reset()
    this.level = 0
    this.lives = SHIP_LIVES
    this.ship = this.newShip()
    this.newLevel()
  }

  private newLevel(): void {
    this.showMessage(`Level ${String(this.level + 1)}`)
    this.asteroids.createAsteroidBelt(this.ship, this.level)
  }

  private gameOver(): void {
    this.showMessage('Game Over')
    this.ship.dead = true
    this.score.save()
  }

  private showMessage(text: string): void {
    this.text = text
    this.textAlpha = 1
  }

  private update(): void {
    if (this.paused) return

    const { ctx, canvas, ship } = this

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ship.update()
    this.asteroids.update(ship)

    ship.draw(ctx, DEBUG)
    this.asteroids.draw(ctx, getLevelColour(this.level + 1), DEBUG)

    if (ship.isExploding()) {
      ship.explodeTime -= 1

      if (!ship.isExploding()) {
        if (this.lives <= 0) {
          this.gameOver()
        } else {
          this.lives -= 1
          this.ship = this.newShip()
        }
      }
    }

    if (this.textAlpha >= 0) {
      drawMessage(ctx, this.text, this.textAlpha, canvas.width, canvas.height)
      this.textAlpha -= 1.0 / TEXT_FADE_TIME / FPS
    } else if (this.ship.dead) {
      this.newGame()
    }

    drawLives(ctx, this.lives, this.shipColour)
    drawScore(ctx, this.score, canvas.width)
  }
}
