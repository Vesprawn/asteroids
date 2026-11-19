const params = new Proxy(new URLSearchParams(window.location.search), {
  get: (searchParams, prop) => searchParams.get(prop)
})
// Get the value of "some_key" in eg "https://example.com/?some_key=some_value"
const player = params.name || '' // "some_value"

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
const SHIP_TURN_SPEED = 260// 360 // ship turn speed in degrees per second
const SHIP_THRUST = 5 // acceleration of ship in pixels per second per second
const SHIP_THRUST_COLOUR = 'cyan'
const SHIP_LIVES = 3 // starting lives
const TEXT_FADE_TIME = 2.5 // text fade time in seconds
const TEXT_SIZE = 30 // font height in pixels
const KEY_HIGHSCORE = 'highscore'
const LEVELS_PER_COLOUR = 5 // [20]

const TEXT_COLOUR_HIGHSCORE = 'yellow'// 'magenta'
const TEXT_COLOR_SCORE = 'white'

const distanceBetweenPoints = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

const getColourByPlayer = (playerName) => {
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

const newShip = () => {
  return new Ship({
    x: Math.floor(canvas.width / 2),
    y: Math.floor(canvas.height / 2),
    r: SHIP_SIZE / 2,
    a: 90 / 180 * Math.PI,
    size: SHIP_SIZE,
    thrustAcceleration: SHIP_THRUST,
    bounds: { x: 0, y: 0, w: canvas.width, h: canvas.height }
  })
}

class Score {
  constructor () {
    this.reset()
  }

  add (n) {
    this.score += n

    if (this.score > this.highscore) this.highscore += n
  }

  save () {
    localStorage.setItem(KEY_HIGHSCORE, this.highscore)
  }

  reset () {
    this.score = 0
    this.highscore = Number(localStorage.getItem(KEY_HIGHSCORE) || 0)
  }
}

const gameOver = () => {
  text = 'Game Over'
  textAlpha = 1
  ship.dead = true

  score.save()
}

const getLevelColour = (level) => {
  const i = Math.floor(level / LEVELS_PER_COLOUR)

  if (i > ASTEROID_COLOURS.length - 1) return i % ASTEROID_COLOURS.length
  return i
}

class Laser {
  constructor (config) {
    this.x = config.x
    this.y = config.y
    this.xv = config.xv
    this.yv = config.yv
    this.distance = 0
    this.dead = false
  }

  checkEdge (bounds) {
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

  update (bounds) {
    if (this.distance > LASER_DISTANCE * bounds.w) {
      this.dead = true
    }

    this.x += this.xv
    this.y += this.yv

    this.distance += Math.sqrt(Math.pow(this.xv, 2) + Math.pow(this.yv, 2))

    // this.checkEdge(bounds)
  }

  draw (ctx) {
    const { x, y } = this
    ctx.strokeStyle = LASER_COLOUR
    ctx.fillStyle = LASER_COLOUR
    ctx.beginPath()
    ctx.arc(x, y, SHIP_SIZE / 15, 0, Math.PI * 2, false)
    ctx.stroke()
    ctx.fill()
  }
}

class Ship {
  constructor (config) {
    this.x = config.x
    this.y = config.y
    this.r = config.r
    this.a = config.a
    this.size = config.size
    this.rot = config.rot || 0
    this.isThursting = false
    this.explodeTime = 0
    this.blinkTime = Math.ceil(SHIP_BLINK_DURATION * FPS)
    this.blinkNumber = Math.ceil(SHIP_INVUL_DURATION / SHIP_BLINK_DURATION)
    this.bounds = config.bounds
    this.lasers = []
    this.thrustAcceleration = config.thrustAcceleration
    this.canShoot = true
    this.dead = false
    this.turnSpeed = 0
    this.isTurningLeft = false
    this.isTurningRight = false
    this.thrustMag = {
      x: 0,
      y: 0
    }
  }

  fireLaser () {
    const { x, y, r, a } = this

    if (this.canShoot /* && ship.lasers.length < LASER_MAX */) {
      this.lasers = [...this.lasers, new Laser({
        x: x + 4 / 3 * r * Math.cos(a),
        y: y - 4 / 3 * r * Math.sin(a),
        xv: LASER_SPEED * Math.cos(a) / FPS,
        yv: -LASER_SPEED * Math.sin(a) / FPS
      })]
    }

    // this.canShoot = false
  }

  explode () {
    this.explodeTime = Math.ceil(SHIP_EXPLODE_DURATION * FPS)
  }

  thrust () {
    this.isThursting = true
  }

  cutThrust () {
    this.isThursting = false
  }

  rotate (rot) {
    this.rot = rot
  }

  checkEdge () {
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

  updateLasers (bounds) {
    this.lasers.forEach(laser => laser.update(bounds))
    this.lasers = this.lasers.filter(laser => !laser.dead)
  }

  update () {
    const { a, rot, isThursting, thrustAcceleration, blinkNumber } = this
    // const { isTurningLeft, isTurningRight } = this

    this.updateLasers(this.bounds)

    if (this.isExploding() || ship.dead) {
      return
    }

    if (this.shooting && this.canShoot) {
      this.fireLaser()
      this.canShoot = false
      setTimeout(() => {
        this.canShoot = true
      }, 200)
    }

    // if (this.isExploding()) return

    if (isThursting) {
      this.thrustMag.x += thrustAcceleration * Math.cos(a) / FPS
      this.thrustMag.y -= thrustAcceleration * Math.sin(a) / FPS
    } else {
      this.thrustMag.x -= FRICTION * this.thrustMag.x / FPS
      this.thrustMag.y -= FRICTION * this.thrustMag.y / FPS
    }

    // if (isTurningLeft) {
    //   ship.turnSpeed += SHIP_TURN_SPEED
    // } else if (isTurningRight) {
    //   ship.turnSpeed -= SHIP_TURN_SPEED
    // } else {
    //   if (ship.turnSpeed > 0) {
    //     ship.turnSpeed -= FRICTION * ship.turnSpeed / FPS
    //   } else {
    //     ship.turnSpeed += FRICTION * ship.turnSpeed / FPS
    //   }
    // }

    // this.rotate(ship.turnSpeed / 180 * Math.PI / FPS)

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

  drawLasers (ctx) {
    const { lasers } = this

    lasers.forEach(laser => laser.draw(ctx))
  }

  drawShip (ctx, DEBUG) {
    if (!this.isBlinkOn() || ship.dead) return

    const { x, y, r, a } = this

    if (DEBUG.DEBUG_SHOW_BOUNDING) {
      ctx.strokeStyle = (this.isExploding()) ? 'red' : 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = getColourByPlayer(player)
    ctx.lineWidth = SHIP_LINE_WIDTH

    ctx.beginPath()
    ctx.moveTo(
      x + 4 / 3 * r * Math.cos(a),
      y - 4 / 3 * r * Math.sin(a)
    )
    ctx.lineTo(
      x - r * (2 / 3 * Math.cos(a) + Math.sin(a)),
      y + r * (2 / 3 * Math.sin(a) - Math.cos(a))
    )

    // comment out to make a triangle only
    ctx.lineTo(x, y)

    ctx.lineTo(
      x - r * (2 / 3 * Math.cos(a) - Math.sin(a)),
      y + r * (2 / 3 * Math.sin(a) + Math.cos(a))
    )
    ctx.closePath()
    ctx.stroke()

    if (DEBUG.DEBUG_SHIP_CENTER) {
      ctx.fillStyle = 'red'
      ctx.fillRect(x - 1, y - 1, 2, 2)
    }
  }

  drawThurster (ctx) {
    if (!this.isBlinkOn()) return

    const { x, y, r, a, shipSize } = this

    ctx.strokeStyle = SHIP_THRUST_COLOUR
    ctx.lineWidth = shipSize / 10

    ctx.beginPath()
    ctx.moveTo(
      x - r * (2 / 3 * Math.cos(a) + 0.5 * Math.sin(a)),
      y + r * (2 / 3 * Math.sin(a) - 0.5 * Math.cos(a))
    )

    ctx.lineTo(
      x - r * (5 / 3 * Math.cos(a)),
      y + r * (5 / 3 * Math.sin(a))
    )
    ctx.lineTo(
      x - r * (2 / 3 * Math.cos(a) - 0.5 * Math.sin(a)),
      y + r * (2 / 3 * Math.sin(a) + 0.5 * Math.cos(a))
    )

    // comment out if triangle only
    ctx.lineTo(x, y)

    ctx.closePath()
    ctx.stroke()
  }

  drawExplosion (ctx) {
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

  isBlinkOn () {
    return (this.blinkNumber % 2 === 0)
  }

  isExploding (explodeTime) {
    return (this.explodeTime > 0)
  }

  draw (ctx, DEBUG) {
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

class Asteroid {
  constructor (config) {
    this.x = config.x
    this.y = config.y
    this.xv = config.xv
    this.yv = config.yv
    this.r = config.r
    this.a = config.a
    this.verticies = config.verticies
    this.offsets = config.offsets
  }

  checkEdge (bounds) {
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

  update (bounds) {
    if (!ASTEROID_MOVES) return

    const { x, y, xv, yv } = this

    this.x = x + xv
    this.y = y + yv

    this.checkEdge(bounds)
  }

  draw (ctx, DEBUG) {
    const { x, y, r, a, verticies, offsets } = this

    if (DEBUG.DEBUG_SHOW_BOUNDING) {
      ctx.strokeStyle = 'lime'
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.stroke()
    }

    ctx.strokeStyle = ASTEROID_COLOURS[getLevelColour(level + 1)]
    ctx.lineWidth = ASTEROID_LINE_WIDTH

    ctx.beginPath()

    ctx.moveTo(
      x + r * offsets[0] * Math.cos(a),
      y + r * offsets[0] * Math.sin(a)
    )

    for (let i = 1; i < verticies; i += 1) {
      ctx.lineTo(
        x + r * offsets[i] * Math.cos(a + i * Math.PI * 2 / verticies),
        y + r * offsets[i] * Math.sin(a + i * Math.PI * 2 / verticies)
      )
    }

    ctx.closePath()
    ctx.stroke()
  }
}

class AsteroidFactory {
  constructor (config) {
    this.bounds = config.bounds
    this.asteroids = []
  }

  destroyAsteroid (asteroid) {
    asteroid.dead = true

    if (asteroid.r === Math.ceil(ASTEROID_SIZE / 2)) {
      // biggest

      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 4))
      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 4))

      return score.add(20)
    }

    if (asteroid.r === Math.ceil(ASTEROID_SIZE / 4)) {
      // medium

      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 8))
      this.newAsteroid(asteroid.x, asteroid.y, Math.ceil(ASTEROID_SIZE / 8))

      return score.add(50)
    }

    score.add(100)
  }

  checkCollisions (ship) {
    this.asteroids.forEach(asteroid => {
      ship.lasers.forEach(laser => {
        if ((distanceBetweenPoints(laser.x, laser.y, asteroid.x, asteroid.y) < asteroid.r && !laser.dead)) {
          this.destroyAsteroid(asteroid)
          laser.dead = true
        }
      })

      if (!ship.isExploding() && ship.blinkNumber === 0 && !ship.dead) {
        if (distanceBetweenPoints(ship.x, ship.y, asteroid.x, asteroid.y) <= ship.r + asteroid.r && !ship.isExploding()) {
          this.destroyAsteroid(asteroid)
          ship.explode()
        }
      }
    })

    this.asteroids = this.asteroids.filter(asteroid => !asteroid.dead)

    if (this.asteroids.length === 0) {
      level += 1
      colourIndex += 1
      newLevel()
    }
  }

  createAsteroidBelt (config) {
    const { ASTEROID_NUM, ship, level } = config
    this.levelMultiplier = 1 + 0.1 * level
    this.asteroids = []

    for (let i = 0; i < ASTEROID_NUM + (level * ASTEROID_NUM_ADD); i += 1) {
      let x = 0
      let y = 0

      do {
        x = Math.floor(Math.random() * canvas.width)
        y = Math.floor(Math.random() * canvas.height)
      } while (distanceBetweenPoints(ship.x, ship.y, x, y) < ASTEROID_SIZE * 2 + ship.r)
      this.newAsteroid(x, y, Math.ceil(ASTEROID_SIZE / 2))
    }
  }

  createJagOffset (vertices) {
    let arr = []

    for (let i = 0; i < vertices; i += 1) {
      arr = [...arr, Math.random() * ASTEROID_JAG * 2 + 1 - ASTEROID_JAG]
    }

    return arr
  }

  newAsteroid (x, y, r) {
    const { asteroids, levelMultiplier } = this
    const verticies = Math.floor(Math.random() * (ASTEROID_VERTICIES + 1) + ASTEROID_VERTICIES / 2)
    this.asteroids = [...asteroids, new Asteroid({
      x,
      y,
      verticies,
      xv: Math.random() * ASTEROID_SPEED * levelMultiplier / FPS * (Math.random() < 0.5 ? 1 : -1),
      yv: Math.random() * ASTEROID_SPEED * levelMultiplier / FPS * (Math.random() < 0.5 ? 1 : -1),
      r: r,
      a: Math.random() * Math.PI * 2,
      offsets: this.createJagOffset(verticies)
    })]
  }

  update (ship) {
    this.checkCollisions(ship)
    this.asteroids.forEach(asteroid => asteroid.update(this.bounds))
  }

  draw (ctx, DEBUG) {
    this.asteroids.forEach(asteroid => asteroid.draw(ctx, DEBUG))
  }
}

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

const resize = () => {
  setCanvasSize()
  if (ship) {
    ship.bounds = {
      x: 0, y: 0, w: canvas.width, h: canvas.height
    }
  }

  if (asteroidFactory) {
    asteroidFactory.bounds = {
      x: 0, y: 0, w: canvas.width, h: canvas.height
    }
  }
}

const setCanvasSize = () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

const keyDown = (evnt) => {
  if (ship.dead) return

  switch (evnt.keyCode) {
    case 32: // space
      ship.shooting = true
      // ship.fireLaser()
      break
    case 37: // left
    // ship.isTurningLeft = true
      // if (ship.turnSpeed < 0) ship.turnSpeed = 0

      // ship.turnSpeed += SHIP_TURN_SPEED
      // ship.rotate(ship.turnSpeed / 180 * Math.PI / FPS)
      ship.rotate(SHIP_TURN_SPEED / 180 * Math.PI / FPS)
      break
    case 38: // up
      ship.thrust()
      break
    case 39: // right
      // ship.isTurningRight = true
    // if (ship.turnSpeed > 0) ship.turnSpeed = 0
    //   ship.turnSpeed += -SHIP_TURN_SPEED
    //   ship.rotate(ship.turnSpeed / 180 * Math.PI / FPS)
      ship.rotate(-SHIP_TURN_SPEED / 180 * Math.PI / FPS)
      break
    default:
      break
  }
}

const keyUp = (evnt) => {
  if (ship.dead) return

  switch (evnt.keyCode) {
    case 32: // space
      // ship.canShoot = true
      ship.shooting = false
      break
    case 37: // left
      // ship.isTurningLeft = false
      ship.rotate(0)
      break
    case 38: // up
      ship.cutThrust()
      break
    case 39: // right
      // ship.isTurningRight = true
      ship.rotate(0)
      break
    default:
      break
  }
}

const drawLives = (ctx) => {
  let liveObjects = []
  for (let i = 0; i < lives; i += 1) {
    const life = new Ship({
      x: SHIP_SIZE + i * SHIP_SIZE * 1.2,
      y: SHIP_SIZE,
      r: SHIP_SIZE / 2,
      a: 0.5 * Math.PI
    })
    liveObjects = [...liveObjects, life]

    life.draw(ctx, {
      DEBUG_SHIP_CENTER,
      DEBUG_SHOW_BOUNDING
    })
  }
}

const update = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ship.update()
  asteroidFactory.update(ship)

  ship.draw(ctx, {
    DEBUG_SHIP_CENTER,
    DEBUG_SHOW_BOUNDING
  })
  asteroidFactory.draw(ctx, {
    DEBUG_SHOW_BOUNDING
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
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`
    ctx.font = `small-caps ${TEXT_SIZE}px arial`
    ctx.fillText(text, canvas.width / 2, canvas.height * 0.75)
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS
  } else if (ship.dead) {
    newGame()
  }

  drawLives(ctx)

  ctx.fillStyle = TEXT_COLOR_SCORE
  ctx.textAlign = 'right'
  ctx.font = `small-caps ${TEXT_SIZE}px arial`
  ctx.fillText(score.score, canvas.width - SHIP_SIZE, SHIP_SIZE)

  ctx.fillStyle = TEXT_COLOUR_HIGHSCORE
  ctx.textAlign = 'center'
  ctx.font = `small-caps ${TEXT_SIZE * 0.5}px arial`
  ctx.fillText(`High Score: ${score.highscore}`, canvas.width / 2, SHIP_SIZE)
}

window.addEventListener('resize', resize)
window.addEventListener('keydown', keyDown)
window.addEventListener('keyup', keyUp)

setCanvasSize()
document.body.appendChild(canvas)
let ship
let level = 0
let lives
let text
let colourIndex = 0
let textAlpha
const score = new Score()

const newGame = () => {
  score.reset()
  level = 0
  lives = SHIP_LIVES
  ship = newShip()
  colourIndex = 0
  newLevel()
}

const newLevel = () => {
  text = `Level ${level + 1}`
  textAlpha = 1
  asteroidFactory.createAsteroidBelt({ ASTEROID_NUM, ship, level })

  if (colourIndex >= ASTEROID_COLOURS.length) {
    colourIndex = 0
  }
}

const asteroidFactory = new AsteroidFactory({ bounds: { x: 0, y: 0, w: canvas.width, h: canvas.height } })

newGame()
setInterval(update, 1000 / FPS)

// The following is for testing purposes only
// setInterval(() => {
//   level += 1
//   newLevel()
// }, 500)
