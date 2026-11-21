# Asteroids

An Asteroids-style game written in TypeScript and rendered on an HTML canvas.

## Getting started

Requires [Node.js](https://nodejs.org/) (LTS or newer).

```sh
npm install
```

| Command             | What it does                                                           |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run build`     | Production build into `dist/` (minified, content-hashed filenames)     |
| `npm run watch`     | Development build into `dist/`, rebuilding on every change (no server) |
| `npm test`          | Run unit tests with Vitest (`npm run test:watch` to re-run on change)  |
| `npm run typecheck` | Type-check without building                                            |
| `npm run lint`      | Lint with ESLint (`npm run lint:fix` to auto-fix)                      |
| `npm run format`    | Format with Prettier (`npm run format:check` to verify only)           |

## Playing

Open `dist/index.html` directly in a browser — no web server is needed. While `npm run watch` is running,
refresh the page to pick up changes.

Add `?name=amy` (or `ian`, `kard`) to the URL to change the ship colour.

Controls: arrow keys to turn and thrust, space to fire, Esc to pause.

Asteroids spin and bounce off each other; hard impacts can shatter them into smaller pieces (no points
are awarded for those). Rotation, collisions and shatter chances are tunable in `src/config.ts`; see
[ADR 0009](docs/adr/0009-asteroid-rotation.md) and
[ADR 0010](docs/adr/0010-asteroid-collisions-and-shattering.md).

## Project structure

Source lives in `src/`; see [ADR 0005](docs/adr/0005-source-layout-and-module-structure.md) for the
layout. Architecture decisions are recorded in [`docs/adr/`](docs/adr/README.md).
`docs/reference/ref.js` is the original reference implementation and is not part of the build.

## Deploying

`--delete` removes anything on the server that isn't in `dist/` (including old hashed bundles), so
don't put files in that folder by hand.

```sh
npm run build
rsync -a --delete dist/ root@178.62.120.155:/var/www/asteroids
```
