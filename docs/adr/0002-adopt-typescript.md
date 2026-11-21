# 0002. Adopt TypeScript with strict type checking

- Status: Accepted
- Date: 2026-11-21

## Context

The game was a single ~800-line JavaScript file relying on implicit globals and untyped objects. Several
latent bugs were only discoverable at runtime (e.g. reading an undefined `shipSize` property, classes
reaching into module-level globals such as `ship`, `level` and `score`). As the game grows, refactoring
safely without types becomes increasingly difficult.

## Decision

Rewrite the source in TypeScript with `strict: true`, plus additional checks:
`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
`noImplicitOverride` and `exactOptionalPropertyTypes`.

TypeScript is used purely as a compile-time tool; the browser runs the bundled JavaScript output.
`npm run typecheck` (`tsc --noEmit`) checks types without building, and the webpack build also fails on
type errors (see [0003](0003-use-webpack-for-bundling.md)).

## Consequences

- Type errors and many classes of bug are caught at build time and in the editor.
- Contributors need a Node.js toolchain; the source can no longer be opened directly in a browser —
  only the built `dist/` output can.
- Strict mode requires explicit handling of `null`/`undefined` (e.g. `canvas.getContext('2d')`), which
  adds a little verbosity.
