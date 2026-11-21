import { describe, expect, it } from 'vitest'
import {
  type Body,
  circlesOverlap,
  clampSpeed,
  mass,
  resolveCollision,
  separateBodies,
} from './collision'

const body = (x: number, y: number, xv: number, yv: number, r: number): Body => ({
  x,
  y,
  xv,
  yv,
  r,
})

const momentum = (...bodies: Body[]): { x: number; y: number } => ({
  x: bodies.reduce((sum, b) => sum + mass(b) * b.xv, 0),
  y: bodies.reduce((sum, b) => sum + mass(b) * b.yv, 0),
})
const kineticEnergy = (...bodies: Body[]): number =>
  bodies.reduce((sum, b) => sum + 0.5 * mass(b) * (b.xv ** 2 + b.yv ** 2), 0)

describe('circlesOverlap', () => {
  it('detects overlapping and separate circles', () => {
    expect(circlesOverlap(body(0, 0, 0, 0, 10), body(15, 0, 0, 0, 10))).toBe(true)
    expect(circlesOverlap(body(0, 0, 0, 0, 10), body(25, 0, 0, 0, 10))).toBe(false)
  })
})

describe('separateBodies', () => {
  it('moves overlapping circles until they just touch', () => {
    const a = body(0, 0, 0, 0, 10)
    const b = body(15, 0, 0, 0, 10)
    separateBodies(a, b)
    expect(b.x - a.x).toBeCloseTo(20)
    expect(a.x).toBeCloseTo(-2.5) // equal mass: each moves half the overlap
  })

  it('moves the lighter body further', () => {
    const big = body(0, 0, 0, 0, 20)
    const small = body(25, 0, 0, 0, 10)
    separateBodies(big, small)
    expect(Math.abs(small.x - 25)).toBeGreaterThan(Math.abs(big.x))
    expect(small.x - big.x).toBeCloseTo(30)
  })

  it('copes with coincident centres', () => {
    const a = body(5, 5, 0, 0, 10)
    const b = body(5, 5, 0, 0, 10)
    separateBodies(a, b)
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(20)
  })
})

describe('resolveCollision', () => {
  it('swaps velocities in a head-on elastic collision of equal masses', () => {
    const a = body(0, 0, 2, 0, 10)
    const b = body(20, 0, -1, 0, 10)
    const closing = resolveCollision(a, b, 1)
    expect(closing).toBeCloseTo(3)
    expect(a.xv).toBeCloseTo(-1)
    expect(b.xv).toBeCloseTo(2)
  })

  it('conserves momentum and (when elastic) kinetic energy for unequal, glancing collisions', () => {
    const a = body(0, 0, 3, 1, 25)
    const b = body(30, 20, -2, -1, 10)
    const p0 = momentum(a, b)
    const e0 = kineticEnergy(a, b)

    resolveCollision(a, b, 1)

    const p1 = momentum(a, b)
    expect(p1.x).toBeCloseTo(p0.x)
    expect(p1.y).toBeCloseTo(p0.y)
    expect(kineticEnergy(a, b)).toBeCloseTo(e0)
  })

  it('loses energy with restitution below 1', () => {
    const a = body(0, 0, 2, 0, 10)
    const b = body(20, 0, -2, 0, 10)
    const e0 = kineticEnergy(a, b)
    resolveCollision(a, b, 0.5)
    expect(kineticEnergy(a, b)).toBeLessThan(e0)
  })

  it('does nothing when the bodies are already moving apart', () => {
    const a = body(0, 0, -1, 0, 10)
    const b = body(20, 0, 1, 0, 10)
    expect(resolveCollision(a, b, 1)).toBe(0)
    expect(a.xv).toBe(-1)
    expect(b.xv).toBe(1)
  })
})

describe('clampSpeed', () => {
  it('scales velocity down to the cap, keeping direction', () => {
    const b = body(0, 0, 6, 8, 10) // speed 10
    clampSpeed(b, 5)
    expect(b.xv).toBeCloseTo(3)
    expect(b.yv).toBeCloseTo(4)
  })

  it('leaves slower bodies alone, and does nothing when the cap is 0', () => {
    const b = body(0, 0, 3, 4, 10)
    clampSpeed(b, 10)
    expect([b.xv, b.yv]).toEqual([3, 4])
    clampSpeed(b, 0)
    expect([b.xv, b.yv]).toEqual([3, 4])
  })
})
