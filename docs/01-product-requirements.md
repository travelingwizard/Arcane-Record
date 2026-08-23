# 01. Product requirements

## Library

The opening view is game-neutral and lists locally stored characters with game,
summary, and last-updated information. Users can search, filter by game, choose
a game before creation, open, duplicate, export, and delete characters. Delete
requires explicit confirmation. Unknown or invalid systems remain exportable.

## Mage editor

The editor provides:

- all nine identity fields;
- nine Attributes grouped into Physical, Social, and Mental;
- 34 Abilities grouped into Talents, Skills, and Knowledges, with `Do*` as the
  final Skill;
- a universal Combat Reference with 31 searchable, categorized maneuvers,
  character-specific favorites, and custom reference entries;
- Known Do Maneuvers with 12 Revised entries shown by default, 3 opt-in Legacy
  entries, custom maneuvers, notes, removal, and Undo;
- all nine Spheres as integer ratings from 0 to 5;
- one nullable affinity Sphere selected with an unboxed star;
- four local display sort modes;
- an optional circular wheel at desktop widths that edits the same Sphere data;
- Arete and Willpower dot tracks; a shared ten-position Quintessence/Paradox
  wheel where Quintessence uses dots, Paradox uses X marks, and Paradox wins
  visual overlaps; plus a temporary Willpower track that defaults to boxes and
  can use dots through Mage sheet Settings;
- optional Backgrounds selected from a searchable, cited catalog, with dot ratings and creation-point totals;
- seven sequential Health boxes with bashing, lethal, and aggravated damage;
- optional Merits and Flaws selected from a searchable, cited catalog, with projected and current point totals;
- editable Focus with catalog or custom Paradigms, Practices, Instruments,
  personal Need, cultural context, notes, and significant-instrument markers;
- editable Wonders with catalog or custom names, types, optional ratings,
  powers, and notes;
- editable Rotes with catalog or custom names, structured Sphere requirements,
  free-form alternatives, Effects, Focus notes, and character notes;
- editable Equipment with a searchable catalog of melee weapons, ranged
  weapons, armor, and field gear; custom name-and-description entries;
  quantity; equipped state; and character notes;
- validated local JSON and YAML import/export;
- debounced autosave status;
- explicit reference-preview labeling for supplied Magick citations that still
  require source verification.

## Exalted First Edition editor

Creation offers Solar and Dragon-Blooded sheet variants after the user selects
Exalted First Edition. Choosing either variant creates the browser-local record
and opens its sheet immediately; there is no separate confirmation step. Both
foundations provide their source-sheet identity
fields, nine Attributes, 25 sheet-grouped Abilities, favored markers,
sheet-specific Backgrounds, Virtues, Willpower, Essence and pools, and initial
notes. Solar characters also expose Limit Break. Both use the core desktop left
rail and mobile Sections sheet; pencil mode reorders section groups and the
sheet together. Source pages two through four remain visibly labeled as
deferred and are not presented as editable features.

The editor exposes every visible major section through stable URL fragments.
At 70rem and wider, a grouped sticky rail identifies the active section. Below
70rem, a sticky Sections button opens a modal navigation sheet and major
sections become independent disclosures. Identity opens by default; hash
targets open automatically; multiple sections may remain expanded.

## Persistence language

Success reads "Saved in this browser". Pending and failure states read "Unsaved changes", "Saving locally...", and "Local save failed". The interface never suggests online backup.

Every registered game exposes Total Experience and Current Experience. Mage and
Burning Wheel store the two values directly as nonnegative integers. Exalted
calculates both from its authoritative experience ledger so purchases, refunds,
and adjustments remain internally consistent.

## Burning Wheel Gold + Codex editor

Creation offers Man, Dwarf, Elf, Orc, Roden, Great Wolf, and Troll as the second
step and opens the selected sheet immediately. Build mode provides a guided
burner for lifepaths, stat and shade allocation, skills, traits, relationships,
reputations, affiliations, gear, property, and resource accounting. Rules and
point limits are enforced by default with visible override settings. Play mode
locks burn inputs while keeping beliefs, instincts, Artha, wounds, advancement
tests, resource taxation, equipment state, and notes editable.

The module calculates derived values from burn inputs, uses the shared sheet
navigation, Settings, appearance, ordering, autosave, and local persistence,
and supports Arcane Record JSON/YAML, legacy Charred Black `.char` files, and an
original browser-generated PDF. `.char` export warns that Arcane Record-only
play history cannot be represented. Charred-derived catalogs and rules code are
distributed as an attributed GPL-3.0 module with corresponding-source and
build instructions.

