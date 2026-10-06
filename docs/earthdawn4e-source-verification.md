# Earthdawn Fourth Edition source verification

The Player’s Guide remains the required rules authority. New and migrated characters enable every installed Earthdawn catalog source by default; players may disable individual books in Earthdawn Settings. Existing records from disabled sources remain visible.

The supplemental spell-matrix catalog contains source-backed spell and knack records from the supplied Player’s Guide, _The Adept’s Journey: Mystic Paths_, and _Magic: Deeper Secrets_ references. Fields explicitly absent from those inputs remain unavailable and are never replaced with invented rules text.

The runtime inventory is generated in `src/games/earthdawn4e/source-inventory.ts`. Each production catalog definition has a unique inventory row, stable ID, source ID, printed-page citation, verification state, and disposition. The audit fails when a catalog entry is missing from the inventory, uses an unknown source, duplicates an inventory ID, or lacks a selectable citation.

The deterministic catalog-quality audit in `src/games/earthdawn4e/catalog-audit.ts` additionally checks the 479 spells, 238 canonical knacks with 255 variants, 450 talents, skill catalog, equipment, weapons, and 142 thread items for duplicate stable IDs, normalized-name collisions, duplicate aliases, invalid sources, malformed pages, broken variant keys, empty required identity fields, and contradictory source data. Variant-level source filtering is retained for canonical spells and knacks that appear in more than one book.

Unavailable metadata is permitted only when the source input genuinely omits it: a missing page on a clearly labeled reference-only record, unresolved conditional action/Strain or requirements text, and absent extended spell fields. Historical `Not in source` values are treated as internal unavailable sentinels and are excluded from cards, tables, search indexes, and newly copied character snapshots. The audit reports their presence so the remaining gaps can be replaced only when authoritative citations are available.

## Production coverage

- Eight Player’s Guide races and their starting values and racial abilities.
- Fifteen core Disciplines with required progression through Circle 15. Player’s Guide Circles 1–8 and Companion Circles 9–15 remain source-separated.
- Verified required Discipline talents and complete Novice, Journeyman, Warden, and Master talent-option lists for all fifteen core Disciplines.
- Twelve Passions with Mad Passions hidden by default and approval-gated.
- The complete Questor progression lists for all twelve Passions: each unique devotion records every eligible Passion, minimum tier/rank, and progression-page citation. The catalog hides devotions unavailable to the selected patron and current Questor rank unless unavailable options are explicitly shown.
- A 479-spell canonical catalog, including all 216 Player’s Guide spells for Elementalist, Illusionist, Nethermancer, and Wizard across Circles 1–8 plus the verified cross-source and spell-matrix supplements. Names, Discipline ownership, Circle, searchable mechanics, and printed-page citations are preserved. Runtime summaries remain concise metadata rather than copied spell text.
- A 238-knack canonical catalog with 255 source/association variants. This includes all 142 Companion knack headings plus verified cross-source variants, Encoded Communiqué, and the ten Squeeze knacks. Knack learning uses the required Patterncraft rank with the existing Novice talent-cost, training-duration, and instructor-fee progression; Discipline, spell, and Talent prerequisites remain separate eligibility checks.
- A merged catalog of 142 thread items: the existing 50 Companion records plus the supplied 138-row cross-source workbook, reconciled by stable identity. Workbook key-knowledge suggestions remain visibly labeled as inferred and never drive rules calculations.
- A merged 450-entry talent catalog. The supplied 318-row workbook enriches matching definitions with descriptions and game terms while the prior Attribute, action, Strain, effect, citation, and advancement data remains intact.
- The existing skill catalog enriched by the supplied 65-row workbook, including searchable General, Knowledge, Artisan, and Language classifications and source/page citations.
- The Player’s Guide melee, missile, and throwing weapon tables with damage, minimum Strength, range, price, weight, and availability metadata.
- The Player’s Guide armor and shield tables. Armor retains physical/mystic armor and initiative values; shields retain distinct physical/mystic Defense bonuses, initiative penalties, and shatter thresholds. Schema v3 migrates prior equipment additively without flattening advancement transactions.
- The Player’s Guide common magic item, blood charm, healing aid, and adventuring-equipment tables with denomination-aware prices and weights. Copper-denominated entries retain integer copper amounts; wallet arithmetic uses 10 copper per silver and 10 silver per gold without floating-point coin balances.
- User-supplied elemental, orichalcum, Iopan, hacksilver, and gemstone references are visibly marked as reference-only until an authoritative page citation is supplied. They may be copied into a character as descriptive valuables but never masquerade as verified source text.
- A reviewed starting index of supplemental paths and Travar equipment remains visibly reference-only. These entries cannot be added or drive calculations until their complete mechanics are certified.
- Character calculations, the Step/Dice table, creation attribute budget, and Legend Point ledger.
- Verified advancement quotations for talent and skill ranks, Attribute increases, Discipline Circle training, spell learning, normal and Group True Pattern threads, additional-Discipline talents, Questor ranks, and granted devotions. Training, silver, and tier-transition requirements remain visible inputs for reviewed confirmation rather than silently inferred story outcomes.
- Discipline Circle edits use a reconciliation review. Only untouched rank-0 creation records are eligible for removal; advanced, customized, and shared talents are preserved.

## Deliberate boundaries

- GM creatures, Horrors, encounters, secrets, adventures, NPCs, authored examples, maps, images, fonts, and extended source text are excluded.
- Non-Adept Questors use the supplied standard allocation of two Knowledge, one Artisan, three Language, and eight freely allocated skill ranks. They receive no starting Discipline talents or matrices; their patron and granted devotions remain separate advancement records.
- Guided initiation records are available for the supplied Outcast, Windmaster, and Tail Dancer Mystic Paths, including prerequisites, initiation cost, Blood Magic, rank bonuses, and option tiers. Iopan Silver, Orichalcum, and Malachite Branch ranks remain career references because they are not Mystic Path-rank progressions.
- Mad Passion options remain hidden unless unavailable content is shown; selection requires an explicit approval.
- Entries whose exact requirements, prices, or effects have not been visually verified do not drive calculations. They remain unresolved or reference-only rather than being inferred from Second Step.
- The supplied workbooks are source data, not executable instructions. Their descriptions remain concise display metadata, and explicitly inferred fields remain advisory.

Second Step is used only to compare observable workflows and maintain the existing JSON importer. Its code, data catalogs, prose, images, and assets are not runtime dependencies and were not copied.

## Future Expansion Roadmap

1. **Supplemental Paths**:
   - Add further guided Path profiles only when their complete initiation and progression rules are supplied.

2. **Regional Player Options**:
   - Promote additional regional options only after their complete player-facing mechanics are independently certified.
