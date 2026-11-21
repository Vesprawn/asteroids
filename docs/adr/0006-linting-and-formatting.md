# 0006. ESLint and Prettier for linting and formatting

- Status: Accepted
- Date: 2026-11-21

## Context

With the move to TypeScript we want consistent style and to catch common mistakes that the type checker
does not (e.g. floating promises, unnecessary conditions, unsafe `any` usage).

## Decision

- **ESLint** (flat config, `eslint.config.mjs`) with `typescript-eslint`'s `strictTypeChecked` and
  `stylisticTypeChecked` presets for `src/**/*.ts`, using type-aware linting via the project service.
- **Prettier** for formatting, configured to match the existing code style: no semicolons, single
  quotes, trailing commas, 100-column lines.
- `eslint-config-prettier` disables ESLint rules that conflict with Prettier, so the two do not fight.
- Scripts: `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`.
- Third-party CSS (`normalize.css`) and `docs/reference/` are excluded.

Linting is not part of the webpack build, so a lint error does not block `npm run watch`.

## Consequences

- Consistent formatting with no manual effort; style debates are settled by config.
- Type-aware linting is slower than plain linting, which is acceptable at this project size.
- Contributors should run `npm run lint` and `npm run format:check` before opening a PR (a CI check
  could enforce this later).