## Accessibility

All inputs have programmatic labels. Dot tracks expose the trait and current value, work with pointer and keyboard, show focus, and support disabled/read-only modes. Section navigation uses semantic links and `aria-current`; disclosures expose `aria-expanded` and `aria-controls`; the mobile sheet traps focus, closes with Escape, restores focus on dismissal, and prevents background scrolling. Collapsing a section containing focus moves focus to its disclosure. Controls remain usable under browser zoom and at narrow widths.

## Acceptance scenarios

The core acceptance scenario creates a character, names it, sets Strength, Alertness, Forces, Arete, Backgrounds, and Health damage, marks Forces as affinity, selects a Merit and a Flaw, refreshes, and observes the same values and point totals. File exchange scenarios export the active character and import a validated copy under a fresh ID.

A Magick acceptance scenario records a catalog Paradigm, a custom significant
Instrument, a custom Wonder, and a Rote with structured Sphere requirements;
refreshes; and observes the same values in both the editor and a local export.

An Equipment acceptance scenario adds a catalog armor entry and custom field
gear, records ownership details, refreshes, and observes both entries in the
editor and local export. Catalog statistics remain reference-only and never
modify character ratings automatically.

A Maneuvers acceptance scenario favorites Dodge, records a custom Combat
Reference entry, adds a Revised Do maneuver and a custom Do maneuver,
refreshes, and observes the same values in the editor and local export.

## Combat and Do Maneuvers

Combat Reference is visible to every character and is not a learned-ability
list. It searches names, descriptions, source, and page; filters General,
Defensive, Close Combat, and Ranged categories; expands accessible cards; and
can place favorites first. Custom combat references require a name and
description and may also be favorited.

Known Do Maneuvers are character selections with independent UUIDs and stable
definition IDs. Revised entries appear by default. Legacy entries require an
explicit opt-in and remain clearly labeled. Custom entries and notes are
editable. No Do rating, maneuver-count limit, combat roll, damage roll, or
legality is enforced. The Final Blow remains classified as a Rote and is not
included in either maneuver catalog.

## Equipment

Nothing is selected by default. The catalog searches names, descriptions, and
citations; filters by family; hides mature material by default; and displays
the supplied combat or protection information as an unverified reference
preview. Custom equipment requires a name and description.

Owned entries support an editable name, category, description, quantity from 1
to 999, equipped/readied state, notes, removal, and one-step Undo. A catalog
definition may be selected once; quantity represents duplicates. Equipment
never changes Attributes, Abilities, damage, soak, dice pools, or other sheet
values automatically.

## Focus, Wonders, and Rotes

Reference catalogs are inspiration and selection aids, not a rules engine.
Unverified entries are labeled as previews, mature material is excluded by
default, and custom entries are always available. Seven starting Instruments
is advisory. The editor does not calculate Effect legality, difficulty,
vulgarity, Paradox, Wonder cost, or automatic Focus transcendence.

Character records store stable catalog IDs and character-specific values.
Reference descriptions and citations remain outside exports. Unknown imported
definition IDs stay visible and preserved.

## Backgrounds

Nothing is selected by default. The catalog searches names, alternate names, and descriptions; filters by source, rating range, points per dot, restriction, and repeatability; and supports name or cost sorting. Every result has an explicit Add button.

Selected Backgrounds have independent UUIDs, character-specific labels, integer ratings, notes, and optional local pooling state. Eight reviewed definitions support multiple instances; all others prevent accidental duplicates. Ratings above five are available only for definitions marked `1–5+`, up to an interface safety maximum of ten, with a Storyteller-approval notice.

Creation cost equals rating multiplied by the definition's one- or two-point multiplier. The standard allowance is seven points with warning-only enforcement. Unknown imported definitions remain visible and repairable but are excluded from totals until their multiplier is known.

## Merits and Flaws

Nothing is selected by default. The catalog searches names, aliases, and descriptions; filters by type, category, source, and point cost; and supports name or cost sorting. Fixed-cost entries add directly. Variable-cost entries require an explicit legal cost before Add is enabled.

The section displays current totals and projected totals before addition. Standard character creation grants benefits for at most seven Flaw points. Exceeding that amount produces a warning but never blocks editing, saving, or import. Selected entries support notes, legal cost changes, removal, and one-step Undo.
