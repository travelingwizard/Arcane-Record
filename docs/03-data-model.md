# 03. Data model

IndexedDB stores a game-neutral `StoredCharacter` envelope with shared ID,
name, timestamps, registered `systemId`, integer `systemVersion`, and opaque
game-owned `data`. The shared repository never reads Mage fields.

The Mage adapter hydrates its editor model from that envelope. The existing
Mage editor model contains:

- `id`: UUID independent of name;
- an internal legacy-compatible `systemId`: literal `mage-m20`;
- `schemaVersion`: current integer schema version;
- ISO creation and update timestamps;
- `identity`: named string fields;
- `attributes`: grouped integer ratings;
- `abilities`: three groups of integer ratings;
- `spheres`: a record of integer ratings;
- `affinitySphere`: one Sphere ID or `null`;
- `enlightenment`: Arete, Willpower, temporary Willpower, Quintessence, and Paradox ratings;
- `repeatableEntries`: selected Backgrounds, Merits, Flaws, Focus data, owned
  Wonders, known Rotes, owned Equipment, and Maneuver preferences/selections;
- `health`: an ordered array of typed damage marks.

Ratings are integers. Dot and box controls derive their filled presentation from the rating rather than persisting Boolean arrays.

Merit and Flaw selections contain a selection UUID, stable definition ID, chosen legal cost, notes, and addition timestamp. Catalog descriptions and citations remain in reference data. Unknown imported definition IDs remain visible and preserved so the player can remove or repair them later.

Background selections contain a selection UUID, stable definition ID, character-specific display name, integer rating, notes, addition timestamp, and local pooling flag. Known definitions validate rating, repeatability, and pooling rules. Unknown definitions remain visible and preserved but are excluded from point accounting until repaired.

Focus selections reference separate Paradigm, Practice, and Instrument catalogs
or store a custom name. Wonders and Rotes likewise support catalog and custom
records. Unknown definition IDs are preserved. Catalog descriptions, citations,
review labels, and content labels are not copied into character records.

Equipment selections reference the separate catalog or remain fully custom.
The character owns the name, category, description, quantity, equipped state,
and notes. Unknown definition IDs remain visible. Catalog statistics and
citations stay outside character data.

Maneuver data separates universal reference shortcuts from learned options.
Combat favorites store stable reference IDs, custom Combat entries store
character-written content, and selected Do maneuvers store independent UUIDs
plus stable catalog IDs or custom names. Reference summaries and citations are
not copied into character data.

Exalted First Edition records use a separate game-owned schema. Schema version
3 adds Dragon-Blooded power selections as separate Charm and spell arrays.
Version 4 adds Dragon-Blooded Merit and Flaw arrays; each Trait selection stores
a UUID, stable catalog definition ID, chosen cost, choice label, and character
notes. Full descriptions, requirements, citations, and source-review flags stay
in bundled reference catalogs. Solar records must keep these Dragon-Blooded
arrays empty. Versions one and two migrate with empty power arrays, and versions
one through three migrate with empty Merit and Flaw arrays.

Exalted schema version 5 adds shared character-owned weapons, armor, shields,
and ammunition; a Classic or Power Combat profile with specialties and static
modifiers; saved character-specific Combos; and the shared Combat section-group
ID. Equipment definitions, profile statistics, Magical Material rules, Charm
Combo metadata, and source citations remain bundled reference data rather than
being copied into character records. Version-four and older Exalted records
migrate with empty collections and the Classic profile.

Stored and imported records are parsed with Zod at their boundaries. Invalid
records fail instead of silently entering editor state. Schema version 2 adds
Abilities and Enlightenment; version 3 adds temporary Willpower initialized
from the existing permanent rating; version 4 adds empty Merit and Flaw
selections; version 5 replaces legacy Background rows with catalog-backed
selections; and version 6 replaces Magick placeholder arrays with structured
Focus, Wonder, and Rote records. Version-5 Focus strings migrate into notes,
Wonder strings become custom owned Wonders, and legacy Rotes preserve their
IDs, Sphere text, and Effects. Version 7 adds an empty Equipment collection and
initializes the new `Do*` Skill to zero for schema-version-6 and older records.
Version 8 adds empty Combat favorites, custom Combat references, and known Do
maneuver selections to schema-version-7 and older records.

## Interface preferences

Section expansion state is not part of `MageCharacter` and does not change the
schema version. It is stored in `localStorage` under
`arcane-ledger:section-preferences:<character-id>` as a character ID and an
array of registered section IDs. Unknown future or removed IDs are ignored.
Active-section tracking is transient. Neither expansion nor active-section
state enters IndexedDB character records, JSON exports, or YAML exports.

Global shell appearance uses `arcane-record:global-preferences`. Mage 20 sheet
themes and identity overlays use `arcane-record:appearance-preferences`.
Neither preference enters character data or exchange files. See
`15-appearance-settings.md`.
