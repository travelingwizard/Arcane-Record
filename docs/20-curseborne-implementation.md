# Curseborne implementation status

## Boundary

Curseborne now registers an explicitly labeled editable-sheet preview. Attributes,
Skills, curse resources, injuries and custom entries are editable and saved
through the repository. Version 2 adds confirmed Attribute/Skill EXP purchases,
linked refunds, a local ordinary/curse d10 roller and saved roll history. This is
not a complete rules-validated creator; full catalogs and catalog-dependent
purchases remain unfinished.

Settings now provides a saved manual rebuild draft for identity/Path text,
Attributes and Skills. It previews changes, preserves later rating deltas,
blocks conflicts or out-of-range results, and retains before/after history.
This does not yet implement official Path allocation or full guided rebuilding.

Spell bleed payments explicitly choose non-temporary and temporary dice. Scene
and story resets require confirmation, preserve injuries and history, and handle
the unbled risky temporary-dice option from core p. 226. Story Entanglement
increases require recorded player/Storyguide agreement and never spend EXP.
Other Lineage-specific effects and automatic armor interaction remain pending.

The version-1 migration keeps every existing EXP amount and free-text record.
New roll/resource histories begin empty. Attribute increases cost **6 EXP** per
the final core p. 240 table, correcting the earlier foundation's erroneous 5.
This correction does not rewrite historical purchases. Refunds reverse a
structured purchase once, only while its rating has not subsequently changed.

Only Entanglement 1–4 dice caps are supplied by the core (5/7/7/9). Higher
values produce an unresolved-rule warning. Roller inputs support ordinary
Enhancement, stacking Enhancement, pre-roll hits and effect-granted double 9s;
Advantage, opposed-roll adjudication and narrative outcomes remain table-owned.

Use `Curseborne_(Final_Download).pdf` (389 PDF pages) as the core authority,
not the earlier download. Printed pages are the citation locators. The supplied
character sheet is a field reference, not an artwork asset. Accursed Adventures
is optional and contributes player items only; no scenarios or pregens.

## Agreed rulings

- Core p. 203: four Injury Levels, with 2/2/2/1 boxes. The three-level summary
  on p. 231 is inconsistent. Armor and Taken Out are separate.
- Core p. 241: higher starts use a single package, not cumulative packages.
  Entanglement 3–4 needs recorded Storyguide approval of the proposed one Edge
  dot interpretation, or an explicit alternative value and explanation.
- Core p. 179: the difficulty-zero sidebar overrides general zero-hit failure;
  ordinary Enhancement still needs a hit. This clarification is not a claim of
  published errata.
- EXP awards count toward lifetime earned; refunds and balance adjustments do
  not. Entanglement progression is story-based, never an EXP purchase.

## Remaining delivery

### Source-infrastructure checkpoint

Schema version 3 stores required core and optional Accursed Adventures source
IDs per character, retaining unknown IDs for forward compatibility. Settings
can save browser defaults without changing existing sheets. The first reviewed
supplement entries are the four player-usable heirlooms on Accursed Adventures
pp. 46-47; they are reference-only and require explicit Storyguide approval to
add. No effect or EXP cost is applied automatically.

The generated heading inventory and blocking ambiguity register are under
`docs/references/`. Inventory status is not catalog completion: core entries
still require rules-level review before milestone 1 can be closed.

1. Finish source audit and complete catalogs, manifest, schema, approvals, and
   source controls. Verify official corrections rather than relying on forum
   interpretations or treating a known cost as full rules verification.
2. Guided creator for all core Lineages/Families and Role Paths, including
   higher starts, contextual hints, eligibility, review and safe rebuilding.
3. Shared navigation, Settings/themes, Build/Play sheet, compact catalogs,
   injury/resource tracks, explicit resets and conditional Lineage details.
4. Expand confirmed purchases beyond Attributes/Skills, verify all catalog
   prerequisites, and add announced session tweaks and safe creator rebuilding.
5. Extend roller support for verified exceptional modifiers and complete
   interchange, persistence and end-to-end accessibility verification.

Keep data local through CharacterRepository and Zod boundaries. Preserve unknown
references. Each phase needs formatting, typecheck, lint, unit/integration,
supported browser tests, production build and diff review before commit.
Publication and deployment require separate authorization.
