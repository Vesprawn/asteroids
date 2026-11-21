import type { Bounds } from '../types'

export const distanceBetweenPoints = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

/**
 * Wraps a point (with radius `r`) to the opposite edge once it has fully left the bounds.
 */
export const wrapPosition = (
  pos: { x: number; y: number },
  r: number,
  bounds: Bounds,
): { x: number; y: number } => {
  let { x, y } = pos

  if (pos.x < 0 - r) x = bounds.w + r
  if (pos.x > bounds.w + r) x = 0 - r
  if (pos.y < 0 - r) y = bounds.h + r
  if (pos.y > bounds.h + r) y = 0 - r

  return { x, y }
}
