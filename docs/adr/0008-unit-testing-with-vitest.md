# 0008. Unit testing with Vitest

- Status: Accepted
- Date: 2026-11-21

## Context

Upcoming features (asteroid collisions and shattering) add physics and probability-based rules that are
hard to verify by playing the game. We want fast, automated checks of that logic.

Options considered: **Jest** (widely used, but needs extra configuration for TypeScript/ESM) and
**Vitest** (TypeScript out of the box, Jest-compatible API, fast, minimal configuration).

## Decision

- Use Vitest for unit tests, running in the Node environment (no browser or DOM required).
- Tests live next to the code they cover as `*.test.ts` files under `src/`.
- `npm test` runs the suite once; `npm run test:watch` re-runs on change.
- Game logic that needs randomness accepts an injectable random-number source so tests can be
  deterministic.
- Test files are type-checked and linted like any other source, but are never imported by the game so
  they are not bundled.

## Consequences

- Physics and game rules can be verified quickly and repeatably.
- Rendering code (canvas drawing) is not covered; keeping logic in pure functions separate from drawing
  maximises what can be tested.
