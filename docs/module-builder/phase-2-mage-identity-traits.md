# Phase 2: complete Mage 20 declarative parity

## Goal and boundary

Mage 20 now has a complete bundled declarative module covering the current
Arcane Record character data model. The existing Mage editor remains the
default and is not mutated or removed. A user may explicitly create a
module-backed copy from the character library; the source record remains
unchanged and the copy records its source character ID.

The module remains local-first. The bundled package and dependency lock are
loaded in memory alongside browser-installed packages. No server, account,
analytics, telemetry, or remote asset was added.

## Stable IDs

The module namespace is
`net.travelingwizard.arcane-record.mage20` and the first preview package version
is `0.2.0`. The ID map covers every current identity field, Attribute, Ability,
Sphere, Enlightenment Trait, Background, Merit, Flaw, Focus definition, Wonder,
Rote, equipment definition, combat maneuver, and Do maneuver.

Mappings use the existing machine ID as their source, never the visible label.
Legacy camel-case IDs receive explicit lowercase module IDs. A legacy ID that
cannot start a module slug, such as `108-plum-blossoms`, receives the stable
module ID `definition-108-plum-blossoms`. Unknown IDs return a visible fallback
record instead of disappearing.

## Runtime additions

Two core-owned component types were added:

- `field-grid` renders labeled string paths using semantic responsive columns;
- `grouped-dot-ratings` renders labeled groups of bounded integer ratings using
  the established Attribute or Ability presentation.

Nested paths are schema/type checked during module activation. Both components
use existing accessible inputs and `DotRating`; modules still cannot supply
markup, CSS, callbacks, or code.

Sheet templates can now declare a distinct group-order path for each mode.
Section summaries support constrained field slots, rating totals, and rated
counts. These are presentation strategies, not a general formula engine.

Later slices add the safe `sphere-rating-wheel`,
`permanent-temporary-rating`, `opposed-wheel-20`, and
`cycling-damage-track` components. Nullable character-schema values represent
the optional affinity without sentinel strings. Bounded Mage catalog and
collection adapters render Backgrounds, Merits/Flaws, Focus, Wonders, Rotes,
equipment, and Maneuvers using the established controls. Their paths and
catalog references are checked during activation. Sphere sorting and desktop
wheel display remain browser-local preferences; all views edit the same
integer ratings. The track components preserve independent 0–20 values and
Play-mode exceptions without storing Boolean cell arrays.

## Golden parity

The Mage fixture verifies:

- all nine identity fields;
- Physical, Social, and Mental Attributes with minimum 1 and maximum 5;
- all Talents, Skills, and Knowledges, including `Do*`, from 0 to 5;
- the existing identity fallback/priority summary;
- Attribute totals and non-zero Ability counts;
- editable identity in both modes and locked ratings in Play mode;
- independent Build and Play navigation order;
- autosave and the exact “Saved in this browser” message;
- one optional affinity shared by the sorted list and desktop wheel;
- independent Quintessence and Paradox values, Temporary Willpower display
  preference, and top-down cycling Health damage;
- desktop navigation, mobile Sections, and no overflow at 320 CSS pixels.
- Background, Merit/Flaw, Focus, Wonder, Rote, equipment, Maneuver, Special Do,
  and Experience data without copying catalogs into character records;
- Mage-specific Settings and JSON/YAML character-file v2 round trips.

## Migration and persistence

`convertMageCharacterToModuleCopy` runs the existing v1–v10 Mage migration and
validation path before validating the complete result against the declarative
sheet. It creates a fresh UUID and timestamp and stores the additive
`convertedFromCharacterId` provenance field. It never writes, renames, or
deletes the source record. The bundled package does not require a database
migration.

## Remaining work

New Mage characters still use the legacy renderer. Making the declarative
renderer the default is a separate P2 product decision after preview feedback;
the opt-in copy provides evidence without placing existing records at risk.
