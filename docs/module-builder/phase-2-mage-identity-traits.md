# Phase 2, slices 1–3: Mage identity, Traits, and tracks

## Goal and boundary

These slices begin Mage behavioral parity without replacing or partially
converting the production Mage editor. They cover the stable definition ID
map, Identity, Attributes, Abilities, Spheres, affinity, Enlightenment,
Willpower, Quintessence/Paradox, Health, Build/Play protection, responsive
layout, and per-mode section-group ordering.

The package in `src/games/mage20/module/` is a validated bundled-module
candidate used by golden and browser fixtures. It is not registered for normal
character creation and there is no conversion button. Existing Mage records,
schema versions 1–10, imports, and exports remain unchanged.

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

Slices 2 and 3 add the safe `sphere-rating-wheel`,
`permanent-temporary-rating`, `opposed-wheel-20`, and
`cycling-damage-track` components. Nullable character-schema values represent
the optional affinity without sentinel strings. Sphere sorting and desktop
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

## Migration and persistence

There is no character or database migration in this slice. No production
character gets a `moduleRef`. Copy-first Mage conversion remains blocked until
the remaining owned data has a declarative schema and slices 2–6 pass parity;
creating a partial copy now would risk omitting valid character information.

## Remaining work

Phase 2 continues with:

1. Backgrounds and Merits/Flaws;
2. Focus, Wonders, Rotes, equipment, Maneuvers, and Special Do;
3. Experience, settings, file interchange, copy-first conversion, and opt-in
   preview activation.

Legacy Mage remains the production fallback through those slices.
