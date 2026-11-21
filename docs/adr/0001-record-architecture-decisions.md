# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-11-21

## Context

The project is moving from a single hand-written JavaScript file to a TypeScript codebase with a build
toolchain. Several decisions (language, bundler, build workflow, source layout, linting) will be made
along the way, and the reasoning behind them should be visible to future contributors and reviewers.

## Decision

We will record architecturally significant decisions as Architecture Decision Records (ADRs) in
`docs/adr/`, using a lightweight MADR-style template (Context, Decision, Consequences). The index in
`docs/adr/README.md` is kept up to date as ADRs are added.

## Consequences

- Decisions and their trade-offs are documented alongside the code and reviewed in the same PRs.
- There is a small overhead to writing an ADR for each significant change.
- Superseded decisions remain in history, so the evolution of the project can be followed.
