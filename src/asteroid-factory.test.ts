import { describe, expect, it, vi } from 'vitest'
import { AsteroidFactory } from './asteroid-factory'
import {
  ASTEROID_FRAGMENT_GRACE,
  ASTEROID_RADIUS_LARGE,
  ASTEROID_RADIUS_MEDIUM,
  ASTEROID_RADIUS_SMALL,
  FPS,
} from './config'
import { Asteroid } from './entities/asteroid'
import { Laser } from './entities/laser'
import { Ship } from './entities/ship'

const bounds = { x: 0, y: 0, w: 2000, h: 2000 }

// A ship far away that is still invulnerable, so it never collides with anything
const farShip = (): Ship => new Ship({ x: -10_000, y: -10_000, r: 15, a: 0 })

const asteroid = (
  x: number,
  xv: number,
  r: number,
  extra: Partial<{ graceFrames: number }> = {},
): Asteroid =>
  new Asteroid({
    x,
    y: 1000,
    xv,
    yv: 0,
    r,
    a: 0,
    spin: 0,
    verticies: 8,
    offsets: Array.from({ length: 8 }, () => 1),
    graceFrames: extra.graceFrames ?? 0,
  })

const setup = (random: () => number) => {
  const onScore = vi.fn()
  const onCleared = vi.fn()
  const factory = new AsteroidFactory({ bounds, onScore, onCleared, random })
  return { factory, onScore, onCleared }
}

// Px/frame closing speeds that are well above / below the shatter thresholds (in px/s)
const FAST = 300 / FPS / 2 // each asteroid moving at 150 px/s towards the other → 300 px/s impact
const SLOW = 10 / FPS / 2 // 10 px/s impact

