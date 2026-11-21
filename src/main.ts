import './styles/normalize.css'
import './styles/style.css'

import { Game } from './game'
import { bindKeyboard } from './input'
import { getColourByPlayer, getPlayerName } from './player'

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('Canvas 2D context is not supported')

const fitCanvasToWindow = (): void => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

fitCanvasToWindow()
document.body.appendChild(canvas)

const game = new Game(canvas, ctx, getColourByPlayer(getPlayerName()))

window.addEventListener('resize', () => {
  fitCanvasToWindow()
  game.resize()
})
bindKeyboard(window, game)

game.start()
