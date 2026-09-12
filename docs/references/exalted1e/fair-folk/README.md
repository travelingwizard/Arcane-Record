# Exalted 1e — Fair Folk source intake

**Status: no source material supplied yet.** This directory is a placeholder
for the Fair Folk (Raksha) splat's source inventory. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory will follow.

## What needs to be added here, book by book

1. `source-manifest.json` — one entry per source book in scope (at minimum
   *Exalted: The Fair Folk*; supplements only if their Fair Folk-facing
   mechanics are complete), in the same shape as
   `docs/references/exalted1e/dragon-blooded/source-manifest.json`.
2. `inventory/<book-slug>.json` — one file per book, each an array of
   inventory rows (Heart/Cup/Ring/Staff/Sword Graces, caste rules, shaping
   values, feeding state, assumptions/forms, oaths, derived pools, Charms,
   etc.) using the `InventoryRow` shape defined in
   `docs/18-exalted1e-splat-release.md`.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `fair-folk` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
