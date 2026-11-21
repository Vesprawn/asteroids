import './styles/normalize.css'
import './styles/style.css'

// Get the value of "name" in eg "https://example.com/?name=some_value"
const player = new URLSearchParams(window.location.search).get('name') ?? ''

let is_game_paused = false

const ASTEROID_MOVES = true // [true] controls if asteroids will update positions
const ASTEROID_JAG = 0.4 // jaggedness of the asteroids 0 = none, 1 = lots
const ASTEROID_NUM = 3 // [3] starting number of asteroids
const ASTEROID_NUM_ADD = 1 // [1] additional number per level
const ASTEROID_SIZE = 100 // starting size of asteroids in pixels
const ASTEROID_SPEED = 50 // max starting speed in pixels per second
const ASTEROID_VERTICIES = 10 // average number of verticies on each asteroid
const ASTEROID_LINE_WIDTH = 2
const ASTEROID_COLOURS = ['slategrey', 'yellow', 'lime', 'blue', '#800080', 'red']
const DEBUG_SHIP_CENTER = false
const DEBUG_SHOW_BOUNDING = false
const FPS = 30 // frames per second
const FRICTION = 0.7 // friction coefficient of space 0 = none, 1 = lots
const LASER_COLOUR = '#e6ffff' //  'white' // 'magenta'
const LASER_DISTANCE = 0.6 // max distance can travel as fraction of screen width
// const LASER_MAX = 10 // max number of lasers on screen
const LASER_SPEED = 500 // speed of lasers in pixels
const SHIP_BLINK_DURATION = 0.1 // duration of ship blink during invulnerability
const SHIP_INVUL_DURATION = 3 // duration of ship invulnerability after explotion
const SHIP_EXPLODE_DURATION = 0.3 // duration of ship explosion
const SHIP_SIZE = 30 // ship size in pixels
const SHIP_LINE_WIDTH = 2
const SHIP_TURN_SPEED = 260 // 360 // ship turn speed in degrees per second
const SHIP_THRUST = 5 // acceleration of ship in pixels per second per second
const SHIP_THRUST_COLOUR = 'cyan'
const SHIP_LIVES = 3 // starting lives
const TEXT_FADE_TIME = 2.5 // text fade time in seconds
const TEXT_SIZE = 30 // font height in pixels
const KEY_HIGHSCORE = 'highscore'
const LEVELS_PER_COLOUR = 5 // [20]

const TEXT_COLOUR_HIGHSCORE = 'yellow' // 'magenta'
const TEXT_COLOR_SCORE = 'white'

interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

interface DebugFlags {
  DEBUG_SHIP_CENTER?: boolean
  DEBUG_SHOW_BOUNDING?: boolean
}

const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const getColourByPlayer = (playerName: string): string => {
  switch (playerName) {
    case 'amy':
      return 'magenta'
    case 'ian':
      return '#695E93'
    case 'kard':
      return 'green'
    default:
      return 'white'
  }
}

const newShip = (): Ship => {
  return new Ship({
    x: Math.floor(canvas.width / 2),
    y: Math.floor(canvas.height / 2),
    r: SHIP_SIZE / 2,
    a: (90 / 180) * Math.PI,
    size: SHIP_SIZE,
    thrustAcceleration: SHIP_THRUST,
    bounds: { x: 0, y: 0, w: canvas.width, h: canvas.height },
  })
}

class Score {
  score = 0
  highscore = 0

  constructor() {
    this.reset()
  }

  add(n: number): void {
    this.score += n

    if (this.score > this.highscore) this.highscore += n
  }

  save(): void {
    localStorage.setItem(KEY_HIGHSCORE, String(this.highscore))
  }

  reset(): void {
    this.score = 0
    this.highscore = Number(localStorage.getItem(KEY_HIGHSCORE) ?? 0)
  }
}

const gameOver = (): void => {
  text = 'Game Over'
  textAlpha = 1
  ship.dead = true

  score.save()
}

