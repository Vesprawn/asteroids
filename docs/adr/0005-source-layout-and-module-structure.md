# 0005. Source layout and module structure

- Status: Accepted
- Date: 2026-11-21

## Context

The original game lived in one file where every class reached into shared module-level state
(`ship`, `level`, `lives`, `score`, `canvas`, `newLevel()`…). This made the classes hard to reason about,
impossible to reuse in isolation (e.g. the life icons were `Ship`s that read the global `ship`), and
blocked splitting the file into modules.

## Decision

Organise `src/` by responsibility, with dependencies flowing in one direction
(`main` → `game` → entities/utilities → `config`/`types`):

```
src/
  main.ts              Entry point: canvas setup, wiring, start
  game.ts              Game class: owns all mutable game state and the update/draw loop
  asteroid-factory.ts  Spawns asteroids, handles collisions and splitting
  input.ts             Keyboard bindings → Game/Ship actions
  hud.ts               Lives, score and message rendering
  score.ts             Score and high score persistence (localStorage)
  player.ts            Player name (query string) and colour
  config.ts            Tuning constants and debug flags
  types.ts             Shared types (Bounds, DebugFlags)
  entities/            Ship, Laser, Asteroid
  utils/geometry.ts    Distance and screen-wrap helpers
  styles/              CSS, imported from main.ts and extracted by webpack
  index.html           HTML template for html-webpack-plugin
```

Rules of thumb:

- No module-level mutable state outside `main.ts`; state lives in `Game`.
- Entities receive what they need as arguments or constructor config (e.g. asteroid colour, ship colour,
  bounds) rather than reading globals.
- Upward communication uses callbacks (e.g. `AsteroidFactory`'s `onScore` / `onCleared`) instead of
  importing the game.
- Tuning values live in `config.ts`.

## Consequences

- Each module can be understood, and later unit-tested, on its own.
- Adding features (sound, new entities, menus) has an obvious home.
- More files and imports than before; webpack bundles them into a single script so there is no runtime
  cost.
