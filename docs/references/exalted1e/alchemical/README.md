# Exalted 1e — Alchemical source intake

**Status: no source material supplied yet.** This directory is a placeholder
for the Alchemical splat's source inventory. See
[docs/18-exalted1e-splat-release.md](../../18-exalted1e-splat-release.md) for
the full process this directory will follow.

## What needs to be added here, book by book

1. `source-manifest.json` — one entry per source book in scope (at minimum
   *Exalted: The Autochthonians*; supplements only if their Alchemical-facing
   mechanics are complete), in the same shape as
   `docs/references/exalted1e/dragon-blooded/source-manifest.json`.
2. `inventory/<book-slug>.json` — one file per book, each an array of
   inventory rows (Charm slots, General/Dedicated slot rules, installation,
   Vats, mote commitment, caste, Clarity, Charms, Backgrounds, Merits/Flaws,
   etc.) using the `InventoryRow` shape defined in
   `docs/18-exalted1e-splat-release.md`.

Note: the "87 Charms" figure sometimes associated with this family actually
refers to Dragon-Blooded Aspect Book Charms
(`docs/references/exalted1e/dragon-blooded/README.md`), not an Alchemical
catalog. There is no existing Alchemical Charm count anywhere in this
repository yet — the real count comes only from the supplied source book.

## Do not add yet

- Do not add a production catalog under `src/games/exalted1e/reference/` for
  this family — that only happens after inventory rows are visually reviewed
  against the rendered source page.
- Do not add `alchemical` to `exaltedSheetTypes` in
  `src/games/exalted1e/definitions.ts` — that stays out of scope until all
  five planned families are certified together.