const getLevelColour = (level: number): number => {
  const i = Math.floor(level / LEVELS_PER_COLOUR)

  if (i > ASTEROID_COLOURS.length - 1) return i % ASTEROID_COLOURS.length
  return i
}

interface LaserConfig {
  x: number
  y: number
  xv: number
  yv: number
}

class Laser {
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

  checkEdge(bounds: Bounds): void {
    const { x, y } = this

    if (x < 0) {
      this.x = bounds.w
    }

    if (x > bounds.w) {
      this.x = 0
    }

    if (y < 0) {
      this.y = bounds.h
    }

    if (y > bounds.h) {
      this.y = 0
    }
  }

  update(bounds: Bounds): void {
    if (this.distance > LASER_DISTANCE * bounds.w) {
      this.dead = true
    }

    this.x += this.xv
    this.y += this.yv

    this.distance += Math.sqrt(Math.pow(this.xv, 2) + Math.pow(this.yv, 2))

    // this.checkEdge(bounds)
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

interface ShipConfig {
  x: number
  y: number
  r: number
  a: number
  size?: number
  rot?: number
  thrustAcceleration?: number
  bounds?: Bounds
}

class Ship {
  x: number
  y: number
  r: number
  a: number
  size: number
  rot: number
  isThursting = false
  explodeTime = 0
  blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
  blinkNumber = Math.ceil(SHIP_INVUL_DURATION / SHIP_BLINK_DURATION)
  bounds: Bounds
  lasers: Laser[] = []
  thrustAcceleration: number
  canShoot = true
  shooting = false
  dead = false
  thrustMag = {
    x: 0,
    y: 0,
  }

  constructor(config: ShipConfig) {
    this.x = config.x
    this.y = config.y
    this.r = config.r
    this.a = config.a
    this.size = config.size ?? SHIP_SIZE
    this.rot = config.rot ?? 0
    this.bounds = config.bounds ?? { x: 0, y: 0, w: 0, h: 0 }
    this.thrustAcceleration = config.thrustAcceleration ?? SHIP_THRUST
  }

  fireLaser(): void {
    const { x, y, r, a } = this

    if (this.canShoot /* && ship.lasers.length < LASER_MAX */) {
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

    // this.canShoot = false
  }

  explode(): void {
    this.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS)
  }

  thrust(): void {
    this.isThursting = true
  }

  cutThrust(): void {
    this.isThursting = false
  }

  rotate(rot: number): void {
    this.rot = rot
  }

  checkEdge(): void {
    const { x, y, r, bounds } = this

    if (x < 0 - r) {
      this.x = bounds.w + r
    }

    if (x > bounds.w + r) {
      this.x = 0 - r
    }

    if (y < 0 - r) {
      this.y = bounds.h + r
    }

    if (y > bounds.h + r) {
      this.y = 0 - r
    }
  }

  updateLasers(bounds: Bounds): void {
    this.lasers.forEach((laser) => {
      laser.update(bounds)
    })
    this.lasers = this.lasers.filter((laser) => !laser.dead)
  }

  update(): void {
    const { a, rot, isThursting, thrustAcceleration, blinkNumber } = this

    this.updateLasers(this.bounds)

    if (this.isExploding() || this.dead) {
      return
    }

    if (this.shooting && this.canShoot) {
      this.fireLaser()
      this.canShoot = false
      setTimeout(() => {
        this.canShoot = true
      }, 200)
    }

    if (isThursting) {
      this.thrustMag.x += (thrustAcceleration * Math.cos(a)) / FPS
      this.thrustMag.y -= (thrustAcceleration * Math.sin(a)) / FPS
    } else {
      this.thrustMag.x -= (FRICTION * this.thrustMag.x) / FPS
      this.thrustMag.y -= (FRICTION * this.thrustMag.y) / FPS
    }

    this.x += this.thrustMag.x
    this.y += this.thrustMag.y

    this.checkEdge()
    this.a += rot

    if (blinkNumber > 0) {
      this.blinkTime -= 1

      if (this.blinkTime === 0) {
        this.blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
        this.blinkNumber -= 1
      }
    }
  }

  drawLasers(ctx: CanvasRenderingContext2D): void {
    const { lasers } = this

    lasers.forEach((laser) => {
      laser.draw(ctx)
    })
  }

  drawShip(ctx: CanvasRenderingContext2D, DEBUG: DebugFlags): void {
    if (!this.isBlinkOn() || this.dead) return

    const { x, y, r, a } = this

    if (DEBUG.DEBUG_SHOW_BOUNDING) {
      ctx.strokeStyle = this.isExploding() ? 'red' : 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = getColourByPlayer(player)
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

    if (DEBUG.DEBUG_SHIP_CENTER) {
      ctx.fillStyle = 'red'
      ctx.fillRect(x - 1, y - 1, 2, 2)
    }
  }

  drawThurster(ctx: CanvasRenderingContext2D): void {
    if (!this.isBlinkOn()) return

    const { x, y, r, a } = this

    ctx.strokeStyle = SHIP_THRUST_COLOUR
    // Previously `shipSize / 10` where `shipSize` was undefined (NaN, ignored by canvas),
    // so the thruster was effectively drawn with SHIP_LINE_WIDTH. Kept that behaviour explicit.
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

  drawExplosion(ctx: CanvasRenderingContext2D): void {
    const { x, y, r } = this

    ctx.strokeStyle = 'red'
    ctx.beginPath()
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2, false)
    ctx.stroke()

    ctx.strokeStyle = 'orange'
    ctx.beginPath()
    ctx.arc(x, y, r * 1, 0, Math.PI * 2, false)
    ctx.stroke()

    ctx.strokeStyle = 'yellow'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2, false)
    ctx.stroke()

    ctx.strokeStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, r * 0.25, 0, Math.PI * 2, false)
    ctx.stroke()
  }

  isBlinkOn(): boolean {
    return this.blinkNumber % 2 === 0
  }

  isExploding(): boolean {
    return this.explodeTime > 0
  }

  draw(ctx: CanvasRenderingContext2D, DEBUG: DebugFlags): void {
    const { isThursting } = this

    if (isThursting && !this.isExploding() && !this.dead) {
      this.drawThurster(ctx)
    }

    if (!this.isExploding()) {
      this.drawShip(ctx, DEBUG)
    } else {
      this.drawExplosion(ctx)
    }

    this.drawLasers(ctx)
  }
}

interface AsteroidConfig {
  x: number
  y: number
  xv: number
  yv: number
  r: number
  a: number
  verticies: number
  offsets: number[]
}

class Asteroid {
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

