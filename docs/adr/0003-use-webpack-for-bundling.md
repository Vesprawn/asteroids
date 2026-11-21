# 0003. Use webpack for bundling

- Status: Accepted
- Date: 2026-11-21

## Context

TypeScript must be compiled, and splitting the code into modules requires those modules to be combined
for the browser. The HTML and CSS also need to end up in a deployable output folder.

Options considered:

- **webpack** — mature, highly configurable, large plugin ecosystem, first-class watch mode.
- **esbuild** — much faster, less configuration, but a smaller plugin ecosystem and no type checking.
- **Vite** — excellent DX, but centred around a dev server; its production build uses ES modules by
  default, which do not load from `file://`.
- **`tsc` only** — no bundling; would emit one file per module and require ES module loading.

## Decision

Use webpack 5 with:

- `ts-loader` to compile TypeScript (with type checking, so the build fails on type errors).
- `html-webpack-plugin` to generate `dist/index.html` from `src/index.html` and inject the bundle.
- `css-loader` + `mini-css-extract-plugin` so CSS imported from TypeScript is emitted as a real `.css`
  file rather than injected at runtime.
- Content-hashed filenames in production builds for cache busting; stable names in development.
- `output.clean` so `dist/` only ever contains the current build.

## Consequences

- One `npm run build` produces a complete, deployable `dist/` folder.
- Webpack configuration is more verbose than alternatives; it lives in `webpack.config.js`.
- Builds are slower than esbuild, though negligible at this project's size.
