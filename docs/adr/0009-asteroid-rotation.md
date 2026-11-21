# 0009. Asteroid rotation

- Status: Accepted
- Date: 2026-11-21

## Context

Asteroids were drawn at a fixed random angle and never rotated. We want each asteroid to rotate at its
own speed, with the behaviour tunable from configuration.

## Decision

- Each asteroid has a `spin` (radians per frame) applied to its angle every frame.
- Spin is chosen when the asteroid is created (including fragments) and is fixed for its lifetime:
  - speed uniformly random in `[ASTEROID_SPIN_MIN, ASTEROID_SPIN_MAX]` degrees per second,
  - random direction,
  - multiplied by `(ASTEROID_RADIUS_LARGE / r) ^ ASTEROID_SPIN_SIZE_EXPONENT`, so smaller asteroids spin
    faster (exponent `0` disables size scaling).
- Collisions do not change spin; rotation is purely visual and does not affect physics (collisions use
  circular bounds, see [0010](0010-asteroid-collisions-and-shattering.md)).
- Configuration is in degrees per second (human-friendly) and converted using `FPS`.
- The spin calculation is a pure function (`src/physics/rotation.ts`) with an injectable random source,
  covered by unit tests.

## Consequences

- Asteroids look more dynamic; setting min and max to `0` restores the old static look.
- Because spin is fixed and visual only, there is no angular momentum to simulate, keeping the physics
  simple. If collisions should transfer spin in future, this decision would be superseded.
