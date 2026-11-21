import { DEBUG, SHIP_SIZE, TEXT_COLOUR_HIGHSCORE, TEXT_COLOUR_SCORE, TEXT_SIZE } from './config'
import { Ship } from './entities/ship'
import type { Score } from './score'

const font = (size: number): string => `small-caps ${String(size)}px arial`

export const drawLives = (ctx: CanvasRenderingContext2D, lives: number, colour: string): void => {
  for (let i = 0; i < lives; i += 1) {
    const life = new Ship({
      x: SHIP_SIZE + i * SHIP_SIZE * 1.2,
      y: SHIP_SIZE,
      r: SHIP_SIZE / 2,
      a: 0.5 * Math.PI,
      colour,
    })

    life.draw(ctx, DEBUG)
  }
}

export const drawScore = (ctx: CanvasRenderingContext2D, score: Score, width: number): void => {
  ctx.fillStyle = TEXT_COLOUR_SCORE
  ctx.textAlign = 'right'
  ctx.font = font(TEXT_SIZE)
  ctx.fillText(String(score.score), width - SHIP_SIZE, SHIP_SIZE)

  ctx.fillStyle = TEXT_COLOUR_HIGHSCORE
  ctx.textAlign = 'center'
  ctx.font = font(TEXT_SIZE * 0.5)
  ctx.fillText(`High Score: ${String(score.highscore)}`, width / 2, SHIP_SIZE)
}

export const drawMessage = (
  ctx: CanvasRenderingContext2D,
  text: string,
  alpha: number,
  width: number,
  height: number,
): void => {
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = `rgba(255, 255, 255, ${String(alpha)})`
  ctx.font = font(TEXT_SIZE)
  ctx.fillText(text, width / 2, height * 0.75)
}
