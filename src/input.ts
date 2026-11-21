import { FPS, SHIP_TURN_SPEED } from './config'
import type { Game } from './game'

const TURN_RATE = ((SHIP_TURN_SPEED / 180) * Math.PI) / FPS

/** Wires keyboard controls to the game. Returns a function that removes the listeners. */
export const bindKeyboard = (target: Window, game: Game): (() => void) => {
  const keyDown = (event: KeyboardEvent): void => {
    const { ship } = game
    if (ship.dead) return

    switch (event.code) {
      case 'Escape':
        event.preventDefault()
        game.togglePause()
        break
      case 'Space':
        ship.shooting = true
        break
      case 'ArrowLeft':
        ship.rotate(TURN_RATE)
        break
      case 'ArrowUp':
        ship.thrust()
        break
      case 'ArrowRight':
        ship.rotate(-TURN_RATE)
        break
      default:
        break
    }
  }

  const keyUp = (event: KeyboardEvent): void => {
    const { ship } = game
    if (ship.dead) return

    switch (event.code) {
      case 'Space':
        ship.shooting = false
        break
      case 'ArrowLeft':
      case 'ArrowRight':
        ship.rotate(0)
        break
      case 'ArrowUp':
        ship.cutThrust()
        break
      default:
        break
    }
  }

  target.addEventListener('keydown', keyDown)
  target.addEventListener('keyup', keyUp)

  return () => {
    target.removeEventListener('keydown', keyDown)
    target.removeEventListener('keyup', keyUp)
  }
}
