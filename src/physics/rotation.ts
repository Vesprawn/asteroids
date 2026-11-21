import {
  ASTEROID_RADIUS_LARGE,
  ASTEROID_SPIN_MAX,
  ASTEROID_SPIN_MIN,
  ASTEROID_SPIN_SIZE_EXPONENT,
  FPS,
} from '../config'

export interface SpinOptions {
  minDegPerSec: number
  maxDegPerSec: number
  sizeExponent: number
  referenceRadius: number
  fps: number
}

const DEFAULT_SPIN_OPTIONS: SpinOptions = {
  minDegPerSec: ASTEROID_SPIN_MIN,
  maxDegPerSec: ASTEROID_SPIN_MAX,
  sizeExponent: ASTEROID_SPIN_SIZE_EXPONENT,
  referenceRadius: ASTEROID_RADIUS_LARGE,
  fps: FPS,
}

/**
 * Random spin for an asteroid of radius `r`, in radians per frame, in a random direction.
 * Smaller asteroids spin faster by (referenceRadius / r) ^ sizeExponent.
 */
export const randomSpin = (
  r: number,
  random: () => number = Math.random,
  options: SpinOptions = DEFAULT_SPIN_OPTIONS,
): number => {
  const { minDegPerSec, maxDegPerSec, sizeExponent, referenceRadius, fps } = options
  const degPerSec = minDegPerSec + random() * (maxDegPerSec - minDegPerSec)
  const sizeFactor = Math.pow(referenceRadius / r, sizeExponent)
  const direction = random() < 0.5 ? 1 : -1

  return (direction * degPerSec * sizeFactor * Math.PI) / 180 / fps
}
