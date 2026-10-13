# 06. Import and export

Mage schema 13 preserves optional Sphere Trait choices (affected Sphere,
pricing interpretation, justification, and approval timestamp) on selected
Merits/Flaws and creator drafts. Schema 12 source preferences also round-trip.
Neither migration reconstructs choices or changes previously recorded XP costs.

Mage creation and advancement records are supported by the production Mage
editor and JSON/YAML interchange. The experimental declarative Mage preview
does not support these new records; conversion is blocked when they contain
user data rather than silently discarding them.

The Save section saves the active character as JSON by default, offers YAML,
and imports `.json`, `.yaml`, and `.yml` files. All processing stays in the
browser.

Every new file uses a versioned `arcane-record-character` envelope containing
`formatVersion`, `systemId`, `systemVersion`, shared ID/name/timestamps, and an
opaque `character` value owned by the game module.

The boundary:

1. serialize only character data, excluding view preferences and save status;
2. include envelope `systemId` and `systemVersion`;
3. dispatch known systems through the registry and validate before any write;
4. recognize legacy Mage files only when their Mage marker and core shape are
   positively identified, then migrate them to `mage20`;
5. assign a new UUID and timestamps when importing as a copy;
6. add `(Imported)` through the game adapter;
7. surface parsing and validation errors without replacing an active character;
8. perform all parsing locally with no uploads.

`js-yaml` handles YAML serialization and parsing. Successful imports are opened as new records and then follow the same autosave flow as any other character.

Import hardening: a file must be no larger than `MAX_IMPORT_FILE_SIZE_BYTES`
(5 MB, measured in UTF-8 bytes, not JS string length) or it is rejected before
any parsing is attempted. YAML is parsed with `{ schema: JSON_SCHEMA, json:
true }`: `JSON_SCHEMA` restricts parsing to plain JSON-compatible types, so
custom or extended tags (`!!set`, `!!omap`, `!!binary`, `!!js/*`, and similar)
throw a clear `YAMLException` instead of silently producing an unexpected
shape; `json: true` makes a duplicate mapping key overwrite the earlier value
instead of throwing, matching normal JSON semantics. A module-backed
(`formatVersion: 2`) character file is validated against its resolved
`characterSchema` when the referenced module is installed. When the module is
not installed, the opaque `character` envelope field cannot be schema-checked,
so it is still rejected outright unless it is a plain, non-array object —
this keeps an uninstalled-module import either genuinely recoverable-raw or
rejected, never silently written to IndexedDB as an unusable row. In every
case, a failed import never replaces the currently open character.

Selected Merits and Flaws export only their selection UUID, definition ID, chosen cost, notes, and addition timestamp. Known definitions must use a legal catalog cost and the correct Merit or Flaw list. Unknown definition IDs are preserved as unresolved references; they remain visible and removable rather than being silently discarded.

Selected Backgrounds export their selection UUID, definition ID, character display name, integer rating, notes, addition timestamp, pooling state, and optional unresolved source name. Known definitions validate minimum and maximum ratings, the extended interface maximum of ten, duplicate rules, and pooling support. Unknown definition IDs remain visible, removable, and repairable. They are not assigned an invented cost multiplier.

Focus exports character selections, custom names, notes, significant Instrument
markers, Need, and cultural context. Wonders export owned names, types, ratings,
powers, and notes. Rotes export structured Sphere requirements, free-form
alternatives, Effects, Focus notes, and character notes. Reference summaries,
citations, review status, and mature-content labels are never included.

Equipment exports owned IDs, optional definition IDs, names, categories,
character descriptions, quantities, equipped state, notes, timestamps, and
optional unresolved names. Catalog statistics, summaries, citations, review
state, and content labels are excluded.

Maneuvers export Combat favorite IDs, custom Combat names/descriptions/notes,
and selected Do UUIDs, definition IDs or custom names, notes, timestamps, and
optional unresolved names. Combat and Do catalog summaries, sources, pages,
and citations are excluded.

The Save section defaults to JSON and provides YAML as an alternate local file
format. Imports accept both formats.

Schema-version-5 Magick placeholders migrate without loss: Focus strings become
general notes, Wonder strings become custom owned Wonders, and legacy Rote IDs,
Sphere text, and Effects are preserved.

Schema-version-6 records migrate with an empty Equipment collection.
Schema-version-7 records migrate with empty Maneuver collections.

Section expansion preferences and the transient active section are excluded
from both formats. Importing a character creates a fresh ID and therefore a
fresh, independent section-preference key.

The character’s Build/Play layout mode and both group orders are included so a
saved character keeps its chosen page and navigation arrangement.

Mage schema-version-11 files also include the guided-creation draft and
baseline, per-rule GM approvals, secondary Abilities, specialties, personal
details, and XP ledger. Reference descriptions remain outside character files.
Opening totals on older sheets migrate to one labeled ledger balance; the app
does not fabricate historical purchases.
