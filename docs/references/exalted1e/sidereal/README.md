# Exalted 1e — Sidereal source intake

**Status: no source material supplied yet.** This directory is a placeholder
for the Sidereal splat's source inventory. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory will follow.

## What needs to be added here, book by book

1. `source-manifest.json` — one entry per source book in scope (at minimum
   *Exalted: The Sidereals*; supplements only if their Sidereal-facing
   mechanics are complete), in the same shape as
   `docs/references/exalted1e/dragon-blooded/source-manifest.json`.
2. `inventory/<book-slug>.json` — one file per book, each an array of
   inventory rows (division/faction identity, Colleges, astrology
   prerequisites, Paradox, resplendent destinies, martial-arts dependencies,
   Charms, Backgrounds, Merits/Flaws, etc.) using the `InventoryRow` shape
   defined in `docs/18-exalted1e-splat-release.md`.

Note: `docs/references/exalted1e/dragon-blooded/source-manifest.json` already
cites *Exalted: The Sidereals* once, for a single externally-sourced
Dragon-Blooded spell (`open-the-spirit-door`), flagged `external-source`
because the Sidereals PDF was not supplied at the time. That one spell is
Dragon-Blooded catalog content, not a Sidereal inventory row — it does not
satisfy any part of this family's inventory.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `sidereal` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
