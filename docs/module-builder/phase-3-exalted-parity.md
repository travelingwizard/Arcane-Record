# Phase 3: Exalted First Edition declarative parity

## Goal and boundary

Exalted First Edition now has one bundled declarative package with a shared
root and Solar and Dragon-Blooded child nodes. The package reuses Arcane
Record's existing editable-sheet systems; it does not add a character-creation
rules engine. Legacy editors and records remain available and unchanged.

Users opt in through **Preview module copy** in the character library. The copy
has a fresh UUID, retains the source character, and stores
`convertedFromCharacterId`. The module is loaded locally with a deterministic
dependency lock and has no backend, account, telemetry, or remote assets.

## Hierarchy and catalogs

The package ID is `org.travelingwizard.arcane-record.exalted1e`, version
`1.0.0`. Its hierarchy is:

- `exalted-first-edition`, containing shared languages, Backgrounds,
  Derangements, equipment, possessions, combat, and advancement systems;
- `solar`, adding Solar Background availability and Limit;
- `dragon-blooded`, adding Dragon-Blooded Background availability, Merits and
  Flaws, Charms and Sorcery, and advancement overrides.

The Dragon-Blooded child consumes all 80 selectable Trait definitions, 320
Charms, and 99 Terrestrial/Emerald Circle spells from module catalog payloads.
Source/page, requirements, duplicate rules, Storyteller warnings, prerequisite
guidance, and XP explanations remain available through the existing focused
components. Equipment and language selectors likewise consume the module
catalog payload rather than copying reference definitions into character data.

Solar Merits/Flaws and power catalogs are explicitly labeled preview
placeholders. The module does not invent missing Solar reference material.

## Safe component adapter

The closed component registry adds one `exalted1e-section` type with a bounded
kind enum. It cannot supply markup, scripts, CSS, callbacks, formulas, or
network behavior. Core-owned adapters reuse the existing Languages,
Derangements, Merits/Flaws, Charms/Sorcery, Equipment, Combat, Combo,
Possessions, and Experience components.

Identity and permanent ratings are protected in Play mode. Temporary
Willpower, Essence pools, Solar Limit, combat state, possessions, Derangement
status, and advancement records remain editable. Both modes keep independent
saved navigation-group order and use the shared desktop rail, mobile Sections
sheet, pencil-gated reordering, Settings, themes, autosave, JSON/YAML files,
and the exact “Saved in this browser” confirmation.

## Unresolved references

Module-owned reference instances include an optional structured unresolved
record. When a definition is missing, conversion preserves:

- the original definition ID;
- fallback label, summary, source, and page fields;
- repair notes;
- a JSON serialization of remaining owned fields.

The selected record remains visible, editable where applicable, removable,
and exportable. Catalog data is never copied into recognized character
records. This behavior covers Backgrounds, languages, Derangements,
Merits/Flaws, powers, and equipment. Legacy availability refinements remain in
place for legacy sheets.

## Migration and parity

`convertExaltedCharacterToModuleCopy` runs the existing adjacent v1–v6 data
migrations before module normalization. Both Solar and Dragon-Blooded copies
retain identity, ratings, selected records, UUIDs, links, play state, notes,
and section order. It adds module-only Build/Play mode order without changing
the legacy source.

Golden tests cover hierarchy inheritance, shared-definition uniqueness,
Dragon-Blooded override resolution, catalog counts and unique IDs, all six
legacy schema versions, both variants, unknown references, deterministic
bundling, source preservation, Play protections, mobile navigation, and
320-pixel overflow. Existing Exalted tests continue to cover Linguistics,
Derangement linking, Great Curse separation, Trait costs/repeats, power
prerequisites, Classic/Power combat, equipment, Combos, XP discounts,
downtime, persistence, and import/export.

## Remaining decision

New Exalted characters still use legacy editors. Making either declarative
sheet the creation default is a separate P2 decision after preview feedback;
the fallback window and copy provenance remain intact.
