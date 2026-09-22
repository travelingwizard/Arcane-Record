# Earthdawn Fourth Edition source verification

The Player’s Guide is the required rules authority. Optional sources are disabled for new records until a player enables them in Earthdawn Settings. Existing records from disabled sources remain visible.

The runtime inventory is generated in `src/games/earthdawn4e/source-inventory.ts`. Each production catalog definition has a unique inventory row, stable ID, source ID, printed-page citation, verification state, and disposition. The audit fails when a catalog entry is missing from the inventory, uses an unknown source, duplicates an inventory ID, or lacks a selectable citation.

## Production coverage

- Eight Player’s Guide races and their starting values and racial abilities.
- Fifteen core Disciplines with required progression through Circle 15. Player’s Guide Circles 1–8 and Companion Circles 9–15 remain source-separated.
- Verified required Discipline talents and complete Novice, Journeyman, Warden, and Master talent-option lists for all fifteen core Disciplines.
- Twelve Passions with Mad Passions hidden by default and approval-gated.
- The complete Questor progression lists for all twelve Passions: each unique devotion records every eligible Passion, minimum tier/rank, and progression-page citation. The catalog hides devotions unavailable to the selected patron and current Questor rank unless unavailable options are explicitly shown.
- All 216 Player’s Guide spells for Elementalist, Illusionist, Nethermancer, and Wizard across Circles 1–8. Names, Discipline ownership, Circle, and printed-page citations were layout-extracted, reconciled against the source headings, and visually sampled at every Discipline/Circle boundary. Runtime summaries remain concise metadata rather than copied spell text.
- All 142 Companion knack headings, associated talents, minimum ranks, and printed-page citations from pp. 77–117. The layout-extracted inventory was visually sampled across the full chapter, with the final enchanting entries manually reconciled. Knack learning uses the required-rank Novice talent cost, rank-based training duration, and the published typical instructor fee.
- The complete Player’s Guide Novice and Journeyman general-skill rosters, plus editable Artisan, Knowledge, and language records.
- The Player’s Guide melee, missile, and throwing weapon tables with damage, minimum Strength, range, price, weight, and availability metadata.
- The Player’s Guide armor and shield tables. Armor retains physical/mystic armor and initiative values; shields retain distinct physical/mystic Defense bonuses, initiative penalties, and shatter thresholds. Schema v3 migrates prior equipment additively without flattening advancement transactions.
- The Player’s Guide common magic item, blood charm, healing aid, and adventuring-equipment tables with corrected silver-equivalent prices and weights. Copper-denominated entries remain fractional silver so builder arithmetic uses one currency consistently.
- A reviewed starting subset of thread records and supplemental paths.
- Character calculations, the Step/Dice table, creation attribute budget, and Legend Point ledger.
- Verified advancement quotations for talent and skill ranks, Attribute increases, Discipline Circle training, spell learning, normal and Group True Pattern threads, additional-Discipline talents, Questor ranks, and granted devotions. Training, silver, and tier-transition requirements remain visible inputs for reviewed confirmation rather than silently inferred story outcomes.
- Discipline Circle edits use a reconciliation review. Only untouched rank-0 creation records are eligible for removal; advanced, customized, and shared talents are preserved.

## Deliberate boundaries

- GM creatures, Horrors, encounters, secrets, adventures, NPCs, authored examples, maps, images, fonts, and extended source text are excluded.
- A non-Adept Questor is supported as a manual/guided hybrid. The Questors source permits it but does not provide a complete replacement starting skill allocation, so a specific GM-approved allocation profile is required.
- Mad Passion options remain hidden unless unavailable content is shown; selection requires an explicit approval.
- Entries whose exact requirements, prices, or effects have not been visually verified do not drive calculations. They remain unresolved or reference-only rather than being inferred from Second Step.

Second Step is used only to compare observable workflows and maintain the existing JSON importer. Its code, data catalogs, prose, images, and assets are not runtime dependencies and were not copied.

## Future Expansion Roadmap

1. **Supplemental Paths & Questor Profiles**:
   - Add guided starting allocation profiles for non-Adept Questors and specialized Paths (e.g., Outcast Silver, Wind Dancer) with approval gates.

2. **Elven & Companion Sources**:
   - Enable High-Circle spells (Circles 9–15) from the _Companion_ as an explicitly source-gated supplement.
