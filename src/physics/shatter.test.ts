import { describe, expect, it } from 'vitest'
import { ASTEROID_RADIUS_LARGE, ASTEROID_RADIUS_MEDIUM, ASTEROID_RADIUS_SMALL } from '../config'
import { canShatter, fragmentRadius, shatterChance } from './shatter'

describe('fragmentRadius (shatter chain)', () => {
  it('large → medium → small → nothing', () => {
    expect(fragmentRadius(ASTEROID_RADIUS_LARGE)).toBe(ASTEROID_RADIUS_MEDIUM)
    expect(fragmentRadius(ASTEROID_RADIUS_MEDIUM)).toBe(ASTEROID_RADIUS_SMALL)
    expect(fragmentRadius(ASTEROID_RADIUS_SMALL)).toBeUndefined()
    expect(canShatter(ASTEROID_RADIUS_SMALL)).toBe(false)
  })
})

describe('shatterChance', () => {
  const options = { minImpact: 40, fullImpact: 120, maxChance: 0.6 }

  it('is zero below the minimum impact speed', () => {
    expect(shatterChance(0, options)).toBe(0)
    expect(shatterChance(39.9, options)).toBe(0)
  })

  it('scales linearly between minimum and full impact', () => {
    expect(shatterChance(40, options)).toBe(0)
    expect(shatterChance(80, options)).toBeCloseTo(0.3)
    expect(shatterChance(120, options)).toBeCloseTo(0.6)
  })

  it('is capped at the maximum chance', () => {
    expect(shatterChance(1000, options)).toBeCloseTo(0.6)
  })

  it('acts as a simple threshold when full impact is not above minimum', () => {
    expect(shatterChance(50, { minImpact: 50, fullImpact: 50, maxChance: 0.25 })).toBe(0.25)
  })
})