describe('AsteroidFactory asteroid collisions', () => {
  it('bounces slow collisions without shattering', () => {
    const { factory } = setup(() => 0)
    const a = asteroid(1000, SLOW, ASTEROID_RADIUS_LARGE)
    const b = asteroid(1000 + ASTEROID_RADIUS_LARGE * 2 - 5, -SLOW, ASTEROID_RADIUS_LARGE)
    factory.asteroids = [a, b]

    factory.update(farShip())

    expect(factory.asteroids).toEqual([a, b])
    expect(a.xv).toBeCloseTo(-SLOW)
    expect(b.xv).toBeCloseTo(SLOW)
  })

  it('shatters both large asteroids into mediums on a hard hit when the rolls succeed', () => {
    const { factory, onScore } = setup(() => 0)
    factory.asteroids = [
      asteroid(1000, FAST, ASTEROID_RADIUS_LARGE),
      asteroid(1000 + ASTEROID_RADIUS_LARGE * 2 - 5, -FAST, ASTEROID_RADIUS_LARGE),
    ]

    factory.update(farShip())

    expect(factory.asteroids).toHaveLength(4)
    expect(factory.asteroids.every((x) => x.r === ASTEROID_RADIUS_MEDIUM)).toBe(true)
    expect(onScore).not.toHaveBeenCalled()
  })

  it('rolls separately for each asteroid', () => {
    // First roll succeeds (first asteroid shatters); every later roll fails, including the second
    // asteroid's (the shatter itself also draws random numbers for the fragments' shape and motion)
    const rolls = [0]
    const { factory } = setup(() => rolls.shift() ?? 0.99)
    const b = asteroid(1000 + ASTEROID_RADIUS_LARGE * 2 - 5, -FAST, ASTEROID_RADIUS_LARGE)
    factory.asteroids = [asteroid(1000, FAST, ASTEROID_RADIUS_LARGE), b]

    factory.update(farShip())

    expect(factory.asteroids).toContain(b)
    expect(factory.asteroids.filter((x) => x.r === ASTEROID_RADIUS_MEDIUM)).toHaveLength(2)
  })

  it('does not shatter when the roll is above the maximum chance', () => {
    const { factory } = setup(() => 0.99)
    factory.asteroids = [
      asteroid(1000, FAST, ASTEROID_RADIUS_LARGE),
      asteroid(1000 + ASTEROID_RADIUS_LARGE * 2 - 5, -FAST, ASTEROID_RADIUS_LARGE),
    ]

    factory.update(farShip())

    expect(factory.asteroids).toHaveLength(2)
  })

  it('shatters mediums into smalls, keeping the existing chain', () => {
    const { factory } = setup(() => 0)
    factory.asteroids = [
      asteroid(1000, FAST, ASTEROID_RADIUS_MEDIUM),
      asteroid(1000 + ASTEROID_RADIUS_MEDIUM * 2 - 5, -FAST, ASTEROID_RADIUS_MEDIUM),
    ]

    factory.update(farShip())

    expect(factory.asteroids).toHaveLength(4)
    expect(factory.asteroids.every((x) => x.r === ASTEROID_RADIUS_SMALL)).toBe(true)
  })

  it('never shatters small asteroids, they only bounce', () => {
    const { factory } = setup(() => 0)
    const a = asteroid(1000, FAST, ASTEROID_RADIUS_SMALL)
    const b = asteroid(1000 + ASTEROID_RADIUS_SMALL * 2 - 5, -FAST, ASTEROID_RADIUS_SMALL)
    factory.asteroids = [a, b]

    factory.update(farShip())

    expect(factory.asteroids).toEqual([a, b])
    expect(a.xv).toBeLessThan(0)
    expect(b.xv).toBeGreaterThan(0)
  })

  it('lets fragments in their grace period pass through any other asteroid', () => {
    const { factory } = setup(() => 0)
    const fragment = asteroid(1000, FAST, ASTEROID_RADIUS_MEDIUM, { graceFrames: 5 })
    const other = asteroid(1000 + ASTEROID_RADIUS_LARGE, -FAST, ASTEROID_RADIUS_LARGE)
    factory.asteroids = [fragment, other]

    factory.update(farShip())

    expect(factory.asteroids).toEqual([fragment, other]) // no shatter
    expect(fragment.xv).toBe(FAST) // no bounce
    expect(other.xv).toBe(-FAST)
  })

  it('collides normally once the grace period has ended', () => {
    const { factory } = setup(() => 0.99) // never shatter, so we only observe the bounce
    const graceFrames = Math.ceil(ASTEROID_FRAGMENT_GRACE * FPS)
    const a = asteroid(1000, SLOW, ASTEROID_RADIUS_MEDIUM, { graceFrames })
    // Overlapping, and still approaching each other when the grace period ends
    const b = asteroid(1040, -SLOW, ASTEROID_RADIUS_MEDIUM, { graceFrames })
    factory.asteroids = [a, b]

    for (let frame = 0; frame < graceFrames; frame += 1) {
      factory.update(farShip())
    }
    expect(a.xv).toBeCloseTo(SLOW) // ignored each other for the whole grace period

    factory.update(farShip())
    expect(a.xv).toBeLessThan(0) // now they bounce
  })

  it('gives fragments a grace period of ASTEROID_FRAGMENT_GRACE seconds', () => {
    const { factory } = setup(() => 0)
    factory.asteroids = [
      asteroid(1000, FAST, ASTEROID_RADIUS_LARGE),
      asteroid(1000 + ASTEROID_RADIUS_LARGE * 2 - 5, -FAST, ASTEROID_RADIUS_LARGE),
    ]

    factory.update(farShip())

    const expected = Math.ceil(ASTEROID_FRAGMENT_GRACE * FPS) - 1 // one frame has elapsed
    expect(factory.asteroids.every((x) => x.graceFrames === expected)).toBe(true)
  })

  it('still lets lasers destroy fragments in their grace period', () => {
    const { factory, onScore } = setup(() => 0.5)
    factory.asteroids = [asteroid(1000, 0, ASTEROID_RADIUS_MEDIUM, { graceFrames: 30 })]
    const ship = farShip()
    ship.lasers = [new Laser({ x: 1000, y: 1000, xv: 0, yv: 0 })]

    factory.update(ship)

    expect(factory.asteroids.every((x) => x.r === ASTEROID_RADIUS_SMALL)).toBe(true)
    expect(onScore).toHaveBeenCalledWith(50)
  })

  it('still lets fragments in their grace period hit the ship', () => {
    const { factory } = setup(() => 0.5)
    factory.asteroids = [asteroid(1000, 0, ASTEROID_RADIUS_MEDIUM, { graceFrames: 30 })]
    const ship = new Ship({ x: 1000, y: 1000, r: 15, a: 0 })
    ship.blinkNumber = 0 // not invulnerable

    factory.update(ship)

    expect(ship.isExploding()).toBe(true)
  })
})

describe('AsteroidFactory player hits', () => {
  it('still splits a large asteroid into two mediums and awards points', () => {
    const { factory, onScore } = setup(() => 0.5)
    factory.asteroids = [asteroid(1000, 0, ASTEROID_RADIUS_LARGE)]
    const ship = farShip()
    ship.lasers = [new Laser({ x: 1000, y: 1000, xv: 0, yv: 0 })]

    factory.update(ship)

    expect(factory.asteroids).toHaveLength(2)
    expect(factory.asteroids.every((x) => x.r === ASTEROID_RADIUS_MEDIUM)).toBe(true)
    expect(onScore).toHaveBeenCalledWith(20)
  })

  it('only scores once when two lasers hit the same asteroid in one frame', () => {
    const { factory, onScore } = setup(() => 0.5)
    factory.asteroids = [asteroid(1000, 0, ASTEROID_RADIUS_LARGE)]
    const ship = farShip()
    ship.lasers = [
      new Laser({ x: 1000, y: 1000, xv: 0, yv: 0 }),
      new Laser({ x: 1001, y: 1000, xv: 0, yv: 0 }),
    ]

    factory.update(ship)

    expect(onScore).toHaveBeenCalledTimes(1)
    expect(factory.asteroids).toHaveLength(2)
  })
})
