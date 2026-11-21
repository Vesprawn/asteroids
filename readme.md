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
| `npm run typecheck` | Type-check without building                                            |
| `npm run lint`      | Lint with ESLint (`npm run lint:fix` to auto-fix)                      |
| `npm run format`    | Format with Prettier (`npm run format:check` to verify only)           |

## Playing

Open `dist/index.html` directly in a browser — no web server is needed. While `npm run watch` is running,
refresh the page to pick up changes.

Add `?name=amy` (or `ian`, `kard`) to the URL to change the ship colour.

Controls: arrow keys to turn and thrust, space to fire, Esc to pause.

## Project structure

Source lives in `src/`; see [ADR 0005](docs/adr/0005-source-layout-and-module-structure.md) for the
layout. Architecture decisions are recorded in [`docs/adr/`](docs/adr/README.md).
`docs/reference/ref.js` is the original reference implementation and is not part of the build.

## Deploying

```sh
npm run build
rsync -a dist/ root@178.62.120.155:/var/www/asteroids
```
