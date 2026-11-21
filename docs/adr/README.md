# Architecture Decision Records

This folder records significant architectural decisions for this project, using a lightweight
[MADR](https://adr.github.io/madr/)-style format.

## Conventions

- One decision per file, named `NNNN-short-title.md` with a zero-padded, sequential number.
- Status is one of: `Proposed`, `Accepted`, `Deprecated`, `Superseded by NNNN`.
- ADRs are immutable once accepted. To change a decision, write a new ADR that supersedes the old one
  and update the old one's status.

## Index

| #    | Title                                                                              | Status   |
| ---- | ---------------------------------------------------------------------------------- | -------- |
| 0001 | [Record architecture decisions](0001-record-architecture-decisions.md)             | Accepted |
| 0002 | [Adopt TypeScript with strict type checking](0002-adopt-typescript.md)             | Accepted |
| 0003 | [Use webpack for bundling](0003-use-webpack-for-bundling.md)                       | Accepted |
| 0004 | [Watch-mode rebuilds without a dev server](0004-watch-build-without-dev-server.md) | Accepted |
| 0005 | [Source layout and module structure](0005-source-layout-and-module-structure.md)   | Accepted |
| 0006 | [ESLint and Prettier for linting and formatting](0006-linting-and-formatting.md)   | Accepted |
| 0007 | [Deploy `dist/` with `rsync --delete`](0007-deploy-dist-with-rsync-delete.md)      | Accepted |
| 0008 | [Unit testing with Vitest](0008-unit-testing-with-vitest.md)                       | Accepted |
| 0009 | [Asteroid rotation](0009-asteroid-rotation.md)                                     | Accepted |
