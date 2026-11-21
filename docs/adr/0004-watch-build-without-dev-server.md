# 0004. Watch-mode rebuilds without a dev server

- Status: Accepted
- Date: 2026-11-21

## Context

During development we want changes to trigger an automatic rebuild into `dist/`. We explicitly do **not**
want live reload, hot module replacement, or to have to run a local web server to play the game.

Browsers block ES modules (`<script type="module">`) and `eval`-based source maps from behaving
reliably when a page is opened via `file://`.

## Decision

- `npm run watch` runs `webpack --watch` in development mode, rebuilding `dist/` on every source change.
  The developer refreshes the browser manually.
- `webpack-dev-server` is not used.
- The bundle is emitted as a classic script loaded with `defer` (not `type="module"`), and the
  `publicPath` is relative (`''`), so `dist/index.html` works when opened directly from disk.
- Source maps use `devtool: 'source-map'` (separate `.map` files) rather than `eval` variants.

## Consequences

- `dist/index.html` can be double-clicked or opened from the browser with no server running.
- No automatic browser refresh; a manual reload is needed after each rebuild.
- If future features require a server (e.g. `fetch` of local JSON assets, which is blocked on
  `file://`), this decision will need revisiting — assets would need to be bundled/inlined instead.
