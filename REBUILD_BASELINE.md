# EXCIT Pre-Rebuild Baseline

Date: 2026-09-08

## Purpose

This commit preserves the playable EXCIT implementation immediately before the
GAME_CONCEPT.md rebuild begins. The original `main` revision was:

`d94fbc41ea6aa408f75df6a6389d8e0eba71e701`

The preserved baseline includes the current character model and animation
runtime, equipment sockets and previews, mining timing and impact behavior,
movement and camera input behavior, inventory interaction fixes, related tests,
the workspace rules, and `GAME_CONCEPT.md`.

## Included Untracked Files

- `GAME_CONCEPT.md`
- `public/models/excit-character.glb`
- `src/core/playerAnimationRuntime.js`
- `tests/interactionController.test.js`
- `tests/mining.test.js`
- `tests/playerAnimationRuntime.test.js`
- `tests/playerEquipmentSockets.test.js`

## Verification

- `git diff --check`: passed; Git reported only expected LF-to-CRLF working-copy warnings.
- `npm run build`: passed with Vite's existing warning that the main bundle is larger than 500 kB after minification.
- `node --test`: 283 tests, 282 passed, 1 failed.

Known test failure:

- `tests/maps.test.js` imports `createIrregularCaveCollarGeometry`, but
  `src/systems/maps.js` does not currently export that name. This mismatch
  predates the rebuild baseline and is intentionally not changed here.

## Persistence Boundary

This Git baseline preserves tracked project files and the explicitly staged new
files. It does not snapshot browser localStorage or other browser session data.
`server/data/app.json` remains in its existing tracked state and was not copied,
inspected, or altered for this baseline. Before testing rebuild changes against
persistent gameplay, isolate or back up the relevant development save state.

## Recovery

Inspect the worktree before switching:

```powershell
git status --short --branch
```

Return to the preserved baseline branch:

```powershell
git switch codex/pre-rebuild-20260908
```

Return to rebuild work:

```powershell
git switch codex/excit-rebuild
```

The immutable local reference for this baseline is:

```powershell
git switch --detach excit-pre-rebuild-20260908
```

Commit or otherwise preserve any later worktree changes before switching. This
baseline is local until a user performs an explicit remote upload outside this
workflow.
