/** A moving circle. Velocities are in pixels per frame. */
export interface Body {
  x: number
  y: number
  xv: number
  yv: number
  r: number
}

/** Mass is proportional to area, so big asteroids are pushed around less by small ones. */
export const mass = (body: Body): number => body.r * body.r

export const circlesOverlap = (a: Body, b: Body): boolean =>
  Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r

/** Unit vector pointing from a to b (arbitrary but stable if the centres coincide). */
const collisionNormal = (a: Body, b: Body): { nx: number; ny: number; dist: number } => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.hypot(dx, dy)

  return dist > 0 ? { nx: dx / dist, ny: dy / dist, dist } : { nx: 1, ny: 0, dist: 0 }
}

/**
 * Pushes two overlapping circles apart along the line between their centres so they are just touching.
 * The lighter body moves further. Prevents bodies sticking together over multiple frames.
 */
export const separateBodies = (a: Body, b: Body): void => {
  const { nx, ny, dist } = collisionNormal(a, b)
  const overlap = a.r + b.r - dist
  if (overlap <= 0) return

  const ma = mass(a)
  const mb = mass(b)
  const total = ma + mb

  a.x -= nx * overlap * (mb / total)
  a.y -= ny * overlap * (mb / total)
  b.x += nx * overlap * (ma / total)
  b.y += ny * overlap * (ma / total)
}

/**
 * Applies an impulse-based collision response between two circles.
 *
 * @param restitution 1 = perfectly elastic (no energy lost), 0 = perfectly inelastic along the normal.
 * @returns the closing speed along the collision normal before the bounce (pixels per frame),
 *          or 0 if the bodies were already moving apart (in which case nothing changes).
 */
export const resolveCollision = (a: Body, b: Body, restitution = 1): number => {
  const { nx, ny } = collisionNormal(a, b)
  const relativeAlongNormal = (b.xv - a.xv) * nx + (b.yv - a.yv) * ny
  const closingSpeed = -relativeAlongNormal

  if (closingSpeed <= 0) return 0

  const ma = mass(a)
  const mb = mass(b)
  const impulse = ((1 + restitution) * closingSpeed) / (1 / ma + 1 / mb)

  a.xv -= (impulse * nx) / ma
  a.yv -= (impulse * ny) / ma
  b.xv += (impulse * nx) / mb
  b.yv += (impulse * ny) / mb

  return closingSpeed
}

/** Scales a body's velocity down so its speed does not exceed `maxSpeed` (pixels per frame). */
export const clampSpeed = (body: Body, maxSpeed: number): void => {
  const speed = Math.hypot(body.xv, body.yv)
  if (maxSpeed <= 0 || speed <= maxSpeed) return

  body.xv *= maxSpeed / speed
  body.yv *= maxSpeed / speed
}
