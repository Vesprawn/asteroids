import type { DebugFlags } from './types'

export const FPS = 30 // frames per second
export const FRICTION = 0.7 // friction coefficient of space 0 = none, 1 = lots

export const ASTEROID_MOVES = true // [true] controls if asteroids will update positions
export const ASTEROID_JAG = 0.4 // jaggedness of the asteroids 0 = none, 1 = lots
export const ASTEROID_NUM = 3 // [3] starting number of asteroids
export const ASTEROID_NUM_ADD = 1 // [1] additional number per level
export const ASTEROID_SIZE = 100 // starting size of asteroids in pixels
export const ASTEROID_SPEED = 50 // max starting speed in pixels per second
export const ASTEROID_VERTICIES = 10 // average number of verticies on each asteroid
export const ASTEROID_LINE_WIDTH = 2
export const ASTEROID_COLOURS = ['slategrey', 'yellow', 'lime', 'blue', '#800080', 'red']
export const ASTEROID_POINTS_LARGE = 20
export const ASTEROID_POINTS_MEDIUM = 50
export const ASTEROID_POINTS_SMALL = 100
export const LEVELS_PER_COLOUR = 5 // [20]

export const LASER_COLOUR = '#e6ffff' //  'white' // 'magenta'
export const LASER_DISTANCE = 0.6 // max distance can travel as fraction of screen width
export const LASER_SPEED = 500 // speed of lasers in pixels
export const LASER_COOLDOWN_MS = 200 // minimum time between shots

export const SHIP_BLINK_DURATION = 0.1 // duration of ship blink during invulnerability
export const SHIP_INVUL_DURATION = 3 // duration of ship invulnerability after explotion
export const SHIP_EXPLODE_DURATION = 0.3 // duration of ship explosion
export const SHIP_SIZE = 30 // ship size in pixels
export const SHIP_LINE_WIDTH = 2
export const SHIP_TURN_SPEED = 260 // 360 // ship turn speed in degrees per second
export const SHIP_THRUST = 5 // acceleration of ship in pixels per second per second
export const SHIP_THRUST_COLOUR = 'cyan'
export const SHIP_LIVES = 3 // starting lives

export const TEXT_FADE_TIME = 2.5 // text fade time in seconds
export const TEXT_SIZE = 30 // font height in pixels
export const TEXT_COLOUR_HIGHSCORE = 'yellow' // 'magenta'
export const TEXT_COLOUR_SCORE = 'white'

export const KEY_HIGHSCORE = 'highscore' // localStorage key

export const DEBUG: DebugFlags = {
  showBounding: false,
  showShipCentre: false,
}