  checkEdge(bounds: Bounds): void {
    const { x, y, r } = this

    if (x < 0 - r) {
      this.x = bounds.w + r
    }

    if (x > bounds.w + r) {
      this.x = 0 - r
    }

    if (y < 0 - r) {
      this.y = bounds.h + r
    }

    if (y > bounds.h + r) {
      this.y = 0 - r
    }
  }

  update(bounds: Bounds): void {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tuning flag
    if (!ASTEROID_MOVES) return

    const { x, y, xv, yv } = this

    this.x = x + xv
    this.y = y + yv

    this.checkEdge(bounds)
  }

  draw(ctx: CanvasRenderingContext2D, DEBUG: DebugFlags): void {
    const { x, y, r, a, verticies, offsets } = this

    if (DEBUG.DEBUG_SHOW_BOUNDING) {
      ctx.strokeStyle = 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = ASTEROID_COLOURS[getLevelColour(level + 1)] ?? 'white'
    ctx.lineWidth = ASTEROID_LINE_WIDTH

    ctx.beginPath()

    ctx.moveTo(x + r * (offsets[0] ?? 1) * Math.cos(a), y + r * (offsets[0] ?? 1) * Math.sin(a))

    for (let i = 1; i < verticies; i += 1) {
      ctx.lineTo(
        x + r * (offsets[i] ?? 1) * Math.cos(a + (i * Math.PI * 2) / verticies),
        y + r * (offsets[i] ?? 1) * Math.sin(a + (i * Math.PI * 2) / verticies),
      )
    }

    ctx.closePath()
    ctx.stroke()
  }
}

class AsteroidFactory {
  bounds: Bounds
  asteroids: Asteroid[] = []
  levelMultiplier = 1

