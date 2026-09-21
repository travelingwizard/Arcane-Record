# Earthdawn Fourth Edition source verification

The Player’s Guide is the required rules authority. Optional sources are disabled for new records until a player enables them in Earthdawn Settings. Existing records from disabled sources remain visible.

The runtime inventory is generated in `src/games/earthdawn4e/source-inventory.ts`. Each production catalog definition has a unique inventory row, stable ID, source ID, printed-page citation, verification state, and disposition. The audit fails when a catalog entry is missing from the inventory, uses an unknown source, duplicates an inventory ID, or lacks a selectable citation.

## Production coverage

- Eight Player’s Guide races and their starting values and racial abilities.
- Fifteen core Disciplines with required progression through Circle 15. Player’s Guide Circles 1–8 and Companion Circles 9–15 remain source-separated.
- Verified required Discipline talents and the currently reviewed talent-option lists.
- Twelve Passions with Mad Passions hidden by default and approval-gated.
- Verified First Circle starter spells for Elementalist, Illusionist, Nethermancer, and Wizard.
- A reviewed starting subset of general skills, equipment, weapons, thread records, and supplemental paths.
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

1. **Higher-Circle Spells (Circles 2–8)**:
   - Systematically expand spell catalogs for Elementalist, Illusionist, Nethermancer, and Wizard across Circles 2 through 8 from the _Player's Guide_.
   - Each entry requires verified thread weaving, casting difficulty, range, duration, effect mechanics, and inventory row in `src/games/earthdawn4e/source-inventory.ts`.

2. **Talent Options & Knacks Expansion**:
   - Expand selectable optional talents across Journeyman, Warden, and Master tiers.
   - Implement knack definitions and prerequisites once tier validation is verified.

3. **Supplemental Paths & Questor Profiles**:
   - Add guided starting allocation profiles for non-Adept Questors and specialized Paths (e.g., Outcast Silver, Wind Dancer) with approval gates.

4. **Elven & Companion Sources**:
   - Enable High-Circle spells (Circles 9–15) from the _Companion_ as an explicitly source-gated supplement.
