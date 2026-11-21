import {
  ASTEROID_RADIUS_LARGE,
  ASTEROID_RADIUS_MEDIUM,
  ASTEROID_RADIUS_SMALL,
  ASTEROID_SHATTER_FULL_IMPACT,
  ASTEROID_SHATTER_MAX_CHANCE,
  ASTEROID_SHATTER_MIN_IMPACT,
} from '../config'

/** Number of fragments an asteroid breaks into. */
export const FRAGMENT_COUNT = 2

/**
 * The single source of truth for the shatter chain: large → medium → small → nothing.
 * Used for both laser hits and asteroid-asteroid collisions so the number of times an asteroid can
 * shatter is the same either way.
 *
 * @returns the radius of the fragments, or undefined if this asteroid cannot shatter.
 */
export const fragmentRadius = (r: number): number | undefined => {
  if (r === ASTEROID_RADIUS_LARGE) return ASTEROID_RADIUS_MEDIUM
  if (r === ASTEROID_RADIUS_MEDIUM) return ASTEROID_RADIUS_SMALL
  return undefined
}

export const canShatter = (r: number): boolean => fragmentRadius(r) !== undefined

export interface ShatterChanceOptions {
  /** Impact speed (px/s) below which a collision never shatters. */
  minImpact: number
  /** Impact speed (px/s) at or above which the chance is `maxChance`. */
  fullImpact: number
  /** Highest probability (0..1) that an asteroid shatters in a single collision. */
  maxChance: number
}

const DEFAULT_OPTIONS: ShatterChanceOptions = {
  minImpact: ASTEROID_SHATTER_MIN_IMPACT,
  fullImpact: ASTEROID_SHATTER_FULL_IMPACT,
  maxChance: ASTEROID_SHATTER_MAX_CHANCE,
}

/**
 * Probability that an asteroid shatters in a collision with the given impact (closing) speed in px/s.
 * Zero below `minImpact`, rising linearly to `maxChance` at `fullImpact`.
 */
export const shatterChance = (
  impactSpeed: number,
  options: ShatterChanceOptions = DEFAULT_OPTIONS,
): number => {
  const { minImpact, fullImpact, maxChance } = options

  if (impactSpeed < minImpact) return 0
  if (fullImpact <= minImpact) return maxChance

  const t = Math.min(1, (impactSpeed - minImpact) / (fullImpact - minImpact))
  return t * maxChance
}