  constructor(config: { bounds: Bounds }) {
    this.bounds = config.bounds
  }

  destroyAsteroid(asteroid: Asteroid): void {
    asteroid.dead = true

    if (asteroid.r === Math.ceil(ASTEROID_SIZE / 2)) {
      // biggest

      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 4))
      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 4))

      score.add(20)
      return
    }

    if (asteroid.r === Math.ceil(ASTEROID_SIZE / 4)) {
      // medium

      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 8))
      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 8))

      score.add(50)
      return
    }

    score.add(100)
  }

  checkCollisions(ship: Ship): void {
    this.asteroids.forEach((asteroid) => {
      ship.lasers.forEach((laser) => {
        if (
          distanceBetweenPoints(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.r &&
          !laser.dead
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
      level += 1
      colourIndex += 1
      newLevel()
    }
  }

  createAsteroidBelt(config: { ASTEROID_NUM: number; ship: Ship; level: number }): void {
    const { ASTEROID_NUM, ship, level } = config
    this.levelMultiplier = 1 + 0.1 * level
    this.asteroids = []

    for (let i = 0; i < ASTEROID_NUM + level * ASTEROID_NUM_ADD; i += 1) {
      let x: number
      let y: number

      do {
        x = Math.floor(Math.random() * canvas.width)
        y = Math.floor(Math.random() * canvas.height)
      } while (distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r)
      this.newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2))
    }
  }

  createJagOffset(vertices: number): number[] {
    let arr: number[] = []

    for (let i = 0; i < vertices; i += 1) {
      arr = [...arr, Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG]
    }

    return arr
  }

  newAsteroid(x: number, y: number, r: number): void {
    const { asteroids, levelMultiplier } = this
    const verticies = Math.floor(Math.random() * (ASTEROID_VERTICIES + 1) + ASTEROID_VERTICIES / 2)
    this.asteroids = [
      ...asteroids,
      new Asteroid({
        x,
        y,
        verticies,
        xv:
          ((Math.random() * ASTEROID_SPEED * levelMultiplier) / FPS) *
          (Math.random() < 0.5 ? 1 : -1),
        yv:
          ((Math.random() * ASTEROID_SPEED * levelMultiplier) / FPS) *
          (Math.random() < 0.5 ? 1 : -1),
        r: r,
        a: Math.random() * Math.PI * 2,
        offsets: this.createJagOffset(verticies),
      }),
    ]
  }

  update(ship: Ship): void {
    this.checkCollisions(ship)
    this.asteroids.forEach((asteroid) => {
      asteroid.update(this.bounds)
    })
  }

  draw(ctx: CanvasRenderingContext2D, DEBUG: DebugFlags): void {
    this.asteroids.forEach((asteroid) => {
      asteroid.draw(ctx, DEBUG)
    })
  }
}

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')
if (!context) throw new Error('Canvas 2D context is not supported')
const ctx = context

const resize = (): void => {
  setCanvasSize()
  ship.bounds = {
    x: 0,
    y: 0,
    w: canvas.width,
    h: canvas.height,
  }

  asteroidFactory.bounds = {
    x: 0,
    y: 0,
    w: canvas.width,
    h: canvas.height,
  }
}

const setCanvasSize = (): void => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

const keyDown = (evnt: KeyboardEvent): void => {
  if (ship.dead) return
  console.log('key', evnt.code)

  switch (evnt.code) {
    case 'Escape':
      evnt.preventDefault()
      is_game_paused = !is_game_paused
      break
    case 'Space':
      ship.shooting = true
      break
    case 'ArrowLeft':
      ship.rotate(((SHIP_TURN_SPEED / 180) * Math.PI) / FPS)
      break
    case 'ArrowUp':
      ship.thrust()
      break
    case 'ArrowRight':
      ship.rotate(((-SHIP_TURN_SPEED / 180) * Math.PI) / FPS)
      break
    default:
      break
  }
}

const keyUp = (evnt: KeyboardEvent): void => {
  if (ship.dead) return

  switch (evnt.code) {
    case 'Space':
      ship.shooting = false
      break
    case 'ArrowLeft':
      ship.rotate(0)
      break
    case 'ArrowUp':
      ship.cutThrust()
      break
    case 'ArrowRight':
      ship.rotate(0)
      break
    default:
      break
  }
}

const drawLives = (ctx: CanvasRenderingContext2D): void => {
  for (let i = 0; i < lives; i += 1) {
    const life = new Ship({
      x: SHIP_SIZE + i * SHIP_SIZE * 1.2,
      y: SHIP_SIZE,
      r: SHIP_SIZE / 2,
      a: 0.5 * Math.PI,
    })

    life.draw(ctx, {
      DEBUG_SHIP_CENTER,
      DEBUG_SHOW_BOUNDING,
    })
  }
}

const update = (): void => {
  if (is_game_paused) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ship.update()
  asteroidFactory.update(ship)

  ship.draw(ctx, {
    DEBUG_SHIP_CENTER,
    DEBUG_SHOW_BOUNDING,
  })
  asteroidFactory.draw(ctx, {
    DEBUG_SHOW_BOUNDING,
  })

  if (ship.isExploding()) {
    ship.explodeTime -= 1

    if (!ship.isExploding()) {
      if (lives <= 0) {
        gameOver()
      } else {
        lives -= 1
        ship = newShip()
      }
    }
  }

  if (textAlpha >= 0) {
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgba(255, 255, 255, ${String(textAlpha)})`
    ctx.font = `small-caps ${String(TEXT_SIZE)}px arial`
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.75)
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS
  } else if (ship.dead) {
    newGame()
  }

  drawLives(ctx)

  ctx.fillStyle = TEXT_COLOR_SCORE
  ctx.textAlign = 'right'
  ctx.font = `small-caps ${String(TEXT_SIZE)}px arial`
  ctx.fillText(String(score.score), canvas.width - SHIP_SIZE, SHIP_SIZE)

  ctx.fillStyle = TEXT_COLOUR_HIGHSCORE
  ctx.textAlign = 'center'
  ctx.font = `small-caps ${String(TEXT_SIZE * 0.5)}px arial`
  ctx.fillText(`High Score: ${String(score.highscore)}`, canvas.width / 2, SHIP_SIZE)
}

setCanvasSize()
document.body.appendChild(canvas)
let ship = newShip()
let level = 0
let lives = SHIP_LIVES
let text = ''
let colourIndex = 0
let textAlpha = 0
const score = new Score()

const newGame = (): void => {
  score.reset()
  level = 0
  lives = SHIP_LIVES
  ship = newShip()
  colourIndex = 0
  newLevel()
}

const newLevel = (): void => {
  text = `Level ${String(level + 1)}`
  textAlpha = 1
  asteroidFactory.createAsteroidBelt({ ASTEROID_NUM, ship, level })

  if (colourIndex >= ASTEROID_COLOURS.length) {
    colourIndex = 0
  }
}

const asteroidFactory = new AsteroidFactory({
  bounds: { x: 0, y: 0, w: canvas.width, h: canvas.height },
})

window.addEventListener('resize', resize)
window.addEventListener('keydown', keyDown)
window.addEventListener('keyup', keyUp)

newGame()
setInterval(update, 1000 / FPS)
