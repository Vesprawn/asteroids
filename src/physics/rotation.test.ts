import { describe, expect, it } from 'vitest'
import { randomSpin, type SpinOptions } from './rotation'

const options: SpinOptions = {
  minDegPerSec: 10,
  maxDegPerSec: 60,
  sizeExponent: 0,
  referenceRadius: 50,
  fps: 30,
}
const toDegPerSec = (radPerFrame: number): number => (radPerFrame * 180 * 30) / Math.PI

describe('randomSpin', () => {
  it('stays within the configured range', () => {
    expect(toDegPerSec(randomSpin(50, () => 0, options))).toBeCloseTo(10)
    expect(Math.abs(toDegPerSec(randomSpin(50, () => 0.999999, options)))).toBeCloseTo(60, 3)
  })

  it('spins in either direction', () => {
    const rolls = [0.5, 0.2] // speed roll, then direction roll
    const random = (): number => rolls.shift() ?? 0
    expect(randomSpin(50, random, options)).toBeGreaterThan(0)
    expect(randomSpin(50, () => 0.9, options)).toBeLessThan(0)
  })

  it('makes smaller asteroids spin faster when size scaling is enabled', () => {
    const scaled = { ...options, sizeExponent: 1 }
    const large = randomSpin(50, () => 0, scaled)
    const small = randomSpin(12.5, () => 0, scaled)
    expect(small / large).toBeCloseTo(4)
  })

  it('is disabled when min and max are 0', () => {
    expect(randomSpin(50, () => 0.3, { ...options, minDegPerSec: 0, maxDegPerSec: 0 })).toBe(0)
  })
})
