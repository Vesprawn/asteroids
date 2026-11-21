# 0007. Deploy `dist/` with `rsync --delete`

- Status: Accepted
- Date: 2026-11-21

## Context

Production builds use content-hashed filenames (see [0003](0003-use-webpack-for-bundling.md)), so each
build produces new bundle and stylesheet names. Deploying with a plain `rsync -a` would leave every
previous build's files on the server indefinitely.

## Decision

Deploy by building and syncing the contents of `dist/` with `rsync -a --delete`, making the server
folder an exact mirror of the latest build. The server folder is treated as build output only: nothing
is placed there by hand.

## Consequences

- Stale bundles are removed on every deploy; the server holds only the current build.
- Any file added to the server folder manually will be deleted on the next deploy. This is accepted.
- A deploy is only as good as the local build, so always run `npm run build` immediately before syncing.
