import { KEY_HIGHSCORE } from './config'

export class Score {
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
