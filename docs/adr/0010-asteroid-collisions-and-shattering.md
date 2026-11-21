# 0010. Asteroid collisions and shattering

- Status: Accepted
- Date: 2026-11-21

## Context

Asteroids passed through each other. We want them to bounce off one another and sometimes shatter,
**without changing how many times an asteroid can shatter**: large → 2 medium → 2 small → destroyed.

## Decision

### Collision model

- Asteroids are treated as circles of radius `r` (the same bounds already used for laser and ship
  hits). The jagged outline is visual only.
- Mass is proportional to area (`r²`), so large asteroids are barely deflected by small ones.
- Each frame, every pair of asteroids is tested (O(n²); n stays small, at most ~100 even at high levels).
- Overlapping pairs are first **separated** along the line between their centres (lighter body moves
  further) to stop them sticking, then an **impulse-based bounce** is applied with configurable
  restitution (`ASTEROID_RESTITUTION`, default 1 = perfectly elastic).
- Collisions across the screen-wrap edge are not detected; asteroids only collide when both are on
  the same side of the edge. This keeps the maths simple and is barely noticeable.
- Physics lives in pure functions in `src/physics/collision.ts`, unit-tested for conservation of
  momentum and energy.

### Speed cap

Repeated elastic collisions with unequal masses steadily transfer energy to the smallest asteroids;
simulation showed small asteroids reaching 500–700 px/s, faster than lasers. After a bounce, each
asteroid's speed is capped at `ASTEROID_MAX_SPEED_FACTOR` × the level's maximum starting speed
(`0` disables the cap).

### Shattering

- The shatter chain is defined once (`fragmentRadius` in `src/physics/shatter.ts`) and used for
  laser hits, ship impacts and asteroid collisions, so the number of times an asteroid can shatter is
  identical regardless of cause. Small asteroids never shatter in collisions; they only bounce.
- The chance to shatter scales with impact speed (closing speed along the collision normal):
  zero below `ASTEROID_SHATTER_MIN_IMPACT`, rising linearly to `ASTEROID_SHATTER_MAX_CHANCE` at
  `ASTEROID_SHATTER_FULL_IMPACT`. Gentle bumps just bounce.
- Each asteroid in a collision rolls independently, so one, both or neither may shatter.
- Collision shatters award **no points**; only player-caused destruction scores.
- Fragments share a "family" and get a grace period (`ASTEROID_FRAGMENT_GRACE`) during which they
  ignore their siblings (they spawn on top of each other) and cannot shatter again, which prevents
  instant chain reactions.
- New asteroids at the start of a level avoid spawning overlapping each other where possible.

Default tuning (min 60 px/s, full 200 px/s, max chance 0.3, speed cap ×2) was chosen by simulating
belts at levels 0, 5 and 15 with no player input: at level 5 roughly 2 small asteroids exist after
60 seconds, i.e. shattering happens "sometimes" rather than constantly.

### Randomness

`AsteroidFactory` accepts an injectable random source so collision and shatter behaviour can be
tested deterministically (see [0008](0008-unit-testing-with-vitest.md)).

## Consequences

- The asteroid field is more dynamic, and its behaviour is tunable or can be disabled entirely via
  `ASTEROID_COLLISIONS` in `config.ts`.
- Because collision shatters award no points, a level where asteroids shatter each other is worth
  slightly fewer points.
- At very high levels the field is crowded and fast, so most asteroids shatter to small within
  ~30–60 seconds. This may need per-level tuning later.
- Fixed a pre-existing bug found while restructuring: two lasers hitting the same asteroid in one
  frame previously split and scored it twice.
