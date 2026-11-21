import { describe, expect, it } from 'vitest'
import { distanceBetweenPoints, wrapPosition } from './geometry'

const bounds = { x: 0, y: 0, w: 100, h: 50 }

describe('distanceBetweenPoints', () => {
  it('returns the euclidean distance', () => {
    expect(distanceBetweenPoints(0, 0, 3, 4)).toBe(5)
  })
})

describe('wrapPosition', () => {
  it('leaves a point inside the bounds unchanged', () => {
    expect(wrapPosition({ x: 50, y: 25 }, 10, bounds)).toEqual({ x: 50, y: 25 })
  })

  it('wraps only once the object has fully left the screen', () => {
    expect(wrapPosition({ x: -5, y: 25 }, 10, bounds)).toEqual({ x: -5, y: 25 })
    expect(wrapPosition({ x: -11, y: 25 }, 10, bounds)).toEqual({ x: 110, y: 25 })
    expect(wrapPosition({ x: 111, y: 61 }, 10, bounds)).toEqual({ x: -10, y: -10 })
  })
})
