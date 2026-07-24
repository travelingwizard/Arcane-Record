# 10. Merits and Flaws reference data

## Source and conversion

`docs/references/mage-m20/merits-and-flaws.md` is the only catalog source. `scripts/generate-merits-flaws.mjs` converts its 231 list entries into reviewed static JSON. Runtime Zod validation checks stable IDs, types, categories, positive legal costs, citations, review flags, and duplicate IDs.

The generated catalog contains 115 Merits and 116 Flaws. Citations retain the supplied labels and use `Book label, p. page`, with multiple sources separated by a centered dot in the interface.

Six Nephandic entries lack point costs in the source: Shadow Appeal, Innocuous Aura, Abyssal Mastery, Saint of the Pit, Spectral Presence, and Abyssal Lunatic. They remain searchable and cited with `requiresReview: true`, but cannot be selected until the source data is resolved. “Taint of Corruption” and “Widderslainte, or Taint of Corruption” remain separate definitions because the source lists them separately.

## Selection behavior

Nothing is selected by default. A fixed-cost entry uses its sole cost. A variable-cost entry requires an explicit choice from `allowedCosts`; the interface never silently chooses one. A definition can be selected only once. Character data stores selection data, not the catalog description.

Known imported references validate kind and legal cost. Unknown definition IDs are preserved as unresolved references and remain removable. Replacement with a known definition is deliberately deferred.

## Point calculations

The standard limit is configurable metadata with `maximumFlawPointsGranted: 7` and warning-only enforcement.

- `meritPointTotal` is the sum of selected Merit costs.
- `flawPointTotal` is the sum of selected Flaw costs.
- `flawPointsGranted` is the lesser of the raw Flaw total and seven.
- `remainingFlawAllowance` is the greater of zero and seven minus the raw Flaw total.
- `netCharacterCreationCost` is Merit points minus granted Flaw points.

Projected totals use the same formulas without mutating the character. Flaws beyond seven remain selected; only their standard creation benefit is capped.
